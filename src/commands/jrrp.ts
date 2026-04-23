import { GroupMessageEvent, NapLink } from '@naplink/naplink';

import type { Command } from './index.js';
import { getOrCreateJrrp } from '../services/jrrp.js';

export const jrrpTestCommand: Command = {
  name: '/jrrp_test',
  description: '今日人品',
  async execute(client: NapLink, event: GroupMessageEvent): Promise<void> {
    const result = await getOrCreateJrrp({
      adapterType: 'qq',
      adapterId: String(event.self_id),
      groupId: String(event.group_id),
      userId: String(event.user_id),
    });

    await client.sendGroupMessage(
      event.group_id,
      `你今天的人品值是 ${result.value}`,
    );
  },
};
