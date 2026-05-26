import { GroupMessageEvent, TextSegment } from '@naplink/naplink';

import type { AppClient } from '../../client.js';
import { CONFIG } from '../../utils/config.js';
import { handleError } from '../../utils/errorHandler.js';
import { logger } from '../../utils/logger.js';
import {
  extractFirstImageUrl,
  extractRound,
  isMerchantShopMarkdown,
} from './markdown.js';
import { notifyMerchantSubscribers } from './notify.js';
import {
  consumeMerchantMarkdown,
  isAwaitingMerchantMarkdown,
} from './pending.js';
import { recognizeImageUrl } from './ocr.js';
import { parseMerchantProducts } from './parser.js';
import { saveMerchantFetch } from './storage.js';

function getCombinedText(event: GroupMessageEvent): string {
  return event.message
    .filter((segment) => segment.type === 'text')
    .map((segment) => (segment as TextSegment).data.text)
    .join('');
}

export async function tryHandleMerchantResponse(
  client: AppClient,
  event: GroupMessageEvent,
): Promise<boolean> {
  if (!CONFIG.merchant.enabled) {
    return false;
  }

  if (String(event.group_id) !== CONFIG.merchant.groupId) {
    return false;
  }

  if (String(event.user_id) !== CONFIG.merchant.botQq) {
    return false;
  }

  const markdownSegment = event.message.find(
    (segment) => segment.type === 'markdown',
  ) as { type: 'markdown'; data: { content: string } } | undefined;

  if (!markdownSegment) {
    return false;
  }

  if (!isAwaitingMerchantMarkdown()) {
    return false;
  }

  const markdownContent = markdownSegment.data.content;

  if (!isMerchantShopMarkdown(markdownContent)) {
    logger.debug('忽略非商店格式的 markdown');
    return false;
  }

  consumeMerchantMarkdown();

  const imageUrl = extractFirstImageUrl(markdownContent);
  if (!imageUrl) {
    logger.warn('远行商人消息未找到图片 URL');
    return true;
  }

  const combinedText = getCombinedText(event);
  const round = extractRound(combinedText || markdownContent);

  try {
    const detections = await recognizeImageUrl(imageUrl);
    const products = parseMerchantProducts(detections);

    if (products.length === 0) {
      logger.warn('远行商人 OCR 未识别到商品', { imageUrl });
      return true;
    }

    await saveMerchantFetch({
      groupId: String(event.group_id),
      round,
      products,
    });

    logger.info('远行商人商品已入库', { round, products });
    await notifyMerchantSubscribers(client, round, products);
  } catch (error) {
    logger.error('远行商人消息处理失败', { error, imageUrl });
    handleError(error);
  }

  return true;
}
