import { NapLinkError } from '@naplink/naplink';
import { logger } from './logger.js';

export function setupErrorHandling(): void {
  process.on('uncaughtException', (error) => {
    logger.error('未捕获异常', { error });
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('未处理的 Promise 拒绝', { reason });
  });
}

export function handleError(error: unknown): void {
  if (error instanceof NapLinkError) {
    logger.error(`[${error.code}] ${error.message}`, { details: error.details });
    return;
  }

  if (error instanceof Error) {
    logger.error(error.message, { error });
    return;
  }

  logger.error('未知错误', { error });
}

