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
  "grading",
  "report",
  "config",
  "assignment",
  "exam",
  "submission",
  "technical",
  "academic",
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
  "deleted",
]);

// RAG Assistant Enums
export const notificationTypeEnum = pgEnum("notification_type", [
  "ticket_created",
  "ticket_assigned", 
  "ticket_status_changed",
  "ticket_resolved",
  "ticket_updated",
  "ticket_deleted",
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

// Review System Enums
export const reviewTypeEnum = pgEnum("review_type", [
  "quality",
  "completeness", 
  "clarity",
  "helpfulness",
  "overall"
]);

export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled"
]);

// Calendar Event Enums
export const eventTypeEnum = pgEnum("event_type", [
  "personal",
  "academic",
  "assignment",
  "exam",
  "meeting",
  "deadline",
  "reminder"
]);

export const eventStatusEnum = pgEnum("event_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled"
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

// Review System Tables
export const ticketReviews = pgTable("ticket_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  reviewerId: uuid("reviewer_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  status: reviewStatusEnum("status").notNull().default("pending"),
  overallRating: integer("overall_rating").notNull(), // 1-5 scale
  qualityRating: integer("quality_rating"), // 1-5 scale
  completenessRating: integer("completeness_rating"), // 1-5 scale
  clarityRating: integer("clarity_rating"), // 1-5 scale
  helpfulnessRating: integer("helpfulness_rating"), // 1-5 scale
  feedback: text("feedback"), // Written feedback
  suggestions: text("suggestions"), // Improvement suggestions
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  metadata: jsonb("metadata").default({}), // Additional review data
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  ticketIdIdx: index("idx_ticket_reviews_ticket_id").on(table.ticketId),
  reviewerIdIdx: index("idx_ticket_reviews_reviewer_id").on(table.reviewerId),
  statusIdx: index("idx_ticket_reviews_status").on(table.status),
  ticketReviewerIdx: index("idx_ticket_reviews_ticket_reviewer").on(table.ticketId, table.reviewerId),
}));

export const reviewCriteria = pgTable("review_criteria", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  type: reviewTypeEnum("type").notNull(),
  weight: integer("weight").notNull().default(1), // Weight for calculating overall score
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  typeIdx: index("idx_review_criteria_type").on(table.type),
  activeIdx: index("idx_review_criteria_active").on(table.isActive),
}));

// Calendar Events Table
export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  type: eventTypeEnum("type").notNull().default("personal"),
  status: eventStatusEnum("status").notNull().default("scheduled"),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  isAllDay: boolean("is_all_day").notNull().default(false),
  location: text("location"),
  color: text("color").default("#3b82f6"), // Default blue color
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: "cascade" }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_calendar_events_user_id").on(table.userId),
  startDateIdx: index("idx_calendar_events_start_date").on(table.startDate),
  endDateIdx: index("idx_calendar_events_end_date").on(table.endDate),
  typeIdx: index("idx_calendar_events_type").on(table.type),
  statusIdx: index("idx_calendar_events_status").on(table.status),
  ticketIdIdx: index("idx_calendar_events_ticket_id").on(table.ticketId),
  userDateIdx: index("idx_calendar_events_user_date").on(table.userId, table.startDate),
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
  reviews: many(ticketReviews, { relationName: "reviewer" }),
  calendarEvents: many(calendarEvents),
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
  reviews: many(ticketReviews),
  calendarEvents: many(calendarEvents),
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

// Review Relations
export const ticketReviewsRelations = relations(ticketReviews, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketReviews.ticketId],
    references: [tickets.id],
  }),
  reviewer: one(profiles, {
    fields: [ticketReviews.reviewerId],
    references: [profiles.id],
    relationName: "reviewer",
  }),
}));

// Calendar Event Relations
export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  user: one(profiles, {
    fields: [calendarEvents.userId],
    references: [profiles.id],
  }),
  ticket: one(tickets, {
    fields: [calendarEvents.ticketId],
    references: [tickets.id],
  }),
}));
