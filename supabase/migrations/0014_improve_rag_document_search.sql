-- Migration: Improve RAG Document Search
-- Description: Gộp chunks cùng document và cải thiện kết quả tìm kiếm

-- Drop old function
DROP FUNCTION IF EXISTS match_documents(vector, float, int);

-- Create improved function that groups chunks by document
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  metadata jsonb,
  similarity float,
  chunk_count int
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_chunks AS (
    -- Find all relevant chunks with their similarity scores
    SELECT
      documents.id,
      documents.title,
      documents.content,
      documents.chunk_index,
      documents.metadata,
      1 - (documents.embedding <=> query_embedding) AS similarity,
      ROW_NUMBER() OVER (PARTITION BY documents.title ORDER BY documents.embedding <=> query_embedding) as rank
    FROM documents
    WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ),
  grouped_docs AS (
    -- Group chunks by document title and combine content
    SELECT
      MIN(id) as id,
      title,
      STRING_AGG(content, E'\n\n' ORDER BY chunk_index) as full_content,
      MAX(metadata) as metadata,
      MAX(similarity) as max_similarity,
      COUNT(*) as chunk_count
    FROM ranked_chunks
    WHERE rank <= 5  -- Take top 5 most relevant chunks per document
    GROUP BY title
  )
  SELECT
    grouped_docs.id,
    grouped_docs.title,
    grouped_docs.full_content as content,
    grouped_docs.metadata,
    grouped_docs.max_similarity as similarity,
    grouped_docs.chunk_count::int
  FROM grouped_docs
  ORDER BY grouped_docs.max_similarity DESC
  LIMIT match_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;

-- Add comment
COMMENT ON FUNCTION match_documents IS 'Vector similarity search for RAG documents with chunk grouping';
