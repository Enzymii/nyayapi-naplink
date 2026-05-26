import type { AppClient } from '../../client.js';
import { renderReply } from '../replyStyle.js';
import { CONFIG } from '../../utils/config.js';
import { logger } from '../../utils/logger.js';
import { groupMatchesByProduct } from './parser.js';
import { getAllMerchantSubscriptions } from './storage.js';

type MessageSegment =
  | { type: 'text'; data: { text: string } }
  | { type: 'at'; data: { qq: string } };

function buildNotifySegments(itemToUsers: Map<string, string[]>): MessageSegment[] {
  const segments: MessageSegment[] = [];
  const entries = [...itemToUsers.entries()];

  entries.forEach(([item, userIds], index) => {
    for (const userId of userIds) {
      segments.push({ type: 'at', data: { qq: userId } });
    }

    const line = renderReply(
      'bot.notice.merchant',
      { item },
      `远行商人卖【${item}】了喵w~`,
    );
    const suffix = index < entries.length - 1 ? '\n' : '';
    segments.push({ type: 'text', data: { text: ` ${line}${suffix}` } });
  });

  return segments;
}

export async function notifyMerchantSubscribers(
  client: AppClient,
  _round: number | null,
  products: string[],
): Promise<void> {
  const subscriptions = await getAllMerchantSubscriptions();
  const itemToUsers = groupMatchesByProduct(products, subscriptions);

  if (itemToUsers.size === 0) {
    logger.info('远行商人本轮无订阅命中，跳过通知');
    return;
  }

  const segments = buildNotifySegments(itemToUsers);
  await client.sendGroupMessage(CONFIG.merchant.groupId, segments);

  logger.info('远行商人订阅通知已发送', {
    groupId: CONFIG.merchant.groupId,
    items: [...itemToUsers.keys()],
    products,
  });
}
