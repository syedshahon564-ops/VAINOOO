import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@ff-esports/database';
import { SocketManager } from '../../sockets';
import { z } from 'zod';

const updateRoomSchema = z.object({
  roomId: z.string().min(4, 'Room ID is required'),
  roomPass: z.string().min(2, 'Room password is required'),
  status: z.enum(['UPCOMING', 'ROOM_OPEN', 'LIVE', 'COMPLETED', 'CANCELLED']).optional(),
});

export async function getRoomCredentials(request: FastifyRequest, reply: FastifyReply) {
  const { id: tournamentId } = request.params as { id: string };
  const userId = request.user!.userId;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });

  if (!tournament) {
    return reply.status(404).send({ error: 'Tournament not found' });
  }

  // Check if caller is Admin or Supervisor
  const isAdmin = request.user!.role === 'ADMIN' || request.user!.role === 'SUPERVISOR';

  if (!isAdmin) {
    // Check if player is a registered participant in this tournament
    const participant = await prisma.tournamentParticipant.findUnique({
      where: {
        tournamentId_userId: { tournamentId, userId },
      },
    });

    if (!participant) {
      return reply.status(403).send({
        error: 'ACCESS_DENIED',
        message: 'You have not joined this match. Room credentials are only visible to confirmed slot holders.',
      });
    }

    // Check timed reveal: is current time >= revealAt?
    const now = new Date();
    if (now < tournament.revealAt) {
      const remainingSeconds = Math.max(0, Math.floor((tournament.revealAt.getTime() - now.getTime()) / 1000));
      return reply.send({
        isLocked: true,
        message: 'Room credentials will unlock automatically 15 minutes before the match start time.',
        revealAt: tournament.revealAt,
        remainingSeconds,
      });
    }
  }

  // Credentials unlocked
  if (!tournament.roomId || !tournament.roomPass) {
    return reply.send({
      isLocked: false,
      isCreated: false,
      message: 'Room is being set up by tournament host. Refreshing automatically in a moment...',
    });
  }

  return reply.send({
    isLocked: false,
    isCreated: true,
    roomId: tournament.roomId,
    roomPass: tournament.roomPass,
    matchTime: tournament.matchTime,
  });
}

export async function updateRoomCredentials(request: FastifyRequest, reply: FastifyReply) {
  const { id: tournamentId } = request.params as { id: string };
  const result = updateRoomSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: 'Validation error', details: result.error.format() });
  }

  const { roomId, roomPass, status } = result.data;

  const tournament = await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      roomId,
      roomPass,
      status: status || 'ROOM_OPEN',
    },
  });

  // Emit room unlocked event to all players in the room via socket
  SocketManager.getInstance().emitRoomUnlocked(tournamentId, { roomId, roomPass });

  return reply.send({
    message: 'Room credentials published and broadcasted to players successfully',
    tournament,
  });
}
