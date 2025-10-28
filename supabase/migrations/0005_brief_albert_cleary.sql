CREATE TYPE "public"."knowledge_visibility" AS ENUM('public', 'course_specific');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'ticket_updated' BEFORE 'ticket_due_soon';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'ticket_deleted' BEFORE 'ticket_due_soon';--> statement-breakpoint
ALTER TYPE "public"."ticket_status" ADD VALUE 'deleted';--> statement-breakpoint
CREATE TABLE "knowledge_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instructor_id" uuid NOT NULL,
	"ticket_id" uuid,
	"question_text" text NOT NULL,
	"answer_text" text NOT NULL,
	"tags" text[] DEFAULT '{}',
	"question_embedding" vector(768),
	"visibility" "knowledge_visibility" DEFAULT 'public' NOT NULL,
	"course_code" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"not_helpful_count" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"previous_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"ticket_id" uuid,
	"is_helpful" boolean NOT NULL,
	"similarity_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"similarity_score" integer NOT NULL,
	"rank_position" integer NOT NULL,
	"was_viewed" boolean DEFAULT false NOT NULL,
	"was_helpful" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "images" text[];--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "knowledge_entries" ADD CONSTRAINT "knowledge_entries_instructor_id_profiles_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_entries" ADD CONSTRAINT "knowledge_entries_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_entries" ADD CONSTRAINT "knowledge_entries_previous_version_id_knowledge_entries_id_fk" FOREIGN KEY ("previous_version_id") REFERENCES "public"."knowledge_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_feedback" ADD CONSTRAINT "knowledge_feedback_entry_id_knowledge_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."knowledge_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_feedback" ADD CONSTRAINT "knowledge_feedback_student_id_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_feedback" ADD CONSTRAINT "knowledge_feedback_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_suggestions" ADD CONSTRAINT "knowledge_suggestions_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_suggestions" ADD CONSTRAINT "knowledge_suggestions_entry_id_knowledge_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."knowledge_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_knowledge_entries_instructor" ON "knowledge_entries" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_entries_course" ON "knowledge_entries" USING btree ("course_code");--> statement-breakpoint
CREATE INDEX "idx_knowledge_entries_visibility" ON "knowledge_entries" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_knowledge_entries_embedding" ON "knowledge_entries" USING ivfflat ("question_embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "idx_knowledge_feedback_entry" ON "knowledge_feedback" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_feedback_student" ON "knowledge_feedback" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_feedback_unique" ON "knowledge_feedback" USING btree ("entry_id","student_id","ticket_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_suggestions_ticket" ON "knowledge_suggestions" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_suggestions_entry" ON "knowledge_suggestions" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_suggestions_unique" ON "knowledge_suggestions" USING btree ("ticket_id","entry_id");