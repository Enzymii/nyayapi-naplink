import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const jrrpTable = sqliteTable(
  'jrrp',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    adapterType: text('adapter_type').notNull(),
    adapterId: text('adapter_id').notNull(),
    groupId: text('group_id'),
    userId: text('user_id').notNull(),
    jrrp: integer('jrrp').notNull(),
    date: text('date').notNull(),
  },
  (table) => ({
    identityByDateIdx: uniqueIndex('jrrp_identity_by_date_idx').on(
      table.adapterType,
      table.adapterId,
      table.userId,
      table.date,
    ),
  }),
);

export const merchantFetchTable = sqliteTable('merchant_fetch', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: text('group_id').notNull(),
  round: integer('round'),
  products: text('products').notNull(),
  fetchedAt: text('fetched_at').notNull(),
});

export const merchantSubscriptionTable = sqliteTable(
  'merchant_subscription',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id').notNull(),
    keywords: text('keywords').notNull(),
  },
  (table) => ({
    userIdIdx: uniqueIndex('merchant_subscription_user_id_idx').on(table.userId),
  }),
);

export const diceRollTable = sqliteTable('dice_roll', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  adapterType: text('adapter_type').notNull(),
  adapterId: text('adapter_id').notNull(),
  groupId: text('group_id'),
  userId: text('user_id').notNull(),
  dice: text('dice').notNull(),
  date: text('date').notNull(),
});

export const chooseTable = sqliteTable('choose', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  adapterType: text('adapter_type').notNull(),
  adapterId: text('adapter_id').notNull(),
  groupId: text('group_id'),
  userId: text('user_id').notNull(),
  options: text('options').notNull(),
  picked: text('picked').notNull(),
  count: integer('count').notNull(),
  date: text('date').notNull(),
});

export type JrrpRecord = typeof jrrpTable.$inferSelect;
export type NewJrrpRecord = typeof jrrpTable.$inferInsert;
export type MerchantFetchRecord = typeof merchantFetchTable.$inferSelect;
export type MerchantSubscriptionRecord = typeof merchantSubscriptionTable.$inferSelect;
export type DiceRollRecord = typeof diceRollTable.$inferSelect;
export type NewDiceRollRecord = typeof diceRollTable.$inferInsert;
export type ChooseRecord = typeof chooseTable.$inferSelect;
export type NewChooseRecord = typeof chooseTable.$inferInsert;
