import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@ff-esports/database';
import { SocketManager } from '../../sockets';
import { z } from 'zod';

const createTournamentSchema = z.object({
  title: z.string().min(5),
  gameMode: z.enum(['BR_SOLO', 'BR_DUO', 'BR_SQUAD', 'CS_4V4']),
  mapType: z.enum(['BERMUDA', 'PURGATORY', 'KALAHARI', 'ALPINE', 'NEXTERRA']),
  entryFee: z.number().min(0),
  prizePool: z.number().min(0),
  firstPrize: z.number().min(0),
  secondPrize: z.number().min(0).default(0),
  thirdPrize: z.number().min(0).default(0),
  perKillPrize: z.number().min(0).default(0),
  totalSlots: z.number().int().min(4).max(48).default(48),
  matchTime: z.string(), // ISO String
});

const joinSlotSchema = z.object({
  slotNumber: z.number().int().min(1).max(48),
  teamName: z.string().optional(),
});

export async function getTournaments(request: FastifyRequest, reply: FastifyReply) {
  const { status } = request.query as { status?: string };
  const where: any = {};
  if (status) {
    where.status = status;
  }

  const tournaments = await prisma.tournament.findMany({
    where,
    orderBy: { matchTime: 'asc' },
    select: {
      id: true,
      title: true,
      gameMode: true,
      mapType: true,
      entryFee: true,
      prizePool: true,
      firstPrize: true,
      secondPrize: true,
      thirdPrize: true,
      perKillPrize: true,
      totalSlots: true,
      filledSlots: true,
      status: true,
      matchTime: true,
      revealAt: true,
      createdAt: true,
    },
  });

  return reply.send({ tournaments });
}

export async function getTournamentById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      participants: {
        select: {
          slotNumber: true,
          teamName: true,
          userId: true,
          user: {
            select: { ign: true, uid: true },
          },
        },
      },
    },
  });

  if (!tournament) {
    return reply.status(404).send({ error: 'Tournament not found' });
  }

  // Construct 1..totalSlots map
  const slots = Array.from({ length: tournament.totalSlots }, (_, i) => {
    const slotNum = i + 1;
    const participant = tournament.participants.find((p) => p.slotNumber === slotNum);
    return {
      slotNumber: slotNum,
      isOccupied: !!participant,
      userId: participant?.userId,
      ign: participant?.user.ign,
      teamName: participant?.teamName,
    };
  });

  // Do not expose roomId & roomPass directly here (use /rooms endpoint which checks time and user membership)
  const { roomId, roomPass, ...safeTournament } = tournament;

  return reply.send({
    tournament: {
      ...safeTournament,
      slots,
    },
  });
}

export async function joinSlot(request: FastifyRequest, reply: FastifyReply) {
  const { id: tournamentId } = request.params as { id: string };
  const userId = request.user!.userId;

  const result = joinSlotSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: 'Invalid slot number', details: result.error.format() });
  }

  const { slotNumber, teamName } = result.data;

  // Run atomic ACID transaction
  try {
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch user wallet
      const user = await tx.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new Error('User not found');

      // 2. Fetch tournament
      const tournament = await tx.tournament.findUnique({
        where: { id: tournamentId },
      });
      if (!tournament) throw new Error('Tournament not found');

      if (tournament.status !== 'UPCOMING') {
        throw new Error('Tournament registration is closed for this match');
      }

      if (slotNumber > tournament.totalSlots) {
        throw new Error('Invalid slot number for this game mode');
      }

      // 3. Check wallet balance
      if (user.walletBalance < tournament.entryFee) {
        throw new Error(`Insufficient wallet balance. Match fee: ৳${tournament.entryFee}, Available: ৳${user.walletBalance}`);
      }

      // 4. Check if slot already taken
      const existingSlot = await tx.tournamentParticipant.findUnique({
        where: {
          tournamentId_slotNumber: { tournamentId, slotNumber },
        },
      });
      if (existingSlot) {
        throw new Error(`Slot #${slotNumber} is already booked by another player`);
      }

      // 5. Check if user already in tournament
      const alreadyJoined = await tx.tournamentParticipant.findUnique({
        where: {
          tournamentId_userId: { tournamentId, userId },
        },
      });
      if (alreadyJoined) {
        throw new Error('You are already registered in this tournament');
      }

      // 6. Deduct wallet & create ledger transaction
      const updatedBalance = user.walletBalance - tournament.entryFee;
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: updatedBalance },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          type: 'ENTRY_FEE',
          method: 'BKASH',
          amount: tournament.entryFee,
          phone: user.phone,
          trxId: `ENTRY-${tournamentId.slice(0, 8)}-${Date.now()}`,
          status: 'APPROVED',
          balanceAfter: updatedBalance,
        },
      });

      // 7. Add participant
      const participant = await tx.tournamentParticipant.create({
        data: {
          tournamentId,
          userId,
          slotNumber,
          teamName: teamName || user.ign,
        },
      });

      // 8. Increment slot count
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { filledSlots: { increment: 1 } },
      });

      return { participant, newBalance: updatedBalance };
    });

    // Notify sockets
    SocketManager.getInstance().emitSlotUpdate(tournamentId, {
      slotNumber,
      userId,
      ign: request.user!.ign,
      teamName,
      isOccupied: true,
    });

    return reply.status(201).send({
      message: `Successfully booked Slot #${slotNumber}!`,
      slotNumber,
      newWalletBalance: transactionResult.newBalance,
    });
  } catch (err: any) {
    return reply.status(400).send({ error: err.message || 'Failed to join tournament' });
  }
}

export async function createTournament(request: FastifyRequest, reply: FastifyReply) {
  const result = createTournamentSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: 'Validation error', details: result.error.format() });
  }

  const data = result.data;
  const matchDate = new Date(data.matchTime);
  // Reveal credentials 15 minutes before matchTime
  const revealDate = new Date(matchDate.getTime() - 15 * 60 * 1000);

  const tournament = await prisma.tournament.create({
    data: {
      title: data.title,
      gameMode: data.gameMode,
      mapType: data.mapType,
      entryFee: data.entryFee,
      prizePool: data.prizePool,
      firstPrize: data.firstPrize,
      secondPrize: data.secondPrize,
      thirdPrize: data.thirdPrize,
      perKillPrize: data.perKillPrize,
      totalSlots: data.totalSlots,
      matchTime: matchDate,
      revealAt: revealDate,
      status: 'UPCOMING',
    },
  });

  return reply.status(201).send({
    message: 'Tournament created successfully',
    tournament,
  });
}
