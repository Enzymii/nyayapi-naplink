import { GroupRequest, NapLink } from '@naplink/naplink';
import { logger } from '../utils/logger.js';

export function setupRequestHandler(client: NapLink): void {
  client.on('request.group', async (event: GroupRequest) => {
    logger.info('收到入群请求', {
      groupId: event.group_id,
      userId: event.user_id,
      subType: event.sub_type,
    });
  });
}

