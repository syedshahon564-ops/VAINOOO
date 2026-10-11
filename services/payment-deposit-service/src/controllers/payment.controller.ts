import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PaymentService } from '../services/payment.service';

// Validation schema for Webhook payload
const webhookPayloadSchema = z.object({
  provider: z.string().min(1, 'Provider is required (bkash or nagad)'),
  sender: z.string().min(1, 'Sender phone number is required'),
  amount: z.union([z.number(), z.string()]).refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  trx_id: z.string().min(1, 'trx_id is required'),
  raw_message: z.string().optional(),
  timestamp: z.string().optional(),
});

// Validation schema for User Deposit Verification
const verifyDepositPayloadSchema = z.object({
  user_id: z.string().min(1, 'user_id is required'),
  trx_id: z.string().min(1, 'trx_id is required'),
  expected_amount: z.union([z.number(), z.string()]).optional().transform((val) => (val !== undefined ? Number(val) : undefined)),
});

export class PaymentController {
  /**
   * POST /api/webhook/payment
   * Ingest SMS/Notification forwarded from phone
   */
  public static async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedData = webhookPayloadSchema.parse(req.body);

      const result = await PaymentService.ingestPayment({
        provider: parsedData.provider,
        sender: parsedData.sender,
        amount: parsedData.amount,
        trx_id: parsedData.trx_id,
        raw_message: parsedData.raw_message,
        timestamp: parsedData.timestamp,
      });

      if (result.isDuplicate) {
        return res.status(200).json({
          success: true,
          status: 'DUPLICATE',
          message: 'Webhook received previously (idempotent duplicate skipped)',
          trx_id: result.payment.trxId,
          payment_status: result.payment.status,
        });
      }

      return res.status(201).json({
        success: true,
        status: 'STORED',
        message: 'Incoming payment stored successfully with status UNCLAIMED',
        data: {
          id: result.payment.id,
          trx_id: result.payment.trxId,
          provider: result.payment.provider,
          amount: result.payment.amount,
          sender: result.payment.sender,
          status: result.payment.status,
          created_at: result.payment.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/deposit/verify
   * Verify deposit submitted by user, credit balance atomically
   */
  public static async handleVerifyDeposit(req: Request, res: Response, next: NextFunction) {
    try {
      const parsedData = verifyDepositPayloadSchema.parse(req.body);

      const result = await PaymentService.verifyDeposit({
        user_id: parsedData.user_id,
        trx_id: parsedData.trx_id,
        expected_amount: parsedData.expected_amount,
      });

      switch (result.status) {
        case 'SUCCESS':
          return res.status(200).json({
            success: true,
            status: 'SUCCESS',
            message: result.message,
            data: result.data,
          });

        case 'PENDING':
          return res.status(200).json({
            success: false,
            status: 'PENDING',
            message: result.message,
            trx_id: result.trx_id,
          });

        case 'ALREADY_USED':
          return res.status(400).json({
            success: false,
            status: 'ALREADY_USED',
            message: result.message,
            trx_id: result.trx_id,
            claimed_by: (result as any).claimed_by,
            claimed_at: (result as any).claimed_at,
          });

        case 'AMOUNT_MISMATCH':
          return res.status(400).json({
            success: false,
            status: 'AMOUNT_MISMATCH',
            message: result.message,
            received_amount: (result as any).received_amount,
            expected_amount: (result as any).expected_amount,
            trx_id: result.trx_id,
          });

        default:
          return res.status(400).json({
            success: false,
            status: result.status,
            message: result.message,
          });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/webhook/stats
   * Admin inspection of queued payments (secured with x-api-key)
   */
  public static async handleGetStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await PaymentService.getStats();
      return res.status(200).json({
        success: true,
        stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
