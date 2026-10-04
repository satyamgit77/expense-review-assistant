const crypto = require('crypto');
const logger = require('../utils/logger');

// Har request ko ID deta hai aur req.log banata hai (isme requestId pehle se jura hota hai)
const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  req.id = crypto.randomUUID();
  req.log = logger.child({ requestId: req.id });
  res.setHeader('X-Request-Id', req.id);

  res.on('finish', () => {
    const path = req.originalUrl.split('?')[0];
    const level =
      path === '/api/health'
        ? 'debug'
        : res.statusCode >= 500
          ? 'error'
          : res.statusCode >= 400
            ? 'warn'
            : 'info';

    req.log[level]('request_completed', {
      method: req.method,
      path,
      status: res.statusCode,
      durationMs: Math.round(Number(process.hrtime.bigint() - start) / 1e6),
      userId: req.user ? String(req.user._id) : undefined,
    });
  });

  next();
};

module.exports = requestLogger;