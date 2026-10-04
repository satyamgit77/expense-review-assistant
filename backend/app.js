const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const authRoutes = require('./routes/authRoutes');
const policyRoutes = require('./routes/policyRoutes');
const claimRoutes = require('./routes/claimRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Hosting (Render jaisi) proxy ke peeche asli client IP rate limit ke liye chahiye
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY));
}

app.use(helmet());
app.use(requestLogger);
app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(','),
  })
);
app.use(express.json({ limit: '100kb' }));


// Health check: database se connection ki sthiti bhi batata hai
app.get('/api/health', (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? 'ok' : 'degraded',
    db: dbUp ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/review', reviewRoutes);

// Production me built frontend yahin se serve hota hai (ek hi URL)
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../frontend/dist');
  const indexFile = path.join(clientDist, 'index.html');

  if (fs.existsSync(indexFile)) {
    app.use(express.static(clientDist, { index: false }));

    // /claims, /review jaise pages par refresh karne par bhi index.html mile
    app.use((req, res, next) => {
      if ((req.method !== 'GET' && req.method !== 'HEAD') || req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(indexFile);
    });

    logger.info('client_serving_enabled', { dir: clientDist });
  } else {
    logger.warn('client_build_missing', {
      detail: 'frontend/dist not found. Run the frontend build to serve the UI from this server.',
    });
  }
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;