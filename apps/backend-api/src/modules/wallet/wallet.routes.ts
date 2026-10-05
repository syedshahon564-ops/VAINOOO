import { FastifyInstance } from 'fastify';
import {
  requestDeposit,
  requestWithdrawal,
  getTransactions,
  adminGetTransactions,
  adminApproveTransaction,
  adminRejectTransaction,
} from './wallet.controller';
import { verifyAuth, verifyAdmin } from '../../middleware/auth';

export async function walletRoutes(fastify: FastifyInstance) {
  // Player endpoints
  fastify.post('/deposit', { preHandler: [verifyAuth] }, requestDeposit);
  fastify.post('/withdraw', { preHandler: [verifyAuth] }, requestWithdrawal);
  fastify.get('/history', { preHandler: [verifyAuth] }, getTransactions);

  // Admin endpoints
  fastify.get('/admin/list', { preHandler: [verifyAdmin] }, adminGetTransactions);
  fastify.post('/admin/:id/approve', { preHandler: [verifyAdmin] }, adminApproveTransaction);
  fastify.post('/admin/:id/reject', { preHandler: [verifyAdmin] }, adminRejectTransaction);
}
