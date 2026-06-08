import { GroupMessageEvent, MessageEvent } from '@naplink/naplink';

import type { AppClient } from '../client.js';
import {
  CHOOSE_CODE,
  type ChooseErrorType,
  chooseFromArgs,
} from '../services/choose.js';
import { saveChoose } from '../services/chooseStorage.js';
import { renderReply } from '../services/replyStyle.js';
import { CONFIG } from '../utils/config.js';
import type { Command } from './index.js';

const CHOOSE_OK_KEY = 'bot.reply.choose.ok';

function errorTemplateKey(error: ChooseErrorType): string {
  if (error === 'INVALID_COUNT' || error === 'COUNT_TOO_LARGE') {
    return 'bot.reply.choose.error.invalid_count';
  }
  return `bot.reply.choose.error.${error.toLowerCase()}`;
}

function formatChooseError(error: ChooseErrorType, count?: number): string {
  const nickname = CONFIG.bot.name;
  const key = errorTemplateKey(error);
  const vars: Record<string, string | number> = { nickname };
  if (count !== undefined) {
    vars.count = count;
  }
  return renderReply(key, vars, key);
}

function formatChooseSuccess(event: MessageEvent, choices: string): string {
  const nickname = CONFIG.bot.name;
  const name = event.sender.nickname || event.sender.card || `用户${event.user_id}`;
  return renderReply(CHOOSE_OK_KEY, { nickname, name, choices }, CHOOSE_OK_KEY);
}

export const chooseCommand: Command<MessageEvent> = {
  name: ['.c', '/c'],
  enabled: CONFIG.commandsEnabled.choose.enabled,
  description: '随机选选项',
  async execute(client: AppClient, event: MessageEvent, args: string[]): Promise<void> {
    const result = chooseFromArgs(args);

    if (result.code === CHOOSE_CODE.OK) {
      await saveChoose(
        {
          adapterType: 'qq',
          adapterId: String(event.self_id),
          groupId:
            event.message_type === 'group'
              ? String((event as GroupMessageEvent).group_id)
              : undefined,
          userId: String(event.user_id),
        },
        {
          options: result.options,
          picked: result.picked,
          count: result.count,
        },
      );
      await client.reply(event, formatChooseSuccess(event, result.msg));
      return;
    }

    await client.reply(event, formatChooseError(result.msg, result.count));
  },
};
