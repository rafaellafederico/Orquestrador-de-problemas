require('dotenv').config();

const { buildServer } = require('./server/app');
const { logger } = require('./utils/logger');
const { validateEnv } = require('./config/env');

validateEnv();

const app = buildServer();

// Vercel exporta o app diretamente (sem listen)
// Localmente, sobe o servidor normal
if (require.main === module) {
  const PORT = Number(process.env.PORT || 3000);
  app.listen(PORT, () => {
    logger.info('server_started', { port: PORT });
  });
}

module.exports = app;
