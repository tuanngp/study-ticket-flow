import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "student",
  "instructor",
  "admin",
  "lead",
  "manager",
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

// Knowledge Base Enums
export const knowledgeVisibilityEnum = pgEnum("knowledge_visibility", [
  "public",
  "course_specific"
]);

// Group System Enums
export const groupRoleEnum = pgEnum("group_role", [
  "instructor",
  "class_leader", 
  "group_leader",
  "member"
]);

export const groupStatusEnum = pgEnum("group_status", [
  "active",
  "inactive", 
  "archived",
  "pending_approval"
]);

export const groupTicketTypeEnum = pgEnum("group_ticket_type", [
  "group_collaborative",
  "individual_support",
  "teacher_request",
  "group_discussion"
]);

export const groupEventTypeEnum = pgEnum("group_event_type", [
  "study_session",
  "assignment_deadline",
  "exam_schedule", 
  "group_meeting",
  "teacher_office_hours",
  "project_presentation"
]);

export const gradeTypeEnum = pgEnum("grade_type", [
  "group_project",
  "individual_contribution",
  "peer_review",
  "attendance",
  "participation",
  "quiz",
  "assignment"
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
  // Attachments
  images: text("images").array(),
  tags: text("tags").array(),
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

// Knowledge Base Tables
export const knowledgeEntries = pgTable("knowledge_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  instructorId: uuid("instructor_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: "set null" }),

  // Content
  questionText: text("question_text").notNull(),
  answerText: text("answer_text").notNull(),
  tags: text("tags").array().default([]),

  // Vector search
  questionEmbedding: vector("question_embedding", { dimensions: 768 }),

  // Visibility control
  visibility: knowledgeVisibilityEnum("visibility").notNull().default("public"),
  courseCode: text("course_code"),

  // Metadata
  viewCount: integer("view_count").notNull().default(0),
  helpfulCount: integer("helpful_count").notNull().default(0),
  notHelpfulCount: integer("not_helpful_count").notNull().default(0),

  // Version history
  version: integer("version").notNull().default(1),
  previousVersionId: uuid("previous_version_id").references((): any => knowledgeEntries.id),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  instructorIdx: index("idx_knowledge_entries_instructor").on(table.instructorId),
  courseIdx: index("idx_knowledge_entries_course").on(table.courseCode),
  visibilityIdx: index("idx_knowledge_entries_visibility").on(table.visibility),
  embeddingIdx: index("idx_knowledge_entries_embedding").using("ivfflat", table.questionEmbedding.op("vector_cosine_ops")),
}));

export const knowledgeFeedback = pgTable("knowledge_feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryId: uuid("entry_id")
    .notNull()
    .references(() => knowledgeEntries.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  ticketId: uuid("ticket_id").references(() => tickets.id, { onDelete: "set null" }),

  // Feedback
  isHelpful: boolean("is_helpful").notNull(),
  similarityScore: integer("similarity_score"),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  entryIdx: index("idx_knowledge_feedback_entry").on(table.entryId),
  studentIdx: index("idx_knowledge_feedback_student").on(table.studentId),
  uniqueEntryStudentTicket: index("idx_knowledge_feedback_unique").on(table.entryId, table.studentId, table.ticketId),
}));

export const knowledgeSuggestions = pgTable("knowledge_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  entryId: uuid("entry_id")
    .notNull()
    .references(() => knowledgeEntries.id, { onDelete: "cascade" }),

  // Ranking
  similarityScore: integer("similarity_score").notNull(),
  rankPosition: integer("rank_position").notNull(),

  // Interaction tracking
  wasViewed: boolean("was_viewed").notNull().default(false),
  wasHelpful: boolean("was_helpful"),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  ticketIdx: index("idx_knowledge_suggestions_ticket").on(table.ticketId),
  entryIdx: index("idx_knowledge_suggestions_entry").on(table.entryId),
  uniqueTicketEntry: index("idx_knowledge_suggestions_unique").on(table.ticketId, table.entryId),
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
  knowledgeEntries: many(knowledgeEntries, { relationName: "instructor" }),
  knowledgeFeedback: many(knowledgeFeedback, { relationName: "student" }),
  // Group system relations
  createdGroups: many(groups, { relationName: "groupCreator" }),
  instructedGroups: many(groups, { relationName: "groupInstructor" }),
  groupMemberships: many(groupMembers, { relationName: "groupMemberUser" }),
  groupInvitations: many(groupMembers, { relationName: "groupInviter" }),
  groupTicketsCreated: many(groupTickets, { relationName: "groupTicketCreator" }),
  groupEventsCreated: many(groupEvents, { relationName: "groupEventCreator" }),
  groupGradesReceived: many(groupGrades, { relationName: "gradedUser" }),
  groupGradesGiven: many(groupGrades, { relationName: "grader" }),
  groupChatMessages: many(groupChatMessages, { relationName: "chatMessageUser" }),
  groupAiSessionsCreated: many(groupAiSessions, { relationName: "aiSessionCreator" }),
  eventAttendance: many(groupEventAttendance, { relationName: "attendanceUser" }),
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
  knowledgeEntries: many(knowledgeEntries),
  knowledgeFeedback: many(knowledgeFeedback),
  knowledgeSuggestions: many(knowledgeSuggestions),
  // Group system relations
  groupTickets: many(groupTickets),
  groupGrades: many(groupGrades),
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
  // Group system relations
  groupAiSessions: many(groupAiSessions),
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
export const calendarEventsRelations = relations(calendarEvents, ({ one, many }) => ({
  user: one(profiles, {
    fields: [calendarEvents.userId],
    references: [profiles.id],
  }),
  ticket: one(tickets, {
    fields: [calendarEvents.ticketId],
    references: [tickets.id],
  }),
  // Group system relations
  groupEvents: many(groupEvents),
  groupGrades: many(groupGrades),
}));

// Knowledge Base Relations
export const knowledgeEntriesRelations = relations(knowledgeEntries, ({ one, many }) => ({
  instructor: one(profiles, {
    fields: [knowledgeEntries.instructorId],
    references: [profiles.id],
    relationName: "instructor",
  }),
  ticket: one(tickets, {
    fields: [knowledgeEntries.ticketId],
    references: [tickets.id],
  }),
  previousVersion: one(knowledgeEntries, {
    fields: [knowledgeEntries.previousVersionId],
    references: [knowledgeEntries.id],
    relationName: "previousVersion",
  }),
  feedback: many(knowledgeFeedback),
  suggestions: many(knowledgeSuggestions),
}));

export const knowledgeFeedbackRelations = relations(knowledgeFeedback, ({ one }) => ({
  entry: one(knowledgeEntries, {
    fields: [knowledgeFeedback.entryId],
    references: [knowledgeEntries.id],
  }),
  student: one(profiles, {
    fields: [knowledgeFeedback.studentId],
    references: [profiles.id],
    relationName: "student",
  }),
  ticket: one(tickets, {
    fields: [knowledgeFeedback.ticketId],
    references: [tickets.id],
  }),
}));

export const knowledgeSuggestionsRelations = relations(knowledgeSuggestions, ({ one }) => ({
  ticket: one(tickets, {
    fields: [knowledgeSuggestions.ticketId],
    references: [tickets.id],
  }),
  entry: one(knowledgeEntries, {
    fields: [knowledgeSuggestions.entryId],
    references: [knowledgeEntries.id],
  }),
}));

// Group System Tables
export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  
  // Educational context
  courseCode: text("course_code").notNull(),
  className: text("class_name"),
  semester: text("semester").notNull(),
  
  // Group settings
  maxMembers: integer("max_members").notNull().default(100),
  isPublic: boolean("is_public").notNull().default(true),
  allowSelfJoin: boolean("allow_self_join").notNull().default(true),
  
  // Status and metadata
  status: groupStatusEnum("status").notNull().default("active"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  instructorId: uuid("instructor_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  courseCodeIdx: index("idx_groups_course_code").on(table.courseCode),
  semesterIdx: index("idx_groups_semester").on(table.semester),
  statusIdx: index("idx_groups_status").on(table.status),
  createdByIdx: index("idx_groups_created_by").on(table.createdBy),
  instructorIdIdx: index("idx_groups_instructor_id").on(table.instructorId),
}));

export const groupMembers = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  
  // Role and permissions
  role: groupRoleEnum("role").notNull().default("member"),
  
  // Status and timestamps
  status: groupStatusEnum("status").notNull().default("active"),
  joinedAt: timestamp("joined_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  leftAt: timestamp("left_at", { withTimezone: true }),
  
  // Invitation system
  invitedBy: uuid("invited_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  invitationAcceptedAt: timestamp("invitation_accepted_at", { withTimezone: true }),
}, (table) => ({
  groupIdIdx: index("idx_group_members_group_id").on(table.groupId),
  userIdIdx: index("idx_group_members_user_id").on(table.userId),
  roleIdx: index("idx_group_members_role").on(table.role),
  statusIdx: index("idx_group_members_status").on(table.status),
  uniqueGroupUser: index("idx_group_members_unique").on(table.groupId, table.userId),
}));

export const groupTickets = pgTable("group_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  
  // Group-specific ticket properties
  ticketType: groupTicketTypeEnum("ticket_type").notNull().default("individual_support"),
  isShared: boolean("is_shared").notNull().default(false),
  requiresTeacherApproval: boolean("requires_teacher_approval").notNull().default(false),
  
  // Collaboration metadata
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  assignedToGroup: boolean("assigned_to_group").notNull().default(false),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  groupIdIdx: index("idx_group_tickets_group_id").on(table.groupId),
  ticketIdIdx: index("idx_group_tickets_ticket_id").on(table.ticketId),
  typeIdx: index("idx_group_tickets_type").on(table.ticketType),
  createdByIdx: index("idx_group_tickets_created_by").on(table.createdBy),
  uniqueGroupTicket: index("idx_group_tickets_unique").on(table.groupId, table.ticketId),
}));

export const groupEvents = pgTable("group_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  eventId: uuid("event_id")
    .notNull()
    .references(() => calendarEvents.id, { onDelete: "cascade" }),
  
  // Group-specific event properties
  eventType: groupEventTypeEnum("event_type").notNull().default("study_session"),
  requiresAttendance: boolean("requires_attendance").notNull().default(false),
  maxParticipants: integer("max_participants"),
  
  // Created by
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  groupIdIdx: index("idx_group_events_group_id").on(table.groupId),
  eventIdIdx: index("idx_group_events_event_id").on(table.eventId),
  typeIdx: index("idx_group_events_type").on(table.eventType),
  createdByIdx: index("idx_group_events_created_by").on(table.createdBy),
  uniqueGroupEvent: index("idx_group_events_unique").on(table.groupId, table.eventId),
}));

export const groupEventAttendance = pgTable("group_event_attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupEventId: uuid("group_event_id")
    .notNull()
    .references(() => groupEvents.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  
  // Attendance status
  status: text("status").notNull().default("pending"),
  reason: text("reason"),
  
  // Timestamps
  respondedAt: timestamp("responded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  eventIdIdx: index("idx_group_event_attendance_event_id").on(table.groupEventId),
  userIdIdx: index("idx_group_event_attendance_user_id").on(table.userId),
  statusIdx: index("idx_group_event_attendance_status").on(table.status),
  uniqueEventUser: index("idx_group_event_attendance_unique").on(table.groupEventId, table.userId),
}));

export const groupGrades = pgTable("group_grades", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  
  // Grade information
  gradeType: gradeTypeEnum("grade_type").notNull(),
  score: text("score").notNull(), // Using text to match existing pattern
  maxScore: text("max_score").notNull().default("100.00"),
  
  // Grading metadata
  gradedBy: uuid("graded_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  feedback: text("feedback"),
  rubricData: jsonb("rubric_data").default({}),
  
  // Related entities
  ticketId: uuid("ticket_id").references(() => tickets.id, {
    onDelete: "set null",
  }),
  eventId: uuid("event_id").references(() => calendarEvents.id, {
    onDelete: "set null",
  }),
  
  // Timestamps
  gradedAt: timestamp("graded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  groupIdIdx: index("idx_group_grades_group_id").on(table.groupId),
  userIdIdx: index("idx_group_grades_user_id").on(table.userId),
  typeIdx: index("idx_group_grades_type").on(table.gradeType),
  gradedByIdx: index("idx_group_grades_graded_by").on(table.gradedBy),
}));

export const groupChatMessages = pgTable("group_chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  
  // Message content
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"),
  
  // File attachments
  attachments: jsonb("attachments").default([]),
  
  // Message metadata
  replyTo: uuid("reply_to").references((): any => groupChatMessages.id, {
    onDelete: "set null",
  }),
  isEdited: boolean("is_edited").notNull().default(false),
  editedAt: timestamp("edited_at", { withTimezone: true }),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  groupIdIdx: index("idx_group_chat_messages_group_id").on(table.groupId),
  userIdIdx: index("idx_group_chat_messages_user_id").on(table.userId),
  createdAtIdx: index("idx_group_chat_messages_created_at").on(table.createdAt),
}));

export const groupAiSessions = pgTable("group_ai_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  
  // Session metadata
  sessionName: text("session_name"),
  isShared: boolean("is_shared").notNull().default(true),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  groupIdIdx: index("idx_group_ai_sessions_group_id").on(table.groupId),
  sessionIdIdx: index("idx_group_ai_sessions_session_id").on(table.sessionId),
  uniqueGroupSession: index("idx_group_ai_sessions_unique").on(table.groupId, table.sessionId),
}));

// Type exports for knowledge base tables
export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect;
export type NewKnowledgeEntry = typeof knowledgeEntries.$inferInsert;
export type KnowledgeFeedback = typeof knowledgeFeedback.$inferSelect;
export type NewKnowledgeFeedback = typeof knowledgeFeedback.$inferInsert;
export type KnowledgeSuggestion = typeof knowledgeSuggestions.$inferSelect;
export type NewKnowledgeSuggestion = typeof knowledgeSuggestions.$inferInsert;

// Type exports for group system tables
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;
export type GroupTicket = typeof groupTickets.$inferSelect;
export type NewGroupTicket = typeof groupTickets.$inferInsert;
export type GroupEvent = typeof groupEvents.$inferSelect;
export type NewGroupEvent = typeof groupEvents.$inferInsert;
export type GroupEventAttendance = typeof groupEventAttendance.$inferSelect;
export type NewGroupEventAttendance = typeof groupEventAttendance.$inferInsert;
export type GroupGrade = typeof groupGrades.$inferSelect;
export type NewGroupGrade = typeof groupGrades.$inferInsert;
export type GroupChatMessage = typeof groupChatMessages.$inferSelect;
export type NewGroupChatMessage = typeof groupChatMessages.$inferInsert;
export type GroupAiSession = typeof groupAiSessions.$inferSelect;
export type NewGroupAiSession = typeof groupAiSessions.$inferInsert;

// Group System Relations
export const groupsRelations = relations(groups, ({ one, many }) => ({
  createdBy: one(profiles, {
    fields: [groups.createdBy],
    references: [profiles.id],
    relationName: "groupCreator",
  }),
  instructor: one(profiles, {
    fields: [groups.instructorId],
    references: [profiles.id],
    relationName: "groupInstructor",
  }),
  members: many(groupMembers),
  tickets: many(groupTickets),
  events: many(groupEvents),
  grades: many(groupGrades),
  chatMessages: many(groupChatMessages),
  aiSessions: many(groupAiSessions),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(profiles, {
    fields: [groupMembers.userId],
    references: [profiles.id],
    relationName: "groupMemberUser",
  }),
  invitedBy: one(profiles, {
    fields: [groupMembers.invitedBy],
    references: [profiles.id],
    relationName: "groupInviter",
  }),
}));

export const groupTicketsRelations = relations(groupTickets, ({ one }) => ({
  group: one(groups, {
    fields: [groupTickets.groupId],
    references: [groups.id],
  }),
  ticket: one(tickets, {
    fields: [groupTickets.ticketId],
    references: [tickets.id],
  }),
  createdBy: one(profiles, {
    fields: [groupTickets.createdBy],
    references: [profiles.id],
    relationName: "groupTicketCreator",
  }),
}));

export const groupEventsRelations = relations(groupEvents, ({ one, many }) => ({
  group: one(groups, {
    fields: [groupEvents.groupId],
    references: [groups.id],
  }),
  event: one(calendarEvents, {
    fields: [groupEvents.eventId],
    references: [calendarEvents.id],
  }),
  createdBy: one(profiles, {
    fields: [groupEvents.createdBy],
    references: [profiles.id],
    relationName: "groupEventCreator",
  }),
  attendance: many(groupEventAttendance),
}));

export const groupEventAttendanceRelations = relations(groupEventAttendance, ({ one }) => ({
  groupEvent: one(groupEvents, {
    fields: [groupEventAttendance.groupEventId],
    references: [groupEvents.id],
  }),
  user: one(profiles, {
    fields: [groupEventAttendance.userId],
    references: [profiles.id],
    relationName: "attendanceUser",
  }),
}));

export const groupGradesRelations = relations(groupGrades, ({ one }) => ({
  group: one(groups, {
    fields: [groupGrades.groupId],
    references: [groups.id],
  }),
  user: one(profiles, {
    fields: [groupGrades.userId],
    references: [profiles.id],
    relationName: "gradedUser",
  }),
  gradedBy: one(profiles, {
    fields: [groupGrades.gradedBy],
    references: [profiles.id],
    relationName: "grader",
  }),
  ticket: one(tickets, {
    fields: [groupGrades.ticketId],
    references: [tickets.id],
  }),
  event: one(calendarEvents, {
    fields: [groupGrades.eventId],
    references: [calendarEvents.id],
  }),
}));

export const groupChatMessagesRelations = relations(groupChatMessages, ({ one }) => ({
  group: one(groups, {
    fields: [groupChatMessages.groupId],
    references: [groups.id],
  }),
  user: one(profiles, {
    fields: [groupChatMessages.userId],
    references: [profiles.id],
    relationName: "chatMessageUser",
  }),
  replyTo: one(groupChatMessages, {
    fields: [groupChatMessages.replyTo],
    references: [groupChatMessages.id],
    relationName: "replyToMessage",
  }),
}));

export const groupAiSessionsRelations = relations(groupAiSessions, ({ one }) => ({
  group: one(groups, {
    fields: [groupAiSessions.groupId],
    references: [groups.id],
  }),
  session: one(chatSessions, {
    fields: [groupAiSessions.sessionId],
    references: [chatSessions.id],
  }),
  createdBy: one(profiles, {
    fields: [groupAiSessions.createdBy],
    references: [profiles.id],
    relationName: "aiSessionCreator",
  }),
}));
