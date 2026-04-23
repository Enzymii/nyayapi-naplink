import { and, eq } from 'drizzle-orm';

import { db } from '../db/index.js';
import { jrrpTable } from '../db/schema.js';

export interface JrrpIdentity {
  adapterType: string;
  adapterId: string;
  groupId?: string;
  userId: string;
}

export interface JrrpResult {
  value: number;
  date: string;
  isNew: boolean;
}

function randomJrrp(): number {
  return Math.floor(Math.random() * 100) + 1;
}

function getBusinessDate(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}

export async function getOrCreateJrrp(identity: JrrpIdentity): Promise<JrrpResult> {
  const date = getBusinessDate();

  const existing = await db.instance.query.jrrpTable.findFirst({
    where: and(
      eq(jrrpTable.adapterType, identity.adapterType),
      eq(jrrpTable.adapterId, identity.adapterId),
      eq(jrrpTable.userId, identity.userId),
      eq(jrrpTable.date, date),
    ),
  });

  if (existing) {
    return {
      value: existing.jrrp,
      date,
      isNew: false,
    };
  }

  const value = randomJrrp();

  try {
    await db.instance.insert(jrrpTable).values({
      adapterType: identity.adapterType,
      adapterId: identity.adapterId,
      groupId: identity.groupId ?? null,
      userId: identity.userId,
      jrrp: value,
      date,
    });

    return {
      value,
      date,
      isNew: true,
    };
  } catch {
    // Concurrency-safe fallback when two requests insert the same identity+date.
    const fallback = await db.instance.query.jrrpTable.findFirst({
      where: and(
        eq(jrrpTable.adapterType, identity.adapterType),
        eq(jrrpTable.adapterId, identity.adapterId),
        eq(jrrpTable.userId, identity.userId),
        eq(jrrpTable.date, date),
      ),
    });

    if (!fallback) {
      throw new Error('Jrrp 写入失败且无法回读记录');
    }

    return {
      value: fallback.jrrp,
      date,
      isNew: false,
    };
  }
}
