import { MessageEvent } from '@naplink/naplink';
import type { AppClient } from '../client.js';
import { commands } from '../commands/index.js';
import { extractEmojiQcids } from '../services/emojiQcid.js';
import { handleError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../utils/config.js';

export function setupMessageHandler(client: AppClient): void {
  client.on('message', async (event: MessageEvent) => {
    const reply_message_id =
      event.message[0].type === 'reply' ? event.message[0].data.id : 0;
    const is_at_bot = event.message.some(
      (msg) => msg.type === 'at' && msg.data.qq === String(event.self_id),
    );
    logger.info(JSON.stringify({ reply_message_id, is_at_bot }));
    // 找第一个type=text的message
    const text_message = event.message.find((msg) => msg.type === 'text');
    const [commandName, ...args] = (
      text_message ?? { data: { text: '' } }
    ).data.text
      .trim()
      .split(/\s+/);
    const command = commands.find((cmd) => cmd.name.includes(commandName));

    if (
      command &&
      (!command.isGroupCommand || event.message_type === 'group')
    ) {
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
        // 贴表情(需要主动@bot)
        if (
          is_at_bot &&
          CONFIG.commandsEnabled.emoji &&
          commandName.startsWith('贴测试')
        ) {
          const emojis = extractEmojiQcids(event.message);
          for (const emoji of emojis) {
            await client.callApi('set_msg_emoji_like', {
              message_id: reply_message_id || event.message_id,
              emoji_id: emoji,
              set: true,
            });
            // 等待0.3秒
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
          return; // 处理完就返回，不继续处理其他命令
        }
      } catch (error) {
        logger.error(`消息处理失败`, { error });
        handleError(error);
      }

      return;
    }
  });
}
