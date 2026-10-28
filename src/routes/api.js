import { searchProducts, getMetrics } from '../services/productService.js';
import { TRUSTED_RETAILERS } from '../config.js';
import { getUserFromToken, checkAndIncrementQuota } from '../services/authService.js';
import { db } from '../database/db.js';

export async function apiRoutes(fastify, options) {
  // Search endpoint with Auth & Quota Enforcement
  fastify.get('/api/search', async (request, reply) => {
    const { q, onlyTrusted, sortBy, limit, country } = request.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Query parameter "q" is required (e.g. /api/search?q=Nintendo+Switch)',
      });
    }

    // Check authentication and quota if user is logged in
    const authHeader = request.headers.authorization;
    let user = null;
    let quotaInfo = null;

    if (authHeader) {
      user = getUserFromToken(authHeader);
      if (user) {
        try {
          quotaInfo = checkAndIncrementQuota(user.id);
        } catch (quotaErr) {
          if (quotaErr.code === 'QUOTA_EXCEEDED') {
            return reply.status(403).send({
              error: 'QUOTA_EXCEEDED',
              message: quotaErr.message,
              plan: quotaErr.plan,
              limit: quotaErr.limit,
              upgradeUrl: '/#pricing',
            });
          }
          throw quotaErr;
        }
      }
    }

    try {
      const result = await searchProducts({
        query: q,
        country: country || 'us',
        language: 'en',
        limit: limit ? parseInt(limit, 10) : 20,
        onlyTrusted: onlyTrusted !== 'false',
        sortBy: sortBy || 'price_asc',
      });

      // Save search in history database
      try {
        db.prepare(`
          INSERT INTO search_history (user_id, query, results_count, best_price, best_store, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          user ? user.id : null,
          q.trim(),
          result.products.length,
          result.comparison ? result.comparison.lowestPrice : null,
          result.comparison ? result.comparison.bestDealStore : null,
          new Date().toISOString()
        );
      } catch (histErr) {
        // Non-blocking log
        request.log.warn('Failed to record search history:', histErr.message);
      }

      // Attach quota info to response
      if (quotaInfo) {
        result.meta.quota = quotaInfo;
      }

      // Set speed and cache debug headers
      reply.header('X-Response-Time-Ms', result.meta.responseDurationMs);
      reply.header('X-Cache-Status', result.meta.fromCache ? 'HIT' : 'MISS');

      return result;
    } catch (error) {
      request.log.error(error);
      return reply.status(502).send({
        error: 'Upstream Provider Error',
        message: error.message,
      });
    }
  });

  // Recent searches for logged in user or global trending
  fastify.get('/api/search/history', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const user = getUserFromToken(authHeader);

    const history = user
      ? db.prepare('SELECT * FROM search_history WHERE user_id = ? ORDER BY id DESC LIMIT 10').all(user.id)
      : db.prepare('SELECT query, COUNT(*) as count FROM search_history GROUP BY query ORDER BY count DESC LIMIT 6').all();

    return { history };
  });

  // Analytics & Cache metrics endpoint
  fastify.get('/api/stats', async (request, reply) => {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalSearches = db.prepare('SELECT COUNT(*) as count FROM search_history').get().count;
    const activeSubs = db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active' AND plan != 'free'").get().count;

    return {
      status: 'ok',
      metrics: getMetrics(),
      business: {
        totalUsers,
        totalSearches,
        paidSubscribers: activeSubs,
      },
      uptimeSeconds: Math.round(process.uptime()),
    };
  });

  // Trusted retailers list
  fastify.get('/api/trusted-stores', async (request, reply) => {
    return {
      count: TRUSTED_RETAILERS.length,
      stores: TRUSTED_RETAILERS.map((r) => r.name),
    };
  });

  // Healthcheck
  fastify.get('/api/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  });
}
