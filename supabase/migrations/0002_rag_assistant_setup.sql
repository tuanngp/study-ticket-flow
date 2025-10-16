-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table for RAG knowledge base
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(768), -- Gemini text-embedding-004 uses 768 dimensions
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vector similarity search index using IVFFlat
CREATE INDEX documents_embedding_idx ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create full-text search index for fallback
CREATE INDEX documents_content_fts_idx ON documents 
USING gin(to_tsvector('english', content));

-- Create index on metadata for filtering
CREATE INDEX documents_metadata_idx ON documents USING gin(metadata);

-- Function to match documents using vector similarity
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  chunk_index int,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.title,
    documents.content,
    documents.chunk_index,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Chat sessions table
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient message retrieval
CREATE INDEX chat_messages_session_idx ON chat_messages(session_id, created_at);
CREATE INDEX chat_sessions_user_idx ON chat_sessions(user_id, created_at DESC);

-- Rate limiting table for AI assistant
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for rate limit lookups
CREATE INDEX rate_limits_user_reset_idx ON rate_limits(user_id, reset_at);

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_max_requests INTEGER DEFAULT 20,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  current_count INTEGER;
  reset_time TIMESTAMPTZ;
BEGIN
  -- Get current rate limit record
  SELECT count, reset_at INTO current_count, reset_time
  FROM rate_limits
  WHERE user_id = p_user_id;
  
  -- If no record exists or reset time has passed, create/reset
  IF NOT FOUND OR reset_time < NOW() THEN
    INSERT INTO rate_limits (user_id, count, reset_at)
    VALUES (p_user_id, 1, NOW() + (p_window_minutes || ' minutes')::INTERVAL)
    ON CONFLICT (user_id) 
    DO UPDATE SET count = 1, reset_at = NOW() + (p_window_minutes || ' minutes')::INTERVAL;
    RETURN TRUE;
  END IF;
  
  -- Check if under limit
  IF current_count < p_max_requests THEN
    UPDATE rate_limits
    SET count = count + 1
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;
  
  -- Over limit
  RETURN FALSE;
END;
$$;

-- Add RLS policies for chat tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Users can only see their own chat sessions
CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view messages from their sessions
CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Service role can manage all messages (for edge function)
CREATE POLICY "Service role can manage all messages"
  ON chat_messages FOR ALL
  USING (true)
  WITH CHECK (true);

-- All authenticated users can read documents
CREATE POLICY "Authenticated users can read documents"
  ON documents FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins/instructors can insert documents
CREATE POLICY "Admins can manage documents"
  ON documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('instructor', 'admin')
    )
  );

