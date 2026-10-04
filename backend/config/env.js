const logger = require('../utils/logger');

const checkEnv = () => {
  const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((k) => !process.env[k]);
  if (missing.length) {
    logger.error('config_missing_env', { missing });
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 16) {
    logger.warn('config_weak_secret', { detail: 'JWT_SECRET is short, use a long random string' });
  }

  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  const keyName = provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'GEMINI_API_KEY';
  if (!process.env[keyName]) {
    logger.warn('config_ai_key_missing', {
      detail: `${keyName} is not set, AI review will fall back to manual review`,
    });
  }
};

module.exports = { checkEnv };