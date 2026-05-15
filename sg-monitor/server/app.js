const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const webhookRoute = require('../routes/webhook');
const incidentRoute = require('../routes/incidents');
const simulateRoute = require('../routes/simulate');

function buildServer() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: '300kb' }));
  app.use(morgan('combined'));

  app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/webhook', webhookRoute);
  app.use('/incidents', incidentRoute);
  app.use('/simulate', simulateRoute);

  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({
      error: err.message || 'internal_error',
    });
  });

  return app;
}

module.exports = { buildServer };
