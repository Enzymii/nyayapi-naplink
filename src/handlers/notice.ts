import { NapLink } from '@naplink/naplink';
import { logger } from '../utils/logger.js';

export function setupNoticeHandler(client: NapLink): void {
  client.on('notice.group_msg_emoji_like', (data) => {
    logger.info('收到 notice 事件', data.likes);
  });
}

