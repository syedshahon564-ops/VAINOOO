import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { SocketManager } from './sockets';
import { authRoutes } from './modules/auth/auth.routes';
import { tournamentRoutes } from './modules/tournaments/tournament.routes';
import { walletRoutes } from './modules/wallet/wallet.routes';
import { roomRoutes } from './modules/rooms/room.routes';
import { securityRoutes } from './modules/security/security.routes';

dotenv.config();

const fastify = Fastify({
  logger: process.env.NODE_ENV !== 'production',
});

async function main() {
  // CORS
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // JWT
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'super_secret_esports_jwt_key_998877665544332211',
  });

  // Rate Limiting
  await fastify.register(rateLimit, {
    max: 150,
    timeWindow: '1 minute',
  });

  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
    service: 'ff-esports-backend-api',
    timestamp: new Date().toISOString(),
  }));

  // Register API modules under /api/v1
  fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  fastify.register(tournamentRoutes, { prefix: '/api/v1/tournaments' });
  fastify.register(walletRoutes, { prefix: '/api/v1/wallet' });
  fastify.register(roomRoutes, { prefix: '/api/v1/rooms' });
  fastify.register(securityRoutes, { prefix: '/api/v1/security' });

  const port = Number(process.env.PORT) || 5000;
  const host = process.env.API_HOST || '0.0.0.0';

  await fastify.listen({ port, host });
  console.log(`[FF-ESPORTS-API] Server running on http://${host}:${port}`);

  // Initialize Socket.io on Fastify's underlying HTTP server
  SocketManager.init(fastify.server);
  console.log(`[FF-ESPORTS-API] Socket.io real-time engine initialized`);
}

main().catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
