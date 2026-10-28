import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './src/config.js';
import { initDatabase } from './src/database/db.js';
import { apiRoutes } from './src/routes/api.js';
import { authRoutes } from './src/routes/authRoutes.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite Database schema
initDatabase();

const fastify = Fastify({
  logger: true,
  disableRequestLogging: false,
});

// Register CORS for frontend & API clients
await fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Serve frontend UI
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
});

// Register API & Auth routes
await fastify.register(apiRoutes);
await fastify.register(authRoutes);


// Graceful start
const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`\n======================================================`);
    console.log(`OmniPrice Backend Engine`);
    console.log(`Web Interface: http://localhost:${config.port}`);
    console.log(`Auth: POST /api/auth/register & /api/auth/login`);
    console.log(`Search: GET /api/search?q=macbook`);
    console.log(`Stats:  GET /api/stats`);
    console.log(`======================================================\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
