-- Migration: Knowledge Base Vector Search Functions
-- Description: Functions để tìm kiếm câu trả lời tương tự trong knowledge base

-- Function: match_knowledge_entries
-- Tìm kiếm knowledge entries dựa trên vector similarity
CREATE OR REPLACE FUNCTION match_knowledge_entries(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 3,
  filter_course_code text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  question_text text,
  answer_text text,
  tags text[],
  course_code text,
  view_count int,
  helpful_count int,
  instructor_name text,
  instructor_avatar text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ke.id,
    ke.question_text,
    ke.answer_text,
    ke.tags,
    ke.course_code,
    ke.view_count,
    ke.helpful_count,
    p.full_name as instructor_name,
    p.avatar_url as instructor_avatar,
    1 - (ke.question_embedding <=> query_embedding) as similarity
  FROM knowledge_entries ke
  LEFT JOIN profiles p ON ke.instructor_id = p.id
  WHERE 
    ke.question_embedding IS NOT NULL
    AND (1 - (ke.question_embedding <=> query_embedding)) > match_threshold
    AND (filter_course_code IS NULL OR ke.course_code = filter_course_code OR ke.visibility = 'public')
  ORDER BY ke.question_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function: increment_helpful_count
-- Tăng số lượng helpful count cho knowledge entry
CREATE OR REPLACE FUNCTION increment_helpful_count(entry_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE knowledge_entries
  SET 
    helpful_count = helpful_count + 1,
    updated_at = NOW()
  WHERE id = entry_id;
END;
$$;

-- Function: increment_not_helpful_count
-- Tăng số lượng not helpful count cho knowledge entry
CREATE OR REPLACE FUNCTION increment_not_helpful_count(entry_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE knowledge_entries
  SET 
    not_helpful_count = not_helpful_count + 1,
    updated_at = NOW()
  WHERE id = entry_id;
END;
$$;

-- Function: increment_view_count
-- Tăng số lượng view count cho knowledge entry
CREATE OR REPLACE FUNCTION increment_view_count(entry_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE knowledge_entries
  SET 
    view_count = view_count + 1,
    updated_at = NOW()
  WHERE id = entry_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION match_knowledge_entries TO authenticated;
GRANT EXECUTE ON FUNCTION increment_helpful_count TO authenticated;
GRANT EXECUTE ON FUNCTION increment_not_helpful_count TO authenticated;
GRANT EXECUTE ON FUNCTION increment_view_count TO authenticated;

-- Add comment
COMMENT ON FUNCTION match_knowledge_entries IS 'Vector similarity search for knowledge base entries';
COMMENT ON FUNCTION increment_helpful_count IS 'Increment helpful count for knowledge entry';
COMMENT ON FUNCTION increment_not_helpful_count IS 'Increment not helpful count for knowledge entry';
COMMENT ON FUNCTION increment_view_count IS 'Increment view count for knowledge entry';
