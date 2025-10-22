CREATE TYPE "public"."review_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."review_type" AS ENUM('quality', 'completeness', 'clarity', 'helpfulness', 'overall');--> statement-breakpoint
CREATE TABLE "review_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "review_type" NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"overall_rating" integer NOT NULL,
	"quality_rating" integer,
	"completeness_rating" integer,
	"clarity_rating" integer,
	"helpfulness_rating" integer,
	"feedback" text,
	"suggestions" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ticket_reviews" ADD CONSTRAINT "ticket_reviews_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_reviews" ADD CONSTRAINT "ticket_reviews_reviewer_id_profiles_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_review_criteria_type" ON "review_criteria" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_review_criteria_active" ON "review_criteria" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_ticket_reviews_ticket_id" ON "ticket_reviews" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_ticket_reviews_reviewer_id" ON "ticket_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_ticket_reviews_status" ON "ticket_reviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ticket_reviews_ticket_reviewer" ON "ticket_reviews" USING btree ("ticket_id","reviewer_id");