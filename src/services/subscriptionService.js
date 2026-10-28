import { db } from '../database/db.js';
import { PLANS } from '../config/plans.js';

export function getAllPlans() {
  return Object.values(PLANS);
}

export function upgradeUserPlan({ userId, planId, paymentMethod = 'card_mock_4242' }) {
  const plan = PLANS[planId];
  if (!plan) {
    throw new Error(`Invalid plan: ${planId}. Choose from 'free', 'pro', or 'enterprise'.`);
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30); // 30-day billing cycle

  const nowStr = now.toISOString();
  const periodEndStr = periodEnd.toISOString();

  const updateTx = db.transaction(() => {
    // 1. Update user tier
    db.prepare('UPDATE users SET tier = ? WHERE id = ?').run(planId, userId);

    // 2. Mark any existing active subscription as upgraded/superseded
    db.prepare(`
      UPDATE subscriptions 
      SET status = 'superseded' 
      WHERE user_id = ? AND status = 'active'
    `).run(userId);

    // 3. Insert new active subscription record
    const insertSub = db.prepare(`
      INSERT INTO subscriptions (
        user_id, plan, status, price_cents, current_period_start, current_period_end, created_at
      ) VALUES (?, ?, 'active', ?, ?, ?, ?)
    `);

    insertSub.run(userId, planId, plan.priceCents, nowStr, periodEndStr, nowStr);
  });

  updateTx();

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  return {
    success: true,
    message: `Successfully upgraded to ${plan.name}!`,
    plan: plan,
    userTier: updatedUser.tier,
    billingCycle: {
      startedAt: nowStr,
      expiresAt: periodEndStr,
      amountPaid: `$${(plan.priceCents / 100).toFixed(2)}`,
    },
  };
}

export function cancelUserSubscription(userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const updateTx = db.transaction(() => {
    db.prepare('UPDATE users SET tier = ? WHERE id = ?').run('free', userId);
    db.prepare(`
      UPDATE subscriptions 
      SET status = 'cancelled' 
      WHERE user_id = ? AND status = 'active'
    `).run(userId);
  });

  updateTx();

  return {
    success: true,
    message: 'Subscription cancelled. Account reverted to Free Starter plan.',
    tier: 'free',
  };
}

export function getUserSubscriptionHistory(userId) {
  return db.prepare(`
    SELECT * FROM subscriptions 
    WHERE user_id = ? 
    ORDER BY id DESC
  `).all(userId);
}
