CREATE TYPE "public"."grade_type" AS ENUM('group_project', 'individual_contribution', 'peer_review', 'attendance', 'participation', 'quiz', 'assignment');--> statement-breakpoint
CREATE TYPE "public"."group_event_type" AS ENUM('study_session', 'assignment_deadline', 'exam_schedule', 'group_meeting', 'teacher_office_hours', 'project_presentation');--> statement-breakpoint
CREATE TYPE "public"."group_role" AS ENUM('instructor', 'class_leader', 'group_leader', 'member');--> statement-breakpoint
CREATE TYPE "public"."group_status" AS ENUM('active', 'inactive', 'archived', 'pending_approval');--> statement-breakpoint
CREATE TYPE "public"."group_ticket_type" AS ENUM('group_collaborative', 'individual_support', 'teacher_request', 'group_discussion');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'lead';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'manager';--> statement-breakpoint
CREATE TABLE "group_ai_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"session_name" text,
	"is_shared" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'text' NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"reply_to" uuid,
	"is_edited" boolean DEFAULT false NOT NULL,
	"edited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_event_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text,
	"responded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"event_type" "group_event_type" DEFAULT 'study_session' NOT NULL,
	"requires_attendance" boolean DEFAULT false NOT NULL,
	"max_participants" integer,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_grades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"grade_type" "grade_type" NOT NULL,
	"score" text NOT NULL,
	"max_score" text DEFAULT '100.00' NOT NULL,
	"graded_by" uuid NOT NULL,
	"feedback" text,
	"rubric_data" jsonb DEFAULT '{}'::jsonb,
	"ticket_id" uuid,
	"event_id" uuid,
	"graded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "group_role" DEFAULT 'member' NOT NULL,
	"status" "group_status" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"invited_by" uuid,
	"invitation_accepted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "group_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"ticket_type" "group_ticket_type" DEFAULT 'individual_support' NOT NULL,
	"is_shared" boolean DEFAULT false NOT NULL,
	"requires_teacher_approval" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"assigned_to_group" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"course_code" text NOT NULL,
	"class_name" text,
	"semester" text NOT NULL,
	"max_members" integer DEFAULT 100 NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"allow_self_join" boolean DEFAULT true NOT NULL,
	"status" "group_status" DEFAULT 'active' NOT NULL,
	"created_by" uuid NOT NULL,
	"instructor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_ai_sessions" ADD CONSTRAINT "group_ai_sessions_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_ai_sessions" ADD CONSTRAINT "group_ai_sessions_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_ai_sessions" ADD CONSTRAINT "group_ai_sessions_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_chat_messages" ADD CONSTRAINT "group_chat_messages_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_chat_messages" ADD CONSTRAINT "group_chat_messages_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_chat_messages" ADD CONSTRAINT "group_chat_messages_reply_to_group_chat_messages_id_fk" FOREIGN KEY ("reply_to") REFERENCES "public"."group_chat_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_event_attendance" ADD CONSTRAINT "group_event_attendance_group_event_id_group_events_id_fk" FOREIGN KEY ("group_event_id") REFERENCES "public"."group_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_event_attendance" ADD CONSTRAINT "group_event_attendance_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_events" ADD CONSTRAINT "group_events_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_events" ADD CONSTRAINT "group_events_event_id_calendar_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_events" ADD CONSTRAINT "group_events_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_grades" ADD CONSTRAINT "group_grades_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_grades" ADD CONSTRAINT "group_grades_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_grades" ADD CONSTRAINT "group_grades_graded_by_profiles_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_grades" ADD CONSTRAINT "group_grades_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_grades" ADD CONSTRAINT "group_grades_event_id_calendar_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_invited_by_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_tickets" ADD CONSTRAINT "group_tickets_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_tickets" ADD CONSTRAINT "group_tickets_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_tickets" ADD CONSTRAINT "group_tickets_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_instructor_id_profiles_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_group_ai_sessions_group_id" ON "group_ai_sessions" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_group_ai_sessions_session_id" ON "group_ai_sessions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_group_ai_sessions_unique" ON "group_ai_sessions" USING btree ("group_id","session_id");--> statement-breakpoint
CREATE INDEX "idx_group_chat_messages_group_id" ON "group_chat_messages" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_group_chat_messages_user_id" ON "group_chat_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_group_chat_messages_created_at" ON "group_chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_group_event_attendance_event_id" ON "group_event_attendance" USING btree ("group_event_id");--> statement-breakpoint
CREATE INDEX "idx_group_event_attendance_user_id" ON "group_event_attendance" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_group_event_attendance_status" ON "group_event_attendance" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_group_event_attendance_unique" ON "group_event_attendance" USING btree ("group_event_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_group_events_group_id" ON "group_events" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_group_events_event_id" ON "group_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_group_events_type" ON "group_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_group_events_created_by" ON "group_events" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_group_events_unique" ON "group_events" USING btree ("group_id","event_id");--> statement-breakpoint
CREATE INDEX "idx_group_grades_group_id" ON "group_grades" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_group_grades_user_id" ON "group_grades" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_group_grades_type" ON "group_grades" USING btree ("grade_type");--> statement-breakpoint
CREATE INDEX "idx_group_grades_graded_by" ON "group_grades" USING btree ("graded_by");--> statement-breakpoint
CREATE INDEX "idx_group_members_group_id" ON "group_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_group_members_user_id" ON "group_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_group_members_role" ON "group_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_group_members_status" ON "group_members" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_group_members_unique" ON "group_members" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_group_tickets_group_id" ON "group_tickets" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_group_tickets_ticket_id" ON "group_tickets" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_group_tickets_type" ON "group_tickets" USING btree ("ticket_type");--> statement-breakpoint
CREATE INDEX "idx_group_tickets_created_by" ON "group_tickets" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_group_tickets_unique" ON "group_tickets" USING btree ("group_id","ticket_id");--> statement-breakpoint
CREATE INDEX "idx_groups_course_code" ON "groups" USING btree ("course_code");--> statement-breakpoint
CREATE INDEX "idx_groups_semester" ON "groups" USING btree ("semester");--> statement-breakpoint
CREATE INDEX "idx_groups_status" ON "groups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_groups_created_by" ON "groups" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_groups_instructor_id" ON "groups" USING btree ("instructor_id");