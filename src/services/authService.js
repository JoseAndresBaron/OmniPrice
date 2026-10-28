import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/db.js';
import { PLANS } from '../config/plans.js';

const JWT_SECRET = process.env.JWT_SECRET || 'omniprice-super-secret-jwt-key-2026';
const JWT_EXPIRES_IN = '7d';

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

// Sanitize user for public responses
function sanitizeUser(user) {
  if (!user) return null;
  const today = getTodayString();
  let searchesToday = user.searches_today || 0;

  // Auto reset if date changed
  if (user.last_search_date !== today) {
    searchesToday = 0;
  }

  const plan = PLANS[user.tier] || PLANS.free;
  const searchesLeft = Math.max(0, plan.dailySearchLimit - searchesToday);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    tier: user.tier,
    planDetails: plan,
    searchesToday,
    searchesLeft,
    dailyLimit: plan.dailySearchLimit,
    createdAt: user.created_at,
  };
}

export async function registerUser({ email, password, name }) {
  if (!email || !password || !name) {
    throw new Error('Email, password, and name are required');
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Invalid email address format');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  // Check if user already exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    throw new Error('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();
  const today = getTodayString();

  const insertStmt = db.prepare(`
    INSERT INTO users (email, password_hash, name, tier, searches_today, last_search_date, created_at)
    VALUES (?, ?, ?, 'free', 0, ?, ?)
  `);

  const result = insertStmt.run(cleanEmail, passwordHash, name.trim(), today, now);
  const userId = result.lastInsertRowid;

  // Create initial free subscription record
  const subStmt = db.prepare(`
    INSERT INTO subscriptions (user_id, plan, status, price_cents, current_period_start, current_period_end, created_at)
    VALUES (?, 'free', 'active', 0, ?, ?, ?)
  `);
  const oneYearLater = new Date();
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  subStmt.run(userId, now, oneYearLater.toISOString(), now);

  const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    user: sanitizeUser(newUser),
    token,
  };
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  const today = getTodayString();
  if (user.last_search_date !== today) {
    db.prepare('UPDATE users SET searches_today = 0, last_search_date = ? WHERE id = ?').run(today, user.id);
    user.searches_today = 0;
    user.last_search_date = today;
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    user: sanitizeUser(user),
    token,
  };
}

export function getUserFromToken(token) {
  try {
    if (!token) return null;
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const decoded = jwt.verify(cleanToken, JWT_SECRET);
    if (!decoded || !decoded.userId) return null;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
    if (!user) return null;

    const today = getTodayString();
    if (user.last_search_date !== today) {
      db.prepare('UPDATE users SET searches_today = 0, last_search_date = ? WHERE id = ?').run(today, user.id);
      user.searches_today = 0;
      user.last_search_date = today;
    }

    return sanitizeUser(user);
  } catch (err) {
    return null;
  }
}

// Check quota and increment daily search count
export function checkAndIncrementQuota(userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const today = getTodayString();
  let searchesToday = user.searches_today || 0;

  if (user.last_search_date !== today) {
    searchesToday = 0;
  }

  const plan = PLANS[user.tier] || PLANS.free;

  if (searchesToday >= plan.dailySearchLimit) {
    const error = new Error(`Daily search limit reached (${plan.dailySearchLimit}/${plan.dailySearchLimit} searches used). Upgrade your plan for unlimited searches.`);
    error.code = 'QUOTA_EXCEEDED';
    error.plan = user.tier;
    error.limit = plan.dailySearchLimit;
    throw error;
  }

  // Increment usage
  db.prepare(`
    UPDATE users 
    SET searches_today = ?, last_search_date = ?
    WHERE id = ?
  `).run(searchesToday + 1, today, userId);

  return {
    searchesUsed: searchesToday + 1,
    searchesLeft: plan.dailySearchLimit - (searchesToday + 1),
    limit: plan.dailySearchLimit,
    tier: user.tier,
  };
}
