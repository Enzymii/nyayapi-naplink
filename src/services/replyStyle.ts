import fs from 'node:fs';
import path from 'node:path';

import { CONFIG } from '../utils/config.js';
import { logger } from '../utils/logger.js';

const PLACEHOLDER_PATTERN = /\{([a-zA-Z0-9_]+)\}/g;

let cachedStyleName: string | null = null;
let cachedTemplates: Record<string, string> = {};

function getStyleFilePath(styleName: string): string {
  return path.resolve(process.cwd(), 'replies', `${styleName}.json`);
}

function loadStyle(styleName: string): Record<string, string> {
  if (cachedStyleName === styleName) {
    return cachedTemplates;
  }

  const styleFilePath = getStyleFilePath(styleName);

  try {
    const raw = fs.readFileSync(styleFilePath, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('回复风格文件内容必须是对象');
    }

    const templates: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') {
        templates[key] = value;
      }
    }

    cachedStyleName = styleName;
    cachedTemplates = templates;
    return templates;
  } catch (error) {
    logger.error(`加载回复风格失败: ${styleFilePath}`, { error });
    cachedStyleName = styleName;
    cachedTemplates = {};
    return cachedTemplates;
  }
}

export function renderReply(
  key: string,
  vars: Record<string, string | number>,
  fallback: string,
  styleName = CONFIG.bot.replyStyle,
): string {
  const templates = loadStyle(styleName);
  const template = templates[key] ?? fallback;

  return template.replace(PLACEHOLDER_PATTERN, (_match, variable: string) => {
    const value = vars[variable];
    return value === undefined ? '' : String(value);
  });
}
