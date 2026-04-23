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

export type JrrpRecord = typeof jrrpTable.$inferSelect;
export type NewJrrpRecord = typeof jrrpTable.$inferInsert;
