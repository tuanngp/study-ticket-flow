-- Enhanced Ticket Schema Migration
-- Add educational context and AI metadata fields to tickets table

-- Add educational context fields to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS course_code text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS class_name text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS project_group text;

-- Add AI analysis metadata fields to tickets table
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ai_analysis text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ai_confidence_score text;

-- Add comments to document the new fields
COMMENT ON COLUMN tickets.course_code IS 'Course code for educational context (e.g., PRJ301, SWP391)';
COMMENT ON COLUMN tickets.class_name IS 'Class name for educational context (e.g., SE1730, SE1731)';
COMMENT ON COLUMN tickets.project_group IS 'Project group for educational context (e.g., Team 07, Group A)';
COMMENT ON COLUMN tickets.ai_analysis IS 'AI analysis results and reasoning';
COMMENT ON COLUMN tickets.ai_confidence_score IS 'AI confidence score (0-100) for suggestions';

-- Create indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_tickets_course_code ON tickets(course_code);
CREATE INDEX IF NOT EXISTS idx_tickets_class_name ON tickets(class_name);
CREATE INDEX IF NOT EXISTS idx_tickets_project_group ON tickets(project_group);
CREATE INDEX IF NOT EXISTS idx_tickets_ai_confidence ON tickets(ai_confidence_score);

-- Create composite index for educational context queries
CREATE INDEX IF NOT EXISTS idx_tickets_educational_context ON tickets(course_code, class_name, project_group);

-- Update existing tickets with default values for new fields (optional)
-- UPDATE tickets SET course_code = 'UNKNOWN' WHERE course_code IS NULL;
-- UPDATE tickets SET class_name = 'UNKNOWN' WHERE class_name IS NULL;
-- UPDATE tickets SET project_group = 'UNKNOWN' WHERE project_group IS NULL;