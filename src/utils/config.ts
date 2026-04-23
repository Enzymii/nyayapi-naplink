import { config } from 'dotenv';

config();

const logLevel = process.env.LOG_LEVEL ?? 'info';

if (!['debug', 'info', 'warn', 'error', 'off'].includes(logLevel)) {
  throw new Error('LOG_LEVEL 必须是 debug/info/warn/error/off 之一');
}

export const CONFIG = {
  napcat: {
    url: process.env.NAPCAT_URL ?? 'ws://localhost:3001',
    token: process.env.NAPCAT_TOKEN,
  },
  bot: {
    adminIds: (process.env.ADMIN_IDS ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  },
  logLevel: logLevel as 'debug' | 'info' | 'warn' | 'error' | 'off',
};
