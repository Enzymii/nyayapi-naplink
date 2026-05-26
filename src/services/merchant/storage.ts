import { eq } from 'drizzle-orm';

import { db } from '../../db/index.js';
import {
  merchantFetchTable,
  merchantSubscriptionTable,
} from '../../db/schema.js';

function getShanghaiTimestamp(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

export async function saveMerchantFetch(input: {
  groupId: string;
  round: number | null;
  products: string[];
}): Promise<void> {
  await db.instance.insert(merchantFetchTable).values({
    groupId: input.groupId,
    round: input.round,
    products: JSON.stringify(input.products),
    fetchedAt: getShanghaiTimestamp(),
  });
}

export async function getAllMerchantSubscriptions(): Promise<
  Array<{ userId: string; keywords: string[] }>
> {
  const rows = await db.instance.query.merchantSubscriptionTable.findMany();

  return rows.map((row) => ({
    userId: row.userId,
    keywords: JSON.parse(row.keywords) as string[],
  }));
}

export async function getMerchantSubscription(
  userId: string,
): Promise<string[] | null> {
  const row = await db.instance.query.merchantSubscriptionTable.findFirst({
    where: eq(merchantSubscriptionTable.userId, userId),
  });

  if (!row) {
    return null;
  }

  return JSON.parse(row.keywords) as string[];
}

export async function upsertMerchantSubscription(
  userId: string,
  keywords: string[],
): Promise<void> {
  const existing = await db.instance.query.merchantSubscriptionTable.findFirst({
    where: eq(merchantSubscriptionTable.userId, userId),
  });

  if (existing) {
    await db.instance
      .update(merchantSubscriptionTable)
      .set({ keywords: JSON.stringify(keywords) })
      .where(eq(merchantSubscriptionTable.userId, userId));
    return;
  }

  await db.instance.insert(merchantSubscriptionTable).values({
    userId,
    keywords: JSON.stringify(keywords),
  });
}
