/** bot 发起查询后，下一条匹配的 markdown 可被消费 */
let awaitingMerchantMarkdown = false;

export function markMerchantQueryStarted(): void {
  awaitingMerchantMarkdown = true;
}

export function isAwaitingMerchantMarkdown(): boolean {
  return awaitingMerchantMarkdown;
}

export function consumeMerchantMarkdown(): void {
  awaitingMerchantMarkdown = false;
}
