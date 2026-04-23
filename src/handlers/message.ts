import { GroupMessageEvent, NapLink } from '@naplink/naplink';
import { commands } from '../commands/index.js';
import { handleError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';

export function setupMessageHandler(client: NapLink): void {
  client.on('message.group', async (event: GroupMessageEvent) => {
    const [commandName, ...args] = event.raw_message.trim().split(/\s+/);
    const command = commands.find((cmd) => cmd.name === commandName);

    if (!command) {
      return;
    }

    try {
      await command.execute(client, event, args);
    } catch (error) {
      logger.error(`命令 ${commandName} 执行失败`, { error });
      handleError(error);
      await client.sendGroupMessage(event.group_id, '命令执行失败，请稍后重试。');
    }
  });
}

