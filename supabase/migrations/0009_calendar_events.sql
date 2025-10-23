-- Create enum types for calendar events
CREATE TYPE "public"."event_type" AS ENUM('personal', 'academic', 'assignment', 'exam', 'meeting', 'deadline', 'reminder');
CREATE TYPE "public"."event_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS "public"."calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "public"."event_type" DEFAULT 'personal' NOT NULL,
	"status" "public"."event_status" DEFAULT 'scheduled' NOT NULL,
	"start_date" timestamptz NOT NULL,
	"end_date" timestamptz,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"location" text,
	"color" text DEFAULT '#3b82f6',
	"user_id" uuid NOT NULL,
	"ticket_id" uuid,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for calendar_events
CREATE INDEX "idx_calendar_events_user_id" ON "public"."calendar_events" USING btree ("user_id");
CREATE INDEX "idx_calendar_events_start_date" ON "public"."calendar_events" USING btree ("start_date");
CREATE INDEX "idx_calendar_events_end_date" ON "public"."calendar_events" USING btree ("end_date");
CREATE INDEX "idx_calendar_events_type" ON "public"."calendar_events" USING btree ("type");
CREATE INDEX "idx_calendar_events_status" ON "public"."calendar_events" USING btree ("status");
CREATE INDEX "idx_calendar_events_ticket_id" ON "public"."calendar_events" USING btree ("ticket_id");
CREATE INDEX "idx_calendar_events_user_date" ON "public"."calendar_events" USING btree ("user_id", "start_date");

-- Add foreign key constraints
ALTER TABLE "public"."calendar_events" ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
ALTER TABLE "public"."calendar_events" ADD CONSTRAINT "calendar_events_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;

-- Add RLS policies
ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own events
CREATE POLICY "Users can view their own events" ON "public"."calendar_events"
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own events
CREATE POLICY "Users can insert their own events" ON "public"."calendar_events"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own events
CREATE POLICY "Users can update their own events" ON "public"."calendar_events"
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own events
CREATE POLICY "Users can delete their own events" ON "public"."calendar_events"
    FOR DELETE USING (auth.uid() = user_id);
