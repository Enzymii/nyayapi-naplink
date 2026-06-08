import { db } from '../db/index.js';
import { chooseTable } from '../db/schema.js';

export interface ChooseIdentity {
  adapterType: string;
  adapterId: string;
  groupId?: string;
  userId: string;
}

export interface ChooseRecordPayload {
  options: string[];
  picked: string[];
  count: number;
}

function getShanghaiTimestamp(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

export async function saveChoose(
  identity: ChooseIdentity,
  payload: ChooseRecordPayload,
): Promise<void> {
  if (payload.picked.length === 0) {
    return;
  }

  await db.instance.insert(chooseTable).values({
    adapterType: identity.adapterType,
    adapterId: identity.adapterId,
    groupId: identity.groupId ?? null,
    userId: identity.userId,
    options: JSON.stringify(payload.options),
    picked: JSON.stringify(payload.picked),
    count: payload.count,
    date: getShanghaiTimestamp(),
  });
}
