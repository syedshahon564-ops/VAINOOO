import { prisma } from '../config/prisma';

export interface WebhookPaymentInput {
  provider: 'bkash' | 'nagad' | string;
  sender: string;
  amount: number | string;
  trx_id: string;
  raw_message?: string;
  timestamp?: string;
}

export interface VerifyDepositInput {
  user_id: string;
  trx_id: string;
  expected_amount?: number;
}

export class PaymentService {
  /**
   * Helper: Normalize & sanitize transaction ID
   * Strips spaces, special chars, and converts to uppercase
   */
  public static sanitizeTrxId(trxId: string): string {
    return (trxId || '').trim().toUpperCase();
  }

  /**
   * 1. Webhook Ingestion
   * Stores incoming payment from forwarder with UNCLAIMED status
   */
  public static async ingestPayment(data: WebhookPaymentInput) {
    const sanitizedTrxId = this.sanitizeTrxId(data.trx_id);

    if (!sanitizedTrxId) {
      throw { statusCode: 400, code: 'INVALID_TRX_ID', message: 'Transaction ID cannot be empty' };
    }

    const parsedAmount = typeof data.amount === 'string' ? parseFloat(data.amount) : Number(data.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw { statusCode: 400, code: 'INVALID_AMOUNT', message: 'Transaction amount must be a valid positive number' };
    }

    const normalizedProvider = data.provider.toUpperCase().includes('NAGAD') ? 'NAGAD' : 'BKASH';
    const sanitizedSender = (data.sender || '').trim();

    // Check for duplicate trx_id (Idempotency check)
    const existingPayment = await prisma.incomingPayment.findUnique({
      where: { trxId: sanitizedTrxId },
    });

    if (existingPayment) {
      console.log(`[WEBHOOK] Idempotent hit: TrxID ${sanitizedTrxId} already exists in database with status ${existingPayment.status}.`);
      return {
        isDuplicate: true,
        payment: existingPayment,
      };
    }

    // Insert incoming payment with UNCLAIMED status
    const newPayment = await prisma.incomingPayment.create({
      data: {
        trxId: sanitizedTrxId,
        provider: normalizedProvider,
        sender: sanitizedSender,
        amount: parsedAmount,
        status: 'UNCLAIMED',
        rawPayload: JSON.stringify(data),
      },
    });

    console.log(`[WEBHOOK] Successfully recorded ${normalizedProvider} deposit: TrxID=${sanitizedTrxId}, Sender=${sanitizedSender}, Amount=${parsedAmount}`);

    return {
      isDuplicate: false,
      payment: newPayment,
    };
  }

  /**
   * 2. User Deposit Verification
   * Atomically verifies transaction, prevents double-credit, credits balance, and logs deposit.
   */
  public static async verifyDeposit(input: VerifyDepositInput) {
    const sanitizedTrxId = this.sanitizeTrxId(input.trx_id);
    const userId = (input.user_id || '').trim();

    if (!userId) {
      return {
        status: 'ERROR',
        message: 'user_id is required',
      };
    }

    if (!sanitizedTrxId) {
      return {
        status: 'ERROR',
        message: 'trx_id is required',
      };
    }

    // Step 1: Find incoming payment by Trx ID
    const payment = await prisma.incomingPayment.findUnique({
      where: { trxId: sanitizedTrxId },
    });

    // Step 2: Race condition handler (SMS hasn't arrived yet)
    if (!payment) {
      return {
        status: 'PENDING',
        message: 'Payment notification not yet received. Please wait 1-2 minutes for SMS forwarding and retry.',
        trx_id: sanitizedTrxId,
      };
    }

    // Step 3: Already claimed check
    if (payment.status === 'CLAIMED') {
      return {
        status: 'ALREADY_USED',
        message: 'This transaction ID has already been claimed and credited.',
        trx_id: sanitizedTrxId,
        claimed_by: payment.claimedBy,
        claimed_at: payment.claimedAt,
      };
    }

    // Optional: Validate expected amount if provided
    if (input.expected_amount !== undefined && input.expected_amount !== null) {
      const expAmount = Number(input.expected_amount);
      if (!isNaN(expAmount) && Math.abs(expAmount - payment.amount) > 0.01) {
        return {
          status: 'AMOUNT_MISMATCH',
          message: `Amount mismatch: Expected ৳${expAmount}, but SMS received ৳${payment.amount}.`,
          received_amount: payment.amount,
          expected_amount: expAmount,
          trx_id: sanitizedTrxId,
        };
      }
    }

    // Step 4: Atomic transaction execution
    // 1. Mark payment as CLAIMED (with strict condition where status is UNCLAIMED to prevent race-condition concurrency)
    // 2. Increment user balance
    // 3. Create DepositLog audit entry
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Atomic update of payment record
        const updatedPayment = await tx.incomingPayment.update({
          where: {
            trxId: sanitizedTrxId,
            status: 'UNCLAIMED', // Guaranteed row-level lock against concurrent requests
          },
          data: {
            status: 'CLAIMED',
            claimedBy: userId,
            claimedAt: new Date(),
          },
        });

        // Upsert user to ensure user exists and increment balance atomically
        const user = await tx.user.upsert({
          where: { id: userId },
          update: {
            balance: { increment: updatedPayment.amount },
          },
          create: {
            id: userId,
            username: `player_${userId.substring(0, 8)}`,
            balance: updatedPayment.amount,
          },
        });

        // Create immutable DepositLog
        const depositLog = await tx.depositLog.create({
          data: {
            userId: user.id,
            trxId: updatedPayment.trxId,
            amount: updatedPayment.amount,
            status: 'SUCCESS',
            processedAt: new Date(),
          },
        });

        return {
          updatedPayment,
          user,
          depositLog,
        };
      });

      console.log(`[DEPOSIT] Successfully credited ৳${result.updatedPayment.amount} to user ${userId} via TrxID ${sanitizedTrxId}. New balance: ৳${result.user.balance}`);

      return {
        status: 'SUCCESS',
        message: 'Deposit verified and balance credited successfully.',
        data: {
          user_id: result.user.id,
          username: result.user.username,
          previous_balance: result.user.balance - result.updatedPayment.amount,
          amount_credited: result.updatedPayment.amount,
          new_balance: result.user.balance,
          provider: result.updatedPayment.provider,
          trx_id: result.updatedPayment.trxId,
          claimed_at: result.updatedPayment.claimedAt,
          deposit_log_id: result.depositLog.id,
        },
      };
    } catch (txError: any) {
      // If transaction failed because payment was already updated concurrently
      const recheckedPayment = await prisma.incomingPayment.findUnique({
        where: { trxId: sanitizedTrxId },
      });

      if (recheckedPayment && recheckedPayment.status === 'CLAIMED') {
        return {
          status: 'ALREADY_USED',
          message: 'This transaction ID has already been claimed by another request.',
          trx_id: sanitizedTrxId,
          claimed_by: recheckedPayment.claimedBy,
          claimed_at: recheckedPayment.claimedAt,
        };
      }

      console.error('[DEPOSIT_TX_ERROR]', txError);
      throw txError;
    }
  }

  /**
   * Helper: Get payment statistics and recent transactions for admin inspection
   */
  public static async getStats() {
    const totalPayments = await prisma.incomingPayment.count();
    const unclaimedPayments = await prisma.incomingPayment.count({ where: { status: 'UNCLAIMED' } });
    const claimedPayments = await prisma.incomingPayment.count({ where: { status: 'CLAIMED' } });
    const recentIncoming = await prisma.incomingPayment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return {
      total: totalPayments,
      unclaimed: unclaimedPayments,
      claimed: claimedPayments,
      recent: recentIncoming,
    };
  }
}
