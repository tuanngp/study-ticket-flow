-- Knowledge Base Auto-Save System Migration
-- This migration creates tables for instructor knowledge entries, student feedback, and auto-suggestions

-- ============================================================================
-- 1. knowledge_entries table
-- ============================================================================
-- Stores instructor-created knowledge base entries with vector embeddings for similarity search

CREATE TABLE knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,

  -- Content
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',

  -- Vector search (768 dimensions for Gemini text-embedding-004)
  question_embedding vector(768),

  -- Visibility control
  visibility TEXT NOT NULL DEFAULT 'public',
  course_code TEXT,

  -- Usage statistics
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,

  -- Version history
  version INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES knowledge_entries(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_visibility CHECK (visibility IN ('public', 'course_specific')),
  CONSTRAINT course_required_for_specific CHECK (
    (visibility = 'course_specific' AND course_code IS NOT NULL) OR
    (visibility = 'public')
  )
);

-- Indexes for performance
CREATE INDEX idx_knowledge_entries_instructor ON knowledge_entries(instructor_id);
CREATE INDEX idx_knowledge_entries_course ON knowledge_entries(course_code) WHERE course_code IS NOT NULL;
CREATE INDEX idx_knowledge_entries_visibility ON knowledge_entries(visibility);
CREATE INDEX idx_knowledge_entries_updated ON knowledge_entries(updated_at DESC);

-- Vector similarity search index using IVFFlat
CREATE INDEX idx_knowledge_entries_embedding ON knowledge_entries
  USING ivfflat (question_embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================================
-- 2. knowledge_feedback table
-- ============================================================================
-- Tracks student feedback on knowledge entry suggestions

CREATE TABLE knowledge_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,

  -- Feedback
  is_helpful BOOLEAN NOT NULL,
  similarity_score FLOAT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints: one feedback per student per entry per ticket
  CONSTRAINT unique_feedback UNIQUE(entry_id, student_id, ticket_id)
);

-- Indexes for performance
CREATE INDEX idx_knowledge_feedback_entry ON knowledge_feedback(entry_id);
CREATE INDEX idx_knowledge_feedback_student ON knowledge_feedback(student_id);
CREATE INDEX idx_knowledge_feedback_ticket ON knowledge_feedback(ticket_id);

-- ============================================================================
-- 3. knowledge_suggestions table
-- ============================================================================
-- Tracks which knowledge entries were suggested for which tickets

CREATE TABLE knowledge_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,

  -- Ranking
  similarity_score FLOAT NOT NULL,
  rank_position INTEGER NOT NULL,

  -- Interaction tracking
  was_viewed BOOLEAN DEFAULT FALSE,
  was_helpful BOOLEAN,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints: one suggestion record per entry per ticket
  CONSTRAINT unique_suggestion UNIQUE(ticket_id, entry_id)
);

-- Indexes for performance
CREATE INDEX idx_knowledge_suggestions_ticket ON knowledge_suggestions(ticket_id);
CREATE INDEX idx_knowledge_suggestions_entry ON knowledge_suggestions(entry_id);

-- ============================================================================
-- 4. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_suggestions ENABLE ROW LEVEL SECURITY;

-- knowledge_entries policies
-- Instructors can view and manage their own entries
CREATE POLICY "Instructors can view own entries"
  ON knowledge_entries FOR SELECT
  USING (
    auth.uid() = instructor_id
  );

CREATE POLICY "Instructors can create entries"
  ON knowledge_entries FOR INSERT
  WITH CHECK (
    auth.uid() = instructor_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('instructor', 'admin')
    )
  );

CREATE POLICY "Instructors can update own entries"
  ON knowledge_entries FOR UPDATE
  USING (auth.uid() = instructor_id)
  WITH CHECK (auth.uid() = instructor_id);

CREATE POLICY "Instructors can delete own entries"
  ON knowledge_entries FOR DELETE
  USING (auth.uid() = instructor_id);

-- Students can view entries based on visibility rules
CREATE POLICY "Students can view permitted entries"
  ON knowledge_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'student'
    )
    AND (
      visibility = 'public'
      OR (
        visibility = 'course_specific'
        AND course_code IS NOT NULL
        -- Note: Course enrollment check would go here if we had a courses table
        -- For now, we allow students to see all course-specific entries
      )
    )
  );

-- knowledge_feedback policies
-- Students can submit feedback
CREATE POLICY "Students can submit feedback"
  ON knowledge_feedback FOR INSERT
  WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'student'
    )
  );

-- Students can view their own feedback
CREATE POLICY "Students can view own feedback"
  ON knowledge_feedback FOR SELECT
  USING (auth.uid() = student_id);

-- Instructors can view feedback on their entries
CREATE POLICY "Instructors can view entry feedback"
  ON knowledge_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_entries
      WHERE knowledge_entries.id = knowledge_feedback.entry_id
      AND knowledge_entries.instructor_id = auth.uid()
    )
  );

-- knowledge_suggestions policies
-- Students can view suggestions for their tickets
CREATE POLICY "Students can view ticket suggestions"
  ON knowledge_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = knowledge_suggestions.ticket_id
      AND tickets.creator_id = auth.uid()
    )
  );

-- Service role can manage suggestions (for auto-suggestion system)
CREATE POLICY "Service role can manage suggestions"
  ON knowledge_suggestions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Instructors can view suggestions for their entries
CREATE POLICY "Instructors can view entry suggestions"
  ON knowledge_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_entries
      WHERE knowledge_entries.id = knowledge_suggestions.entry_id
      AND knowledge_entries.instructor_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Function to search similar knowledge entries
CREATE OR REPLACE FUNCTION search_knowledge_entries(
  query_embedding vector(768),
  student_course_code TEXT DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  instructor_id UUID,
  question_text TEXT,
  answer_text TEXT,
  tags TEXT[],
  visibility TEXT,
  course_code TEXT,
  view_count INTEGER,
  helpful_count INTEGER,
  not_helpful_count INTEGER,
  version INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ke.id,
    ke.instructor_id,
    ke.question_text,
    ke.answer_text,
    ke.tags,
    ke.visibility,
    ke.course_code,
    ke.view_count,
    ke.helpful_count,
    ke.not_helpful_count,
    ke.version,
    ke.created_at,
    ke.updated_at,
    1 - (ke.question_embedding <=> query_embedding) AS similarity
  FROM knowledge_entries ke
  WHERE 
    -- Similarity threshold
    1 - (ke.question_embedding <=> query_embedding) > match_threshold
    -- Visibility filter
    AND (
      ke.visibility = 'public'
      OR (
        ke.visibility = 'course_specific'
        AND ke.course_code = student_course_code
      )
    )
  ORDER BY ke.question_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to update entry statistics atomically
CREATE OR REPLACE FUNCTION update_entry_statistics(
  p_entry_id UUID,
  p_increment_views BOOLEAN DEFAULT FALSE,
  p_increment_helpful BOOLEAN DEFAULT FALSE,
  p_increment_not_helpful BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE knowledge_entries
  SET
    view_count = view_count + CASE WHEN p_increment_views THEN 1 ELSE 0 END,
    helpful_count = helpful_count + CASE WHEN p_increment_helpful THEN 1 ELSE 0 END,
    not_helpful_count = not_helpful_count + CASE WHEN p_increment_not_helpful THEN 1 ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_entry_id;
END;
$$;

-- ============================================================================
-- 6. Triggers
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_knowledge_entry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_entries_updated_at
  BEFORE UPDATE ON knowledge_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_entry_timestamp();
