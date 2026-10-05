import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@ff-esports/database';
import { z } from 'zod';

const depositSchema = z.object({
  method: z.enum(['BKASH', 'NAGAD', 'ROCKET']),
  amount: z.number().min(10, 'Minimum deposit is ৳10'),
  phone: z.string().min(11, 'Sender phone number is required'),
  trxId: z.string().min(6, 'Valid Transaction ID is required'),
});

const withdrawSchema = z.object({
  method: z.enum(['BKASH', 'NAGAD', 'ROCKET']),
  amount: z.number().min(50, 'Minimum withdrawal is ৳50'),
  phone: z.string().min(11, 'Recipient phone number is required'),
});

export async function requestDeposit(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const result = depositSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: 'Validation error', details: result.error.format() });
  }

  const { method, amount, phone, trxId } = result.data;

  // Check duplicate TrxID
  const existingTrx = await prisma.walletTransaction.findUnique({
    where: { trxId: trxId.trim().toUpperCase() },
  });
  if (existingTrx) {
    return reply.status(400).send({ error: 'This Transaction ID has already been submitted' });
  }

  const transaction = await prisma.walletTransaction.create({
    data: {
      userId,
      type: 'DEPOSIT',
      method,
      amount,
      phone,
      trxId: trxId.trim().toUpperCase(),
      status: 'PENDING',
    },
  });

  return reply.status(201).send({
    message: 'Deposit request submitted successfully! Funds will be added once verified by administration.',
    transaction,
  });
}

export async function requestWithdrawal(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const result = withdrawSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: 'Validation error', details: result.error.format() });
  }

  const { method, amount, phone } = result.data;

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      if (user.walletBalance < amount) {
        throw new Error(`Insufficient wallet balance. Requested: ৳${amount}, Available: ৳${user.walletBalance}`);
      }

      const updatedBalance = user.walletBalance - amount;
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: updatedBalance },
      });

      return await tx.walletTransaction.create({
        data: {
          userId,
          type: 'WITHDRAW',
          method,
          amount,
          phone,
          trxId: `WD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          status: 'PENDING',
          balanceAfter: updatedBalance,
        },
      });
    });

    return reply.status(201).send({
      message: 'Withdrawal request submitted successfully! Funds will arrive via bKash/Nagad shortly.',
      transaction,
    });
  } catch (err: any) {
    return reply.status(400).send({ error: err.message || 'Failed to submit withdrawal request' });
  }
}

export async function getTransactions(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const transactions = await prisma.walletTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  return reply.send({ transactions });
}

export async function adminGetTransactions(request: FastifyRequest, reply: FastifyReply) {
  const { status, type } = request.query as { status?: string; type?: string };
  const where: any = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const transactions = await prisma.walletTransaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { ign: true, phone: true, uid: true, walletBalance: true },
      },
    },
    take: 50,
  });

  return reply.send({ transactions });
}

export async function adminApproveTransaction(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };

  const tx = await prisma.walletTransaction.findUnique({
    where: { id },
  });

  if (!tx || tx.status !== 'PENDING') {
    return reply.status(400).send({ error: 'Transaction not found or already processed' });
  }

  await prisma.$transaction(async (prismaTx) => {
    if (tx.type === 'DEPOSIT') {
      // Credit wallet
      const user = await prismaTx.user.update({
        where: { id: tx.userId },
        data: { walletBalance: { increment: tx.amount } },
      });

      await prismaTx.walletTransaction.update({
        where: { id },
        data: {
          status: 'APPROVED',
          balanceAfter: user.walletBalance,
        },
      });
    } else if (tx.type === 'WITHDRAW') {
      // Already deducted at request time, just mark approved
      await prismaTx.walletTransaction.update({
        where: { id },
        data: { status: 'APPROVED' },
      });
    }
  });

  return reply.send({ message: 'Transaction approved successfully' });
}

export async function adminRejectTransaction(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { reason } = request.body as { reason?: string };

  const tx = await prisma.walletTransaction.findUnique({
    where: { id },
  });

  if (!tx || tx.status !== 'PENDING') {
    return reply.status(400).send({ error: 'Transaction not found or already processed' });
  }

  await prisma.$transaction(async (prismaTx) => {
    if (tx.type === 'WITHDRAW') {
      // Refund balance
      await prismaTx.user.update({
        where: { id: tx.userId },
        data: { walletBalance: { increment: tx.amount } },
      });
    }

    await prismaTx.walletTransaction.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminNote: reason || 'Rejected by administrator',
      },
    });
  });

  return reply.send({ message: 'Transaction rejected and balance refunded if applicable' });
}
