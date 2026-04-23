import { GroupMessageEvent, NapLink } from '@naplink/naplink';
import { logger } from '../utils/logger.js';
import { jrrpTestCommand } from './jrrp.js';

export interface Command {
  name: string;
  description: string;
  execute: (
    client: NapLink,
    event: GroupMessageEvent,
    args: string[],
  ) => Promise<void>;
}

export const commands: Command[] = [
  {
    name: '/help',
    description: '显示帮助',
    async execute(client, event) {
      const helpText = commands
        .map((cmd) => `${cmd.name} - ${cmd.description}`)
        .join('\n');
      await client.sendGroupMessage(event.group_id, helpText);
    },
  },
  {
    name: '/ping',
    description: '测试响应',
    async execute(client, event) {
      logger.info(JSON.stringify({ event }));
      await client.sendGroupMessage(event.group_id, 'Pong!');
    },
  },
  jrrpTestCommand,
];
