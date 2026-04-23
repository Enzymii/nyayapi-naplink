import { createClient } from './client.js';
import { setupMessageHandler } from './handlers/message.js';
import { setupNoticeHandler } from './handlers/notice.js';
import { setupRequestHandler } from './handlers/request.js';
import { handleError, setupErrorHandling } from './utils/errorHandler.js';
import { logger } from './utils/logger.js';

async function bootstrap(): Promise<void> {
  setupErrorHandling();

  const client = createClient();

  setupMessageHandler(client);
  setupNoticeHandler(client);
  setupRequestHandler(client);

  client.on('connected', () => {
    logger.info('NapLink 已连接');
  });

  client.on('disconnected', () => {
    logger.warn('NapLink 已断开');
  });

  try {
    await client.connect();
    logger.info('Bot 启动成功');
  } catch (error) {
    handleError(error);
    process.exitCode = 1;
  }
}

void bootstrap();

