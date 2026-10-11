import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env';

// General rate limiter for all public endpoints
export const generalLimiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS,
  max: ENV.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests from this IP. Please try again after 1 minute.',
  },
});

// Stricter rate limiter for deposit verification to prevent brute-forcing TrxIDs
export const verifyDepositLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: ENV.VERIFY_RATE_LIMIT_MAX, // max 30 attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'RATE_LIMITED',
    message: 'Too many verification attempts. Please wait 1 minute before trying again.',
  },
});
