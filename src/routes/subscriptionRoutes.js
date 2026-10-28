import { getAllPlans, upgradeUserPlan, cancelUserSubscription, getUserSubscriptionHistory } from '../services/subscriptionService.js';
import { getUserFromToken } from '../services/authService.js';

export async function subscriptionRoutes(fastify, options) {
  // Get all available SaaS subscription plans
  fastify.get('/api/subscription/plans', async (request, reply) => {
    return {
      plans: getAllPlans(),
    };
  });

  // Upgrade user subscription (requires Bearer token)
  fastify.post('/api/subscription/upgrade', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const user = getUserFromToken(authHeader);

    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'You must be logged in to upgrade' });
    }

    try {
      const { planId, paymentMethod } = request.body || {};
      const result = upgradeUserPlan({
        userId: user.id,
        planId,
        paymentMethod,
      });

      return reply.status(200).send(result);
    } catch (error) {
      return reply.status(400).send({
        error: 'Upgrade Failed',
        message: error.message,
      });
    }
  });

  // Cancel subscription
  fastify.post('/api/subscription/cancel', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const user = getUserFromToken(authHeader);

    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'You must be logged in to cancel' });
    }

    try {
      const result = cancelUserSubscription(user.id);
      return reply.status(200).send(result);
    } catch (error) {
      return reply.status(400).send({
        error: 'Cancellation Failed',
        message: error.message,
      });
    }
  });

  // Get billing history
  fastify.get('/api/subscription/history', async (request, reply) => {
    const authHeader = request.headers.authorization;
    const user = getUserFromToken(authHeader);

    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'You must be logged in' });
    }

    const history = getUserSubscriptionHistory(user.id);
    return { history };
  });
}
