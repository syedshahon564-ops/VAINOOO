import app from './app';
import { ENV } from './config/env';
import { connectDatabase, prisma } from './config/prisma';

async function startServer() {
  await connectDatabase();

  const server = app.listen(ENV.PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Payment & Auto-Deposit Verification Microservice Running`);
    console.log(`📡 Port: ${ENV.PORT}`);
    console.log(`🔒 Webhook Protection: Enabled (x-api-key required)`);
    console.log(`🔗 Health Check: http://localhost:${ENV.PORT}/health`);
    console.log(`📥 Webhook URL: http://localhost:${ENV.PORT}/api/webhook/payment`);
    console.log(`💳 Verification URL: http://localhost:${ENV.PORT}/api/deposit/verify`);
    console.log(`=======================================================`);
  });

  const handleShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('✅ Database connections closed. Process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
