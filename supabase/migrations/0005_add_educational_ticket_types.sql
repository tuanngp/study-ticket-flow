-- Add educational ticket types to existing enum
ALTER TYPE "public"."ticket_type" ADD VALUE IF NOT EXISTS 'grading';
ALTER TYPE "public"."ticket_type" ADD VALUE IF NOT EXISTS 'report';
ALTER TYPE "public"."ticket_type" ADD VALUE IF NOT EXISTS 'config';
ALTER TYPE "public"."ticket_type" ADD VALUE IF NOT EXISTS 'assignment';
ALTER TYPE "public"."ticket_type" ADD VALUE IF NOT EXISTS 'exam';
ALTER TYPE "public"."ticket_type" ADD VALUE IF NOT EXISTS 'submission';
ALTER TYPE "public"."ticket_type" ADD VALUE IF NOT EXISTS 'technical';
ALTER TYPE "public"."ticket_type" ADD VALUE IF NOT EXISTS 'academic';
