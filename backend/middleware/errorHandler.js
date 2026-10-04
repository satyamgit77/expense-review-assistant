const logger = require('../utils/logger');

const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || err.status || 500;

  if (status >= 500) (req.log || logger).error('request_error', { err });

  // Production me server ki andar ki details bahar nahi jaani chahiye
  const message =
    status >= 500 && process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message || 'Something went wrong';

  res.status(status).json({ message });
};

module.exports = { notFound, errorHandler };