import { MessageEvent } from '@naplink/naplink';
import type { AppClient } from '../client.js';
import { commands } from '../commands/index.js';
import { handleError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';

export function setupMessageHandler(client: AppClient): void {
  client.on('message', async (event: MessageEvent) => {
    const [commandName, ...args] = event.raw_message.trim().split(/\s+/);
    const command = commands.find((cmd) => cmd.name === commandName);

    if (command && (!command.isGroupCommand || event.message_type === 'group')) {
      // 关于指令的处理
      try {
        await command.execute(client, event, args);
      } catch (error) {
        logger.error(`命令 ${commandName} 执行失败`, { error });
        handleError(error);
      }
    } else {
      // 不是command就是纯文本消息了
      try {
        // TODO: 处理这部分消息
      } catch (error) {
        logger.error(`消息处理失败`, { error });
        handleError(error);
      }

      return;
    }

    // await client.sendMessage(event.group_id, '命令执行失败，请稍后重试。');
  });
}
