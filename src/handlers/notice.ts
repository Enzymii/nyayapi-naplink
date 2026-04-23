import { NapLink } from '@naplink/naplink';
import { logger } from '../utils/logger.js';

export function setupNoticeHandler(client: NapLink): void {
  client.on('notice', (event) => {
    logger.debug('收到 notice 事件', event);
  });
}

