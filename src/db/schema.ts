import { pgTable, text, uuid, timestamp, pgEnum, integer, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['student', 'lead', 'instructor']);
export const ticketTypeEnum = pgEnum('ticket_type', ['bug', 'feature', 'question', 'task']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'medium', 'high', 'critical']);
export const ticketStatusEnum = pgEnum('ticket_status', ['open', 'in_progress', 'resolved', 'closed']);

// Tables
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  fullName: text('full_name'),
  role: userRoleEnum('role').notNull().default('student'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Note: This is a simplified auth.users reference for Drizzle
// In real Supabase, you'd use the actual auth schema
const authUsers = pgTable('auth.users', {
  id: uuid('id').primaryKey(),
  email: text('email'),
});

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: ticketTypeEnum('type').notNull().default('task'),
  priority: ticketPriorityEnum('priority').notNull().default('medium'),
  status: ticketStatusEnum('status').notNull().default('open'),
  creatorId: uuid('creator_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  assigneeId: uuid('assignee_id').references(() => profiles.id, { onDelete: 'set null' }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  aiSuggestedPriority: ticketPriorityEnum('ai_suggested_priority'),
  aiSuggestedAssignee: uuid('ai_suggested_assignee').references(() => profiles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ticketComments = pgTable('ticket_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  createdTickets: many(tickets, { relationName: 'creator' }),
  assignedTickets: many(tickets, { relationName: 'assignee' }),
  comments: many(ticketComments),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [tickets.creatorId],
    references: [profiles.id],
    relationName: 'creator',
  }),
  assignee: one(profiles, {
    fields: [tickets.assigneeId],
    references: [profiles.id],
    relationName: 'assignee',
  }),
  aiSuggestedAssignee: one(profiles, {
    fields: [tickets.aiSuggestedAssignee],
    references: [profiles.id],
    relationName: 'aiSuggestedAssignee',
  }),
  comments: many(ticketComments),
  ticketTags: many(ticketTags),
}));

export const ticketCommentsRelations = relations(ticketComments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketComments.ticketId],
    references: [tickets.id],
  }),
  user: one(profiles, {
    fields: [ticketComments.userId],
    references: [profiles.id],
  }),
}));

// Example: Thêm table mới cho tags
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  color: text('color').default('#3b82f6'), // Default blue color
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ticketTags = pgTable('ticket_tags', {
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.ticketId, table.tagId] }),
}));

// Relations cho tags
export const tagsRelations = relations(tags, ({ many }) => ({
  ticketTags: many(ticketTags),
}));

export const ticketTagsRelations = relations(ticketTags, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketTags.ticketId],
    references: [tickets.id],
  }),
  tag: one(tags, {
    fields: [ticketTags.tagId],
    references: [tags.id],
  }),
}));
