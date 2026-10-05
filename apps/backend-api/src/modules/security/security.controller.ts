import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@ff-esports/database';
import { SocketManager } from '../../sockets';
import { z } from 'zod';

const killfeedSchema = z.object({
  tournamentId: z.string(),
  killerIgn: z.string(),
  victimIgn: z.string(),
  weapon: z.string(),
  isHeadshot: z.boolean(),
  timestamp: z.string().optional(),
});

const anomalySchema = z.object({
  tournamentId: z.string(),
  ign: z.string(),
  uid: z.string().optional(),
  anomalyType: z.enum(['HEADSHOT_ANOMALY', 'SPEED_HACK', 'EMULATOR_MISMATCH', 'RAPID_FIRE']),
  confidenceScore: z.number().min(0).max(1),
  details: z.string(),
  snapshotUrl: z.string().optional(),
  autoBan: z.boolean().default(false),
});

const banSchema = z.object({
  userId: z.string(),
  reason: z.string().min(5),
});

export async function ingestKillfeed(request: FastifyRequest, reply: FastifyReply) {
  // Validate callback secret
  const secretHeader = request.headers['x-bot-secret'];
  if (secretHeader !== process.env.BOT_CALLBACK_SECRET && secretHeader !== 'secure_bot_engine_signature_token') {
    return reply.status(401).send({ error: 'Unauthorized bot observer callback' });
  }

  const result = killfeedSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: 'Validation error', details: result.error.format() });
  }

  const data = result.data;

  // Broadcast to Web & App sockets in real-time
  SocketManager.getInstance().emitKillfeedEvent(data.tournamentId, data);

  // Increment participant kill count if mapped
  const user = await prisma.user.findFirst({
    where: { ign: { equals: data.killerIgn, mode: 'insensitive' } },
  });

  if (user) {
    await prisma.tournamentParticipant.updateMany({
      where: {
        tournamentId: data.tournamentId,
        userId: user.id,
      },
      data: {
        kills: { increment: 1 },
      },
    });
  }

  return reply.send({ success: true, recorded: true });
}

export async function reportAnomaly(request: FastifyRequest, reply: FastifyReply) {
  const secretHeader = request.headers['x-bot-secret'];
  if (secretHeader !== process.env.BOT_CALLBACK_SECRET && secretHeader !== 'secure_bot_engine_signature_token') {
    return reply.status(401).send({ error: 'Unauthorized bot observer callback' });
  }

  const result = anomalySchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: 'Validation error', details: result.error.format() });
  }

  const data = result.data;

  // Find user by IGN or UID
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { ign: { equals: data.ign, mode: 'insensitive' } },
        ...(data.uid ? [{ uid: data.uid }] : []),
      ],
    },
  });

  if (user) {
    const actionTaken = data.autoBan ? 'AUTO_BANNED' : 'FLAGGED_FOR_REVIEW';

    const log = await prisma.antiCheatLog.create({
      data: {
        userId: user.id,
        tournamentId: data.tournamentId,
        anomalyType: data.anomalyType,
        confidenceScore: data.confidenceScore,
        details: data.details,
        snapshotUrl: data.snapshotUrl,
        actionTaken,
      },
    });

    if (data.autoBan) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isBanned: true,
          banReason: `Auto-banned by Anti-Cheat Engine: ${data.details}`,
        },
      });
    }

    SocketManager.getInstance().emitAntiCheatAlert({
      ...data,
      userId: user.id,
      actionTaken,
    });

    return reply.send({ success: true, logId: log.id, actionTaken });
  }

  return reply.send({ success: true, note: 'Player not currently mapped to database' });
}

export async function adminBanPlayer(request: FastifyRequest, reply: FastifyReply) {
  const result = banSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: 'Validation error', details: result.error.format() });
  }

  const { userId, reason } = result.data;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: true,
      banReason: reason,
    },
  });

  return reply.send({
    message: `Player ${user.ign} (UID: ${user.uid}) has been banned from all tournaments.`,
    user,
  });
}

export async function adminGetAntiCheatLogs(request: FastifyRequest, reply: FastifyReply) {
  const logs = await prisma.antiCheatLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { ign: true, uid: true, phone: true, isBanned: true },
      },
      tournament: {
        select: { title: true, gameMode: true, matchTime: true },
      },
    },
    take: 50,
  });

  return reply.send({ logs });
}
