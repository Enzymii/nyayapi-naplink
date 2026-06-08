import { GroupMessageEvent, MessageEvent } from '@naplink/naplink';

import type { AppClient } from '../client.js';
import {
  DICE_ROLL_CODE,
  type DiceRollErrorType,
  rollDiceExpression,
} from '../services/diceRoll.js';
import { saveDiceRoll } from '../services/diceRollStorage.js';
import { renderReply } from '../services/replyStyle.js';
import { CONFIG } from '../utils/config.js';
import type { Command } from './index.js';

const ROLL_OK_KEY = 'bot.reply.roll.ok';

function errorTemplateKey(error: DiceRollErrorType): string {
  return `bot.reply.roll.error.${error.toLowerCase()}`;
}

function formatRollError(error: DiceRollErrorType): string {
  const nickname = CONFIG.bot.name;
  const key = errorTemplateKey(error);
  return renderReply(key, { nickname }, key);
}

function formatRollSuccess(event: MessageEvent, rolls: string): string {
  const nickname = CONFIG.bot.name;
  const name = event.sender.nickname || event.sender.card || `用户${event.user_id}`;
  return renderReply(ROLL_OK_KEY, { nickname, name, rolls }, ROLL_OK_KEY);
}

export const rollCommand: Command<MessageEvent> = {
  name: ['/r', '.r'],
  enabled: CONFIG.commandsEnabled.roll.enabled,
  description: '掷骰',
  async execute(client: AppClient, event: MessageEvent, args: string[]): Promise<void> {
    const expression = args.join('');
    const result = rollDiceExpression(expression);

    if (result.code === DICE_ROLL_CODE.OK) {
      await saveDiceRoll(
        {
          adapterType: 'qq',
          adapterId: String(event.self_id),
          groupId:
            event.message_type === 'group'
              ? String((event as GroupMessageEvent).group_id)
              : undefined,
          userId: String(event.user_id),
        },
        result.rolls,
      );
      await client.reply(event, formatRollSuccess(event, result.msg));
      return;
    }

    await client.reply(event, formatRollError(result.msg));
  },
};
