import { NapLink } from '@naplink/naplink';
import { CONFIG } from './utils/config.js';
import { logger } from './utils/logger.js';

export function createClient(): NapLink {
  return new NapLink({
    connection: {
      url: CONFIG.napcat.url,
      token: CONFIG.napcat.token,
      timeout: 30000,
      pingInterval: 30000,
    },
    reconnect: {
      enabled: true,
      maxAttempts: 10,
      backoff: {
        initial: 1000,
        max: 30000,
        multiplier: 2,
      },
    },
    logging: {
      level: (CONFIG.logLevel === 'off' ? 'info' : CONFIG.logLevel),
      logger,
    },
    api: {
      timeout: 30000,
      retries: 3,
    },
  });
}

