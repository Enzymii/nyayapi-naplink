import { MessageEvent } from '@naplink/naplink';
import type { AppClient } from '../client.js';
import { renderReply } from '../services/replyStyle.js';
import { CONFIG } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { jrrpTestCommand } from './jrrp.js';

export interface Command<TEvent extends MessageEvent = MessageEvent> {
  name: string;
  description: string;
  // Defaults to true when omitted.
  isGroupCommand?: boolean;
  execute: (
    client: AppClient,
    event: TEvent,
    args: string[],
  ) => Promise<void>;
}

export const commands: Command[] = [
  // {
  //   name: '/help',
  //   description: '显示帮助',
  //   async execute(client, event) {
  //     const helpText = commands
  //       .map((cmd) => `${cmd.name} - ${cmd.description}`)
  //       .join('\n');
  //     await client.reply(event, helpText);
  //   },
  // },
  {
    name: '/ping',
    description: '测试响应',
    async execute(client, event) {
      logger.info(JSON.stringify({ event }));
      const reply = renderReply(
        'bot.reply.pong',
        {
          nickname: CONFIG.bot.name,
          name: event.sender.nickname || event.sender.card || `用户${event.user_id}`,
        },
        'Pong!',
      );
      await client.reply(event, reply);
    },
  },
  jrrpTestCommand,
];
