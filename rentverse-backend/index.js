const app = require('./src/app');
const { disconnectDB } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Note: process.on handlers may not behave as expected in Serverless Functions
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  try {
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Only listen if NOT running on Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally on port ${PORT}`);
  });
}

// CRITICAL: Export the app for Vercel
module.exports = app;