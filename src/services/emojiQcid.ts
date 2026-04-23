import type { MessageEvent } from '@naplink/naplink';
import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../utils/logger.js';

type EmojiQcidEntry = {
  emojiId: string;
  qcid: number;
};

let emojiQcidMapCache: Map<string, string> | null = null;

function getEmojiQcidMap(): Map<string, string> {
  if (emojiQcidMapCache) {
    return emojiQcidMapCache;
  }

  const emojiQcidFilePath = path.resolve(
    process.cwd(),
    'resources',
    'emoji_qcid.json',
  );

  try {
    const raw = fs.readFileSync(emojiQcidFilePath, 'utf-8');
    const parsed = JSON.parse(raw) as EmojiQcidEntry[];
    const map = new Map<string, string>();

    for (const item of parsed) {
      if (!item || typeof item.emojiId !== 'string') {
        continue;
      }
      map.set(item.emojiId, String(item.qcid));
    }

    emojiQcidMapCache = map;
    return map;
  } catch (error) {
    logger.error(`加载 emoji_qcid 失败: ${emojiQcidFilePath}`, { error });
    emojiQcidMapCache = new Map<string, string>();
    return emojiQcidMapCache;
  }
}

export function extractEmojiQcids(
  messages: MessageEvent['message'],
  maxCount = 20,
): string[] {
  const emojiRegex = /\p{Extended_Pictographic}/gu;
  const emojiQcidMap = getEmojiQcidMap();
  const emojis: string[] = [];

  for (const msg of messages) {
    if (emojis.length >= maxCount) {
      break;
    }

    if (msg.type === 'text') {
      const emojiMatches = msg.data.text.match(emojiRegex);
      if (!emojiMatches) {
        continue;
      }

      for (const emoji of emojiMatches) {
        const qcid = emojiQcidMap.get(emoji);
        if (qcid !== undefined) {
          emojis.push(qcid);
          if (emojis.length >= maxCount) {
            break;
          }
        }
      }
    } else if (msg.type === 'face') {
      emojis.push(msg.data.id);
    }
  }

  return emojis.slice(0, maxCount);
}
