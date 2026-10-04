require('dotenv').config();
const logger = require('./utils/logger');
const { checkEnv } = require('./config/env');

checkEnv();

const app = require('./app');
const connectDB = require('./config/db');
const { PROVIDER, MODEL } = require('./config/ai');

const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (reason) => {
  logger.error('process_unhandled_rejection', { err: reason });
});
process.on('uncaughtException', (err) => {
  logger.error('process_uncaught_exception', { err });
  process.exit(1);
});

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info('server_started', {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
      aiProvider: PROVIDER,
      aiModel: MODEL,
    });
  });
});