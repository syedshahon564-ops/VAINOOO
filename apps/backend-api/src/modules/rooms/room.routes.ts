import { FastifyInstance } from 'fastify';
import { getRoomCredentials, updateRoomCredentials } from './room.controller';
import { verifyAuth, verifyAdmin } from '../../middleware/auth';

export async function roomRoutes(fastify: FastifyInstance) {
  fastify.get('/:id/credentials', { preHandler: [verifyAuth] }, getRoomCredentials);
  fastify.post('/:id/credentials', { preHandler: [verifyAdmin] }, updateRoomCredentials);
}
