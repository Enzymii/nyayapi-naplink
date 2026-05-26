export interface OcrTextDetection {
  DetectedText: string;
  ItemPolygon: {
    Y: number;
  };
}

const EXCLUDE_PATTERNS = [
  /^商店$/,
  /^远行商人$/,
  /^[A-Z]{2,5}$/,
  /^\d+$/,
  /^限购\d+$/,
  /\d+小时\d+分钟?/,
];

export function parseMerchantProducts(detections: OcrTextDetection[]): string[] {
  return detections
    .filter((detection) => {
      const text = detection.DetectedText.trim();
      if (!/[\u4e00-\u9fff]/.test(text) || text.length < 2) {
        return false;
      }

      return !EXCLUDE_PATTERNS.some((pattern) => pattern.test(text));
    })
    .sort((a, b) => a.ItemPolygon.Y - b.ItemPolygon.Y)
    .map((detection) => detection.DetectedText.trim());
}

/** 按 OCR 商品全名分组：订阅关键词命中该商品的用户 */
export function groupMatchesByProduct(
  products: string[],
  subscriptions: Array<{ userId: string; keywords: string[] }>,
): Map<string, string[]> {
  const productToUsers = new Map<string, string[]>();

  for (const product of products) {
    for (const subscription of subscriptions) {
      const hit = subscription.keywords.some((keyword) =>
        product.includes(keyword),
      );
      if (!hit) {
        continue;
      }

      const users = productToUsers.get(product) ?? [];
      if (!users.includes(subscription.userId)) {
        users.push(subscription.userId);
      }
      productToUsers.set(product, users);
    }
  }

  return productToUsers;
}
