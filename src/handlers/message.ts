import { GroupMessageEvent, MessageEvent, TextSegment } from '@naplink/naplink';
import type { AppClient } from '../client.js';
import { commands } from '../commands/index.js';
import { extractEmojiQcids } from '../services/emojiQcid.js';
import { renderReply } from '../services/replyStyle.js';
import { handleError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../utils/config.js';

export function setupMessageHandler(client: AppClient): void {
  client.on('message', async (event: MessageEvent) => {
    const replyMessageId =
      event.message[0].type === 'reply' ? event.message[0].data.id : 0;
    const isAtBot = event.message.some(
      (msg) => msg.type === 'at' && msg.data.qq === String(event.self_id),
    );
    const isGroupMessage = event.message_type === 'group';

    if (
      (CONFIG.bot.debug &&
        isGroupMessage &&
        !CONFIG.bot.debugWhitelist.includes(
          String((event as GroupMessageEvent).group_id),
        )) ||
      (!isGroupMessage && !CONFIG.bot.adminIds.includes(String(event.user_id)))
    ) {
      // 调试模式下，只处理白名单群组和来自管理员的私聊消息
      return;
    }

    // 找第一个type=text而且内容非空的message
    const text_message = event.message.find(
      (msg) => msg.type === 'text' && msg.data.text.trim() !== '',
    ) as TextSegment | undefined;
    if (!text_message) {
      // 不包含文本消息
      return;
    }
    const [commandName, ...args] = text_message.data.text.trim().split(/\s+/);
    const command = commands.find((cmd) => cmd.name.includes(commandName));

    if (command && (!command.isGroupCommand || isGroupMessage)) {
      // 指令异步执行，不阻塞后续 message 事件；先完成的命令可先回复
      void command.execute(client, event, args).catch((error) => {
        logger.error(`命令 ${commandName} 执行失败`, { error });
        handleError(error);
      });
    } else {
      // 不是command就是普通消息了
      try {
        // 贴表情(需要主动@bot)
        if (
          isAtBot &&
          CONFIG.commandsEnabled.emoji.enabled &&
          commandName.startsWith('贴表情')
        ) {
          const emojis = extractEmojiQcids(event.message);
          if (emojis.length === 0) {
            const nickname = CONFIG.bot.name;
            const reply = renderReply(
              'bot.reply.emoji_like_not_found',
              { nickname },
              `${nickname}找不到要贴的表情喵w~`,
            );
            await client.reply(event, reply);
            return;
          }

          const targetMessageId = replyMessageId || event.message_id;
          void (async () => {
            for (const emoji of emojis) {
              await client.callApi('set_msg_emoji_like', {
                message_id: targetMessageId,
                emoji_id: emoji,
                set: true,
              });
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          })().catch((error) => {
            logger.error('贴表情失败', { error });
            handleError(error);
          });
          return; // 不继续走 +1/复读；API 调用在后台顺序执行
        }

        const isPlainText = event.message.every((msg) => msg.type === 'text');
        if (isPlainText) {
          // 纯文本消息
          const text = event.message.reduce(
            (acc, msg) => acc + (msg as TextSegment).data.text,
            '',
          );
          let groupState:
            | {
                textQueue: string[];
                lastRepeatedText: string | null;
              }
            | undefined;
          if (event.message_type === 'group') {
            const groupEvent = event as MessageEvent & { group_id: number };
            const groupId = String(groupEvent.group_id);
            groupState = client.ctx.groupRepeatState[groupId] ?? {
              textQueue: [],
              lastRepeatedText: null,
            };
            client.ctx.groupRepeatState[groupId] = groupState;
            groupState.textQueue.push(text);
            if (groupState.textQueue.length > 20) {
              // 保留最近20条消息
              groupState.textQueue.shift();
            }

            if (groupState.lastRepeatedText !== null) {
              const repeatCount = CONFIG.commandsEnabled.plus1.count;
              const recentMessages = groupState.textQueue.slice(-repeatCount);
              if (
                recentMessages.length === repeatCount &&
                recentMessages.every((t) => t !== groupState!.lastRepeatedText)
              ) {
                groupState.lastRepeatedText = null;
              }
            }
          }
          if (isGroupMessage && CONFIG.commandsEnabled.repeatInterj.enabled) {
            const interj =
              /^(?:啊|哇|哈|嘿|呵|呀|啦|嘛|呢|吧|哦|噢|喔|哎|诶|欸|呐|哪|呦|哟|咯|啰|喽|咧|呃|嗯|唔|呜|吼|嚯|嘻|喵){5,}$/;
            if (groupState?.lastRepeatedText !== text && interj.test(text)) {
              await client.reply(event, text);
              // 设置lastRepeatedText
              if (groupState) {
                groupState.lastRepeatedText = text;
              }
              return;
            }
          }

          // +1
          if (isGroupMessage && CONFIG.commandsEnabled.plus1.enabled) {
            const textQueue = groupState?.textQueue ?? [];
            const repeatCount = CONFIG.commandsEnabled.plus1.count;
            // 如果最后count个元素都相同
            const lastCount = textQueue.slice(-repeatCount);
            if (
              lastCount.length === repeatCount &&
              lastCount.every((t) => t === lastCount[0]) &&
              groupState?.lastRepeatedText !== lastCount[0]
            ) {
              await client.reply(event, lastCount[0]);
              if (groupState) {
                groupState.lastRepeatedText = lastCount[0];
              }
            }
          }
        }
      } catch (error) {
        logger.error(`消息处理失败`, { error });
        handleError(error);
      }

      return;
    }
  });
}
