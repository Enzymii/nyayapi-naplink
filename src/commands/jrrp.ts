import { MessageEvent } from '@naplink/naplink';

import type { AppClient } from '../client.js';
import type { Command } from './index.js';
import { getOrCreateJrrp } from '../services/jrrp.js';
import { renderReply } from '../services/replyStyle.js';
import { CONFIG } from '../utils/config.js';

export const jrrpTestCommand: Command<MessageEvent> = {
  name: ['/jrrp', '.jrrp'],
  enabled: CONFIG.commandsEnabled.jrrp.enabled,
  description: '今日人品',
  async execute(client: AppClient, event: MessageEvent): Promise<void> {
    const result = await getOrCreateJrrp({
      adapterType: 'qq',
      adapterId: String(event.self_id),
      groupId: undefined,
      userId: String(event.user_id),
    });

    const nickname = CONFIG.bot.name;
    const name = event.sender.nickname || event.sender.card || `用户${event.user_id}`;
    const reply = renderReply(
      'bot.reply.jrrp',
      {
        nickname,
        name,
        jrrp: result.value,
      },
      '你今天的人品值是 {jrrp}',
    );

    await client.reply(event, reply);
  },
};
