CREATE TYPE "public"."event_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('personal', 'academic', 'assignment', 'exam', 'meeting', 'deadline', 'reminder');--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "event_type" DEFAULT 'personal' NOT NULL,
	"status" "event_status" DEFAULT 'scheduled' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"location" text,
	"color" text DEFAULT '#3b82f6',
	"user_id" uuid NOT NULL,
	"ticket_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_calendar_events_user_id" ON "calendar_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_start_date" ON "calendar_events" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_end_date" ON "calendar_events" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_type" ON "calendar_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_status" ON "calendar_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_ticket_id" ON "calendar_events" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_events_user_date" ON "calendar_events" USING btree ("user_id","start_date");