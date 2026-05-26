import cron from 'node-cron';

import type { AppClient } from '../../client.js';
import { CONFIG } from '../../utils/config.js';
import { logger } from '../../utils/logger.js';
import { markMerchantQueryStarted } from './pending.js';

let isFetching = false;

async function queryMerchant(client: AppClient): Promise<void> {
  if (isFetching) {
    logger.warn('远行商人查询进行中，跳过本次调度');
    return;
  }

  if (!CONFIG.merchant.groupId || !CONFIG.merchant.botQq) {
    logger.error('远行商人配置不完整，跳过查询');
    return;
  }

  isFetching = true;

  try {
    await client.sendGroupMessage(CONFIG.merchant.groupId, [
      { type: 'at', data: { qq: CONFIG.merchant.botQq } },
      { type: 'text', data: { text: ' /远行商人' } },
    ]);

    markMerchantQueryStarted();

    logger.info('已发送远行商人查询指令', {
      groupId: CONFIG.merchant.groupId,
      botQq: CONFIG.merchant.botQq,
    });
  } catch (error) {
    logger.error('发送远行商人查询指令失败', { error });
  } finally {
    isFetching = false;
  }
}

export function startMerchantScheduler(client: AppClient): void {
  if (!CONFIG.merchant.enabled) {
    return;
  }

  cron.schedule(
    '10 8,12,16,20 * * *',
    () => {
      void queryMerchant(client);
    },
    { timezone: 'Asia/Shanghai' },
  );

  logger.info('远行商人定时任务已启动: 8:10, 12:10, 16:10, 20:10');
}
