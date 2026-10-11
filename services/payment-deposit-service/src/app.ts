import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import paymentRoutes from './routes/payment.routes';
import { generalLimiter } from './middleware/rate-limiter';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Security headers & CORS
app.use(helmet());
app.use(cors({ origin: '*' }));

// Request logging
app.use(morgan('combined'));

// Body parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global rate limiter
app.use(generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'Payment & Auto-Deposit Verification Microservice',
    timestamp: new Date().toISOString(),
  });
});

// Mount payment API routes under /api
app.use('/api', paymentRoutes);

// Catch-all 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Endpoint ${req.method} ${req.originalUrl} does not exist.`,
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
