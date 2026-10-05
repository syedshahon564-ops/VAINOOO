import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@ff-esports/database';

export interface AuthUserPayload {
  userId: string;
  role: 'PLAYER' | 'SUPERVISOR' | 'ADMIN';
  ign: string;
  uid: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUserPayload;
  }
}

export async function verifyAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or invalid authorization token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await request.server.jwt.verify<AuthUserPayload>(token);

    // Ban check guard
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isBanned: true, banReason: true, role: true },
    });

    if (!user) {
      return reply.status(401).send({ error: 'User account not found' });
    }

    if (user.isBanned) {
      return reply.status(403).send({
        error: 'ACCOUNT_BANNED',
        message: user.banReason || 'Your account has been banned due to security violations.',
      });
    }

    request.user = decoded;
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized or expired session' });
  }
}

export async function verifyAdmin(request: FastifyRequest, reply: FastifyReply) {
  await verifyAuth(request, reply);
  if (!request.user || (request.user.role !== 'ADMIN' && request.user.role !== 'SUPERVISOR')) {
    return reply.status(403).send({ error: 'Access denied: Requires administrator privileges' });
  }
}
