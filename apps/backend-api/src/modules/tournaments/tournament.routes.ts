import { FastifyInstance } from 'fastify';
import {
  getTournaments,
  getTournamentById,
  joinSlot,
  createTournament,
} from './tournament.controller';
import { verifyAuth, verifyAdmin } from '../../middleware/auth';

export async function tournamentRoutes(fastify: FastifyInstance) {
  fastify.get('/', getTournaments);
  fastify.get('/:id', getTournamentById);
  fastify.post('/:id/join', { preHandler: [verifyAuth] }, joinSlot);
  fastify.post('/', { preHandler: [verifyAdmin] }, createTournament);
}
