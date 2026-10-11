import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { validateWebhookApiKey } from '../middleware/auth.middleware';
import { verifyDepositLimiter } from '../middleware/rate-limiter';

const router = Router();

/**
 * 1. Webhook Ingestion Endpoint
 * Accepts incoming forwarded SMS / notifications from mobile agent
 * Protected by secret x-api-key header
 */
router.post('/webhook/payment', validateWebhookApiKey, PaymentController.handleWebhook);

/**
 * 2. User Deposit Verification Endpoint
 * Called when a player or bot submits deposit verification request
 * Rate-limited to prevent brute-forcing
 */
router.post('/deposit/verify', verifyDepositLimiter, PaymentController.handleVerifyDeposit);

/**
 * 3. Inspection / Statistics Endpoint
 * Allows admin to check count of unclaimed vs claimed payments
 */
router.get('/webhook/stats', validateWebhookApiKey, PaymentController.handleGetStats);

export default router;
