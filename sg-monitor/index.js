require('dotenv').config();

const { buildServer } = require('./server/app');
const { logger } = require('./utils/logger');
const { validateEnv } = require('./config/env');

validateEnv();

const PORT = Number(process.env.PORT || 3000);
const app = buildServer();

app.listen(PORT, () => {
  logger.info('server_started', { port: PORT, env: process.env.NODE_ENV || 'development' });
});
