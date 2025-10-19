import { relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  vector,
  index,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "student",
  "instructor",
  "admin",
]);
export const ticketTypeEnum = pgEnum("ticket_type", [
  "bug",
  "feature",
  "question",
  "task",
]);
export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);
export const ticketStatusEnum = pgEnum("ticket_status", [
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

// RAG Assistant Enums
export const notificationTypeEnum = pgEnum("notification_type", [
  "ticket_created",
  "ticket_assigned", 
  "ticket_status_changed",
  "ticket_resolved",
  "ticket_due_soon",
  "comment_added",
  "mention",
  "ai_triage_complete",
  "assignment_failed",
  "deadline_warning",
  "similar_ticket_found",
  "weekly_report",
  "trend_alert",
  "workload_high",
  "sla_breach"
]);

export const notificationPriorityEnum = pgEnum("notification_priority", [
  "low",
  "medium", 
  "high",
  "urgent"
]);

// Tables
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: userRoleEnum("role").notNull().default("student"),
  avatarUrl: text("avatar_url"),
  career: text("career"),
  phone: text("phone"),
  bio: text("bio"),
  country: text("country"),
  state: text("state"),
  postalCode: text("postal_code"),
  taxId: text("tax_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: ticketTypeEnum("type").notNull().default("task"),
  priority: ticketPriorityEnum("priority").notNull().default("medium"),
  status: ticketStatusEnum("status").notNull().default("open"),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  assigneeId: uuid("assignee_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  aiSuggestedPriority: ticketPriorityEnum("ai_suggested_priority"),
  aiSuggestedAssignee: uuid("ai_suggested_assignee").references(
    () => profiles.id,
    { onDelete: "set null" }
  ),
  // Educational context
  courseCode: text("course_code"),
  className: text("class_name"),
  projectGroup: text("project_group"),
  // AI analysis metadata
  aiAnalysis: text("ai_analysis"),
  aiConfidenceScore: text("ai_confidence_score"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const ticketComments = pgTable("ticket_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// RAG Assistant Tables
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  embedding: vector("embedding", { dimensions: 768 }), // Gemini text-embedding-004 uses 768 dimensions
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  embeddingIdx: index("documents_embedding_idx").using("ivfflat", table.embedding.op("vector_cosine_ops")),
  contentIdx: index("documents_content_idx").on(table.content),
  metadataIdx: index("documents_metadata_idx").on(table.metadata),
}));

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  userIdx: index("chat_sessions_user_idx").on(table.userId, table.createdAt),
}));

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  sessionIdx: index("chat_messages_session_idx").on(table.sessionId, table.createdAt),
}));

export const rateLimits = pgTable("rate_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" })
    .unique(),
  count: integer("count").default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  userResetIdx: index("rate_limits_user_reset_idx").on(table.userId, table.resetAt),
}));

// Notification System Tables
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: notificationPriorityEnum("priority").notNull().default("medium"),
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: "cascade" }),
  metadata: jsonb("metadata").default({}),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  deliveredChannels: text("delivered_channels").array().default(["in_app"]),
  actions: jsonb("actions").default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_notifications_user_id").on(table.userId),
  ticketIdIdx: index("idx_notifications_ticket_id").on(table.ticketId),
  isReadIdx: index("idx_notifications_is_read").on(table.isRead),
  createdAtIdx: index("idx_notifications_created_at").on(table.createdAt),
  typeIdx: index("idx_notifications_type").on(table.type),
  userUnreadIdx: index("idx_notifications_user_unread").on(table.userId, table.isRead),
  userCreatedIdx: index("idx_notifications_user_created").on(table.userId, table.createdAt),
}));

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  notificationType: notificationTypeEnum("notification_type").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  channels: text("channels").array().default(["in_app", "email"]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_notification_preferences_user_id").on(table.userId),
  uniqueUserType: index("idx_notification_preferences_unique").on(table.userId, table.notificationType),
}));

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  createdTickets: many(tickets, { relationName: "creator" }),
  assignedTickets: many(tickets, { relationName: "assignee" }),
  comments: many(ticketComments),
  chatSessions: many(chatSessions),
  rateLimits: many(rateLimits),
  notifications: many(notifications),
  notificationPreferences: many(notificationPreferences),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  creator: one(profiles, {
    fields: [tickets.creatorId],
    references: [profiles.id],
    relationName: "creator",
  }),
  assignee: one(profiles, {
    fields: [tickets.assigneeId],
    references: [profiles.id],
    relationName: "assignee",
  }),
  aiSuggestedAssignee: one(profiles, {
    fields: [tickets.aiSuggestedAssignee],
    references: [profiles.id],
    relationName: "aiSuggestedAssignee",
  }),
  comments: many(ticketComments),
  notifications: many(notifications),
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

// RAG Assistant Relations
export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(profiles, {
    fields: [chatSessions.userId],
    references: [profiles.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}));

export const rateLimitsRelations = relations(rateLimits, ({ one }) => ({
  user: one(profiles, {
    fields: [rateLimits.userId],
    references: [profiles.id],
  }),
}));

// Notification Relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.userId],
    references: [profiles.id],
  }),
  ticket: one(tickets, {
    fields: [notifications.ticketId],
    references: [tickets.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(profiles, {
    fields: [notificationPreferences.userId],
    references: [profiles.id],
  }),
}));
