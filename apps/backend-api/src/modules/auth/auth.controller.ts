import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '@ff-esports/database';
import { z } from 'zod';

const registerSchema = z.object({
  phone: z.string().min(11, 'Valid Bangladesh phone number required (e.g. 017xxxxxxxx)'),
  ign: z.string().min(3, 'Free Fire In-Game Name must be at least 3 characters'),
  uid: z.string().min(6, 'Free Fire UID is required (e.g. 192837465)'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  deviceFingerprint: z.string().optional(),
});

const loginSchema = z.object({
  phone: z.string().min(11),
  password: z.string(),
  deviceFingerprint: z.string().optional(),
});

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const result = registerSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: 'Validation error', details: result.error.format() });
  }

  const { phone, ign, uid, password, deviceFingerprint } = result.data;

  // Check unique constraints
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ phone }, { uid }],
    },
  });

  if (existingUser) {
    if (existingUser.phone === phone) {
      return reply.status(400).send({ error: 'This phone number is already registered' });
    }
    return reply.status(400).send({ error: 'This Free Fire UID is already linked to another account' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      phone,
      ign,
      uid,
      passwordHash,
      deviceFingerprint,
      walletBalance: 0.0,
      role: 'PLAYER',
    },
  });

  const token = request.server.jwt.sign({
    userId: user.id,
    role: user.role,
    ign: user.ign,
    uid: user.uid,
  });

  return reply.status(201).send({
    message: 'Registration successful',
    token,
    user: {
      id: user.id,
      phone: user.phone,
      ign: user.ign,
      uid: user.uid,
      role: user.role,
      walletBalance: user.walletBalance,
    },
  });
}

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const result = loginSchema.safeParse(request.body);
  if (!result.success) {
    return reply.status(400).send({ error: 'Invalid login details' });
  }

  const { phone, password, deviceFingerprint } = result.data;

  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    return reply.status(401).send({ error: 'Invalid phone number or password' });
  }

  if (user.isBanned) {
    return reply.status(403).send({
      error: 'ACCOUNT_BANNED',
      message: user.banReason || 'Your account is permanently suspended due to security violations.',
    });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return reply.status(401).send({ error: 'Invalid phone number or password' });
  }

  // Update device fingerprint if provided
  if (deviceFingerprint && deviceFingerprint !== user.deviceFingerprint) {
    await prisma.user.update({
      where: { id: user.id },
      data: { deviceFingerprint },
    });
  }

  const token = request.server.jwt.sign({
    userId: user.id,
    role: user.role,
    ign: user.ign,
    uid: user.uid,
  });

  return reply.send({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      phone: user.phone,
      ign: user.ign,
      uid: user.uid,
      role: user.role,
      walletBalance: user.walletBalance,
    },
  });
}

export async function getProfile(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      ign: true,
      uid: true,
      role: true,
      walletBalance: true,
      isBanned: true,
      createdAt: true,
      participants: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          tournament: {
            select: {
              title: true,
              gameMode: true,
              mapType: true,
              matchTime: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return reply.status(404).send({ error: 'Profile not found' });
  }

  return reply.send({ profile: user });
}
