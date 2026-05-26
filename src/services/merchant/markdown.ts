const FIRST_IMAGE_RE = /!\[[^\]]*\]\((https?:\/\/[^)]+)\)/;

/** 游戏 bot 商店查询结果 markdown（含标题、轮次、商品截图） */
export function isMerchantShopMarkdown(markdownContent: string): boolean {
  if (!markdownContent.includes('【远行商人】')) {
    return false;
  }

  if (!/第\d+轮/.test(markdownContent)) {
    return false;
  }

  if (!extractFirstImageUrl(markdownContent)) {
    return false;
  }

  return true;
}

export function extractFirstImageUrl(markdownContent: string): string | null {
  const match = markdownContent.match(FIRST_IMAGE_RE);
  return match?.[1] ?? null;
}

export function extractRound(text: string): number | null {
  const match = text.match(/第(\d+)轮/);
  if (!match) {
    return null;
  }

  const round = Number.parseInt(match[1], 10);
  return Number.isNaN(round) ? null : round;
}
