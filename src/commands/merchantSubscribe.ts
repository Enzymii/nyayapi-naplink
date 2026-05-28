import { MessageEvent } from '@naplink/naplink';

import type { AppClient } from '../client.js';
import type { Command } from './index.js';
import {
  getMerchantSubscription,
  upsertMerchantSubscription,
} from '../services/merchant/storage.js';
import { renderReply } from '../services/replyStyle.js';
import { CONFIG } from '../utils/config.js';

export const merchantSubscribeCommand: Command<MessageEvent> = {
  name: ['订阅远行商人'],
  enabled: CONFIG.commandsEnabled.merchantSubscribe.enabled,
  description: '订阅远行商人商品提醒',
  isGroupCommand: true,
  async execute(client: AppClient, event: MessageEvent, args: string[]): Promise<void> {
    const userId = String(event.user_id);
    const keywords = args.map((arg) => arg.trim()).filter(Boolean);

    if (keywords.length === 0) {
      const current = await getMerchantSubscription(userId);

      if (!current || current.length === 0) {
        const reply = renderReply(
          'bot.reply.merchant.noitem',
          { nickname: CONFIG.bot.name },
          `想让${CONFIG.bot.name}提醒你的话要告诉${CONFIG.bot.name}你需要什么喵w~`,
        );
        await client.reply(event, reply);
        return;
      }

      const reply = renderReply(
        'bot.reply.merchant.subscribe',
        {
          nickname: CONFIG.bot.name,
          items: current.join(' '),
        },
        `${CONFIG.bot.name}会在远行商人卖【${current.join(' ')}】的时候提醒你喵w~`,
      );
      await client.reply(event, reply);
      return;
    }

    await upsertMerchantSubscription(userId, keywords);
    const reply = renderReply(
      'bot.reply.merchant.subscribe',
      {
        nickname: CONFIG.bot.name,
        items: keywords.join(' '),
      },
      `${CONFIG.bot.name}会在远行商人卖【${keywords.join(' ')}】的时候提醒你喵w~`,
    );
    await client.reply(event, reply);
  },
};
