import { registerUser, loginUser, getUserFromToken } from '../services/authService.js';

export async function authRoutes(fastify, options) {
  // Register
  fastify.post('/api/auth/register', async (request, reply) => {
    try {
      const { email, password, name } = request.body || {};
      const result = await registerUser({ email, password, name });
      return reply.status(201).send(result);
    } catch (error) {
      return reply.status(400).send({
        error: 'Registration Failed',
        message: error.message,
      });
    }
  });

  // Login
  fastify.post('/api/auth/login', async (request, reply) => {
    try {
      const { email, password } = request.body || {};
      const result = await loginUser({ email, password });
      return reply.status(200).send(result);
    } catch (error) {
      return reply.status(401).send({
        error: 'Authentication Failed',
        message: error.message,
      });
    }
  });

  // Get current user profile & quota
  fastify.get('/api/auth/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'No authorization header provided' });
    }

    const user = getUserFromToken(authHeader);
    if (!user) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired session token' });
    }

    return { user };
  });
}
