import { FastifyInstance } from 'fastify';
import {
  ingestKillfeed,
  reportAnomaly,
  adminBanPlayer,
  adminGetAntiCheatLogs,
} from './security.controller';
import { verifyAdmin } from '../../middleware/auth';

export async function securityRoutes(fastify: FastifyInstance) {
  // Bot webhooks
  fastify.post('/webhook/killfeed', ingestKillfeed);
  fastify.post('/webhook/anomaly', reportAnomaly);

  // Admin Anti-Cheat management
  fastify.get('/admin/logs', { preHandler: [verifyAdmin] }, adminGetAntiCheatLogs);
  fastify.post('/admin/ban', { preHandler: [verifyAdmin] }, adminBanPlayer);
}
