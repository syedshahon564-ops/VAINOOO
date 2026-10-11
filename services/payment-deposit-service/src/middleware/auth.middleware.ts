import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ENV } from '../config/env';

export function validateWebhookApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Missing x-api-key authentication header.',
    });
  }

  // Timing safe comparison to mitigate timing attacks
  const providedBuffer = Buffer.from(apiKey);
  const expectedBuffer = Buffer.from(ENV.WEBHOOK_SECRET_KEY);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    console.warn(`[SECURITY] Invalid webhook x-api-key attempt from IP: ${req.ip}`);
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Invalid x-api-key credentials.',
    });
  }

  next();
}
