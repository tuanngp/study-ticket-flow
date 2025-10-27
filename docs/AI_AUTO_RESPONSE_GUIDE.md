# AI Auto Response - Hướng dẫn sử dụng

## Tổng quan

Chức năng AI Auto Response tự động gợi ý câu trả lời cho ticket dựa trên:

- **Knowledge Base**: Câu trả lời từ giảng viên đã lưu trước đó
- **RAG Documents**: Tài liệu hướng dẫn của trường (FAQs, code support, etc.)

## Tính năng chính

### ✨ Cho sinh viên

1. **Tự động gợi ý**: Khi xem ticket, AI tự động tìm câu trả lời tương tự
2. **Độ tin cậy**: Hiển thị mức độ tin cậy (cao/trung bình/thấp)
3. **Nguồn trích dẫn**: Biết câu trả lời từ đâu (giảng viên nào, tài liệu nào)
4. **Áp dụng nhanh**: Click 1 nút để áp dụng câu trả lời
5. **Đánh giá**: Đánh giá câu trả lời có hữu ích không

### 👨‍🏫 Cho giảng viên

1. **Giảm workload**: Sinh viên tự tìm được câu trả lời
2. **Tái sử dụng**: Câu trả lời được lưu vào knowledge base
3. **Thống kê**: Xem câu trả lời nào được dùng nhiều nhất
4. **Cải thiện**: Dựa vào feedback để cải thiện câu trả lời

## Cách hoạt động

### 1. Vector Search

```
Ticket mới → Generate embedding → Tìm kiếm tương đồng → Trả về top 3 kết quả
```

### 2. Scoring System

- **Similarity Score**: 0.0 - 1.0 (cosine similarity)
- **Confidence Level**:
  - High: ≥ 0.85 (rất tương đồng)
  - Medium: 0.75 - 0.84 (khá tương đồng)
  - Low: 0.70 - 0.74 (có thể liên quan)

### 3. Ranking

Kết quả được sắp xếp theo:

1. Similarity score (cao nhất trước)
2. Source priority (Knowledge Base > RAG Documents)
3. Helpful count (nhiều người đánh giá hữu ích)

## Deployment

### Bước 1: Chạy migration

```bash
npm run db:push
```

Hoặc thủ công:

```bash
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/0003_knowledge_base_search.sql
```

### Bước 2: Verify functions

Kiểm tra trong Supabase SQL Editor:

```sql
-- Test match_knowledge_entries function
SELECT * FROM match_knowledge_entries(
  '[0.1, 0.2, ...]'::vector(768),
  0.7,
  3,
  NULL
);

-- Check if functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE 'match_knowledge%'
   OR routine_name LIKE 'increment_%';
```

### Bước 3: Test UI

1. Tạo ticket mới hoặc mở ticket có sẵn
2. AI suggestions sẽ tự động hiển thị
3. Click vào suggestion để xem chi tiết
4. Test các nút: Áp dụng, Copy, Đánh giá

## Cấu hình

### Điều chỉnh threshold

Trong `src/services/ticketAutoResponseService.ts`:

```typescript
private static readonly SIMILARITY_THRESHOLD = 0.7; // Giảm để có nhiều kết quả hơn
private static readonly MAX_SUGGESTIONS = 3; // Tăng để hiển thị nhiều gợi ý hơn
```

### Ưu tiên course-specific

Nếu ticket có `course_code`, AI sẽ ưu tiên:

1. Knowledge entries của course đó
2. Public knowledge entries
3. RAG documents

### Tắt AI suggestions

Trong `src/pages/TicketDetail.tsx`:

```typescript
const [showAISuggestions, setShowAISuggestions] = useState(false); // Tắt mặc định
```

## Sử dụng

### Cho sinh viên

#### 1. Xem gợi ý

- Mở ticket detail page
- AI suggestions hiển thị ngay dưới ticket description
- Xem số lượng gợi ý và độ tin cậy

#### 2. Xem chi tiết

- Click vào suggestion card
- Đọc câu trả lời đầy đủ
- Xem thông tin giảng viên, course code, tags

#### 3. Áp dụng câu trả lời

- Click nút "Áp dụng"
- Câu trả lời được điền vào comment box
- Có thể chỉnh sửa trước khi gửi

#### 4. Copy câu trả lời

- Click nút "Copy"
- Paste vào nơi khác nếu cần

#### 5. Đánh giá

- Click 👍 nếu hữu ích
- Click 👎 nếu không hữu ích
- Giúp cải thiện chất lượng gợi ý

### Cho giảng viên

#### 1. Tạo knowledge entries

- Trả lời ticket như bình thường
- Click "Save to Knowledge Base"
- Điền thông tin: tags, visibility, course code
- Câu trả lời sẽ được dùng cho AI suggestions

#### 2. Xem thống kê

```sql
-- Top knowledge entries được gợi ý nhiều nhất
SELECT
  ke.question_text,
  COUNT(ks.id) as suggestion_count,
  SUM(CASE WHEN ks.was_helpful THEN 1 ELSE 0 END) as helpful_count
FROM knowledge_entries ke
LEFT JOIN knowledge_suggestions ks ON ke.id = ks.entry_id
GROUP BY ke.id, ke.question_text
ORDER BY suggestion_count DESC
LIMIT 10;

-- Tỷ lệ helpful
SELECT
  ke.question_text,
  ke.helpful_count,
  ke.not_helpful_count,
  ROUND(ke.helpful_count::float / NULLIF(ke.helpful_count + ke.not_helpful_count, 0) * 100, 2) as helpful_rate
FROM knowledge_entries ke
WHERE ke.helpful_count + ke.not_helpful_count > 0
ORDER BY helpful_rate DESC;
```

#### 3. Cải thiện câu trả lời

- Xem feedback từ sinh viên
- Update knowledge entries với thông tin tốt hơn
- Thêm tags để dễ tìm kiếm

## API Reference

### TicketAutoResponseService

#### getSuggestedAnswers()

```typescript
static async getSuggestedAnswers(
  ticketId: string,
  ticketTitle: string,
  ticketDescription: string,
  courseCode?: string
): Promise<AutoResponseResult>
```

Tìm câu trả lời gợi ý cho ticket.

**Returns:**

```typescript
{
  success: boolean;
  suggestions: SuggestedAnswer[];
  error?: string;
}
```

#### markSuggestionViewed()

```typescript
static async markSuggestionViewed(
  ticketId: string,
  entryId: string
): Promise<void>
```

Đánh dấu suggestion đã được xem.

#### rateSuggestion()

```typescript
static async rateSuggestion(
  ticketId: string,
  entryId: string,
  isHelpful: boolean,
  studentId: string
): Promise<void>
```

Đánh giá suggestion có hữu ích không.

### Database Functions

#### match_knowledge_entries()

```sql
match_knowledge_entries(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 3,
  filter_course_code text DEFAULT NULL
)
```

Tìm kiếm knowledge entries tương tự.

#### increment_helpful_count()

```sql
increment_helpful_count(entry_id uuid)
```

Tăng helpful count cho knowledge entry.

## Troubleshooting

### Không có suggestions

**Nguyên nhân:**

1. Knowledge base trống
2. Threshold quá cao
3. Embedding generation failed

**Giải pháp:**

```typescript
// Giảm threshold
private static readonly SIMILARITY_THRESHOLD = 0.6;

// Check knowledge base
SELECT COUNT(*) FROM knowledge_entries WHERE question_embedding IS NOT NULL;

// Check Gemini API key
console.log(import.meta.env.VITE_GEMINI_API_KEY);
```

### Suggestions không chính xác

**Nguyên nhân:**

1. Embedding quality thấp
2. Knowledge entries không đủ chi tiết
3. Tags không phù hợp

**Giải pháp:**

- Cải thiện question_text trong knowledge entries
- Thêm nhiều context vào answer_text
- Sử dụng tags phù hợp

### Performance chậm

**Nguyên nhân:**

1. Embedding generation mất thời gian
2. Vector search chưa optimize
3. Quá nhiều knowledge entries

**Giải pháp:**

```sql
-- Tạo index nếu chưa có
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_embedding
ON knowledge_entries
USING ivfflat (question_embedding vector_cosine_ops);

-- Vacuum để optimize
VACUUM ANALYZE knowledge_entries;
```

## Best Practices

### Cho giảng viên

1. **Viết câu trả lời chi tiết**: Càng chi tiết càng dễ match
2. **Sử dụng tags**: Giúp categorize và search tốt hơn
3. **Set visibility đúng**: Public cho câu hỏi chung, course-specific cho câu hỏi riêng
4. **Update thường xuyên**: Cập nhật khi có thông tin mới

### Cho sinh viên

1. **Đọc kỹ suggestions**: Đừng áp dụng mù quáng
2. **Đánh giá feedback**: Giúp cải thiện hệ thống
3. **Chỉnh sửa nếu cần**: Câu trả lời có thể cần customize
4. **Tạo ticket nếu không có gợi ý**: Giảng viên sẽ trả lời

### Cho admin

1. **Monitor usage**: Xem thống kê suggestions
2. **Clean up**: Xóa knowledge entries cũ/không dùng
3. **Optimize**: Điều chỉnh threshold dựa trên feedback
4. **Backup**: Backup knowledge base thường xuyên

## Metrics

### Key Performance Indicators (KPIs)

```sql
-- Suggestion usage rate
SELECT
  COUNT(DISTINCT ticket_id) as tickets_with_suggestions,
  COUNT(*) as total_suggestions,
  AVG(similarity_score) as avg_similarity
FROM knowledge_suggestions
WHERE created_at > NOW() - INTERVAL '7 days';

-- Helpful rate
SELECT
  COUNT(CASE WHEN was_helpful = true THEN 1 END)::float /
  COUNT(CASE WHEN was_helpful IS NOT NULL THEN 1 END) * 100 as helpful_rate
FROM knowledge_suggestions
WHERE was_helpful IS NOT NULL;

-- Top performing entries
SELECT
  ke.question_text,
  COUNT(ks.id) as times_suggested,
  AVG(ks.similarity_score) as avg_similarity,
  COUNT(CASE WHEN ks.was_helpful = true THEN 1 END) as helpful_count
FROM knowledge_entries ke
JOIN knowledge_suggestions ks ON ke.id = ks.entry_id
GROUP BY ke.id, ke.question_text
ORDER BY helpful_count DESC
LIMIT 10;
```

## Roadmap

### Phase 1 (Current) ✅

- [x] Vector search trong knowledge base
- [x] Vector search trong RAG documents
- [x] UI component với confidence levels
- [x] Feedback mechanism
- [x] Tracking và analytics

### Phase 2 (Next)

- [ ] Multi-language support (tiếng Việt tốt hơn)
- [ ] Semantic search với reranking
- [ ] Auto-update knowledge base từ resolved tickets
- [ ] Instructor dashboard cho knowledge management

### Phase 3 (Future)

- [ ] AI-generated answers (không chỉ retrieve)
- [ ] Conversation-aware suggestions
- [ ] Integration với chat widget
- [ ] Mobile app support

## Support

### Báo lỗi

- Tạo ticket với tag "ai-suggestions"
- Mô tả chi tiết: ticket ID, expected vs actual

### Feature requests

- Tạo ticket với tag "feature-request"
- Giải thích use case và benefit

### Documentation

- README.md - Project overview
- RAG_ASSISTANT_README.md - RAG system
- AI_AUTO_RESPONSE_GUIDE.md - This document

---

**Developed for:** FPT University EduTicket AI  
**Version:** 1.0  
**Last Updated:** January 2025
