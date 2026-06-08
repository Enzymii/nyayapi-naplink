import { db } from '../db/index.js';
import { diceRollTable } from '../db/schema.js';
import type { DiceRollDetail } from './diceRoll.js';

export interface DiceRollIdentity {
  adapterType: string;
  adapterId: string;
  groupId?: string;
  userId: string;
}

function getShanghaiTimestamp(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
}

export async function saveDiceRoll(
  identity: DiceRollIdentity,
  dice: DiceRollDetail[],
): Promise<void> {
  if (dice.length === 0) {
    return;
  }

  await db.instance.insert(diceRollTable).values({
    adapterType: identity.adapterType,
    adapterId: identity.adapterId,
    groupId: identity.groupId ?? null,
    userId: identity.userId,
    dice: JSON.stringify(dice),
    date: getShanghaiTimestamp(),
  });
}
