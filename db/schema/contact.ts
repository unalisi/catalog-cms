import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const contactMessages = sqliteTable('contact_messages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  message: text('message').notNull(),
  createdAt: text('created_at').notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
