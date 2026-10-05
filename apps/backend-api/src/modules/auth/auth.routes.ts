import { FastifyInstance } from 'fastify';
import { register, login, getProfile } from './auth.controller';
import { verifyAuth } from '../../middleware/auth';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', register);
  fastify.post('/login', login);
  fastify.get('/profile', { preHandler: [verifyAuth] }, getProfile);
}
