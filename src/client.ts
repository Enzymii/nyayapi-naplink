import { MessageEvent, NapLink } from '@naplink/naplink';
import { CONFIG } from './utils/config.js';
import { logger } from './utils/logger.js';
import { reply as replyMessage } from './utils/reply.js';

export interface AppClient extends NapLink {
  reply: (event: MessageEvent, message: any) => Promise<any>;
  ctx: {
    groupRepeatState: Record<
      string,
      {
        textQueue: string[];
        lastRepeatedText: string | null;
      }
    >;
  };
}

export function createClient(): AppClient {
  const client = new NapLink({
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
      level: CONFIG.logLevel === 'off' ? 'info' : CONFIG.logLevel,
      logger,
    },
    api: {
      timeout: 30000,
      retries: 3,
    },
  });

  const appClient = client as AppClient;
  appClient.reply = (event: MessageEvent, message: any) =>
    replyMessage(
      appClient,
      event,
      `${CONFIG.bot.debug ? '[DEBUG]' : ''}${message}`,
    );
  appClient.ctx = {
    groupRepeatState: {},
  };

  return appClient;
}
