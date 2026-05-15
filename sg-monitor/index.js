const { buildServer } = require('./server/app');
const { logger } = require('./utils/logger');

const PORT = Number(process.env.PORT || 3000);
const app = buildServer();

app.listen(PORT, () => {
  logger.info('server_started', { port: PORT });
});
