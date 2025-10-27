# AI Auto Response - Tự động gợi ý câu trả lời cho Ticket

## 🎯 Tổng quan

Chức năng AI Auto Response tự động tìm kiếm và gợi ý câu trả lời cho ticket dựa trên:

- **Knowledge Base**: Câu trả lời từ giảng viên đã lưu
- **RAG Documents**: Tài liệu hướng dẫn của trường

## ✨ Tính năng

### Cho sinh viên

- ✅ Tự động hiển thị gợi ý khi xem ticket
- ✅ Xem độ tin cậy của câu trả lời (cao/trung bình/thấp)
- ✅ Áp dụng câu trả lời với 1 click
- ✅ Copy câu trả lời
- ✅ Đánh giá hữu ích/không hữu ích

### Cho giảng viên

- ✅ Giảm số lượng câu hỏi lặp lại
- ✅ Tái sử dụng câu trả lời đã lưu
- ✅ Xem thống kê câu trả lời được dùng nhiều nhất

## 📁 Files đã tạo

```
src/
├── services/
│   └── ticketAutoResponseService.ts    # Service chính
├── components/
│   └── TicketAISuggestions.tsx         # UI component
└── pages/
    └── TicketDetail.tsx                # Đã tích hợp

supabase/
└── migrations/
    └── 0003_knowledge_base_search.sql  # Database functions

docs/
├── AI_AUTO_RESPONSE_GUIDE.md           # Hướng dẫn chi tiết
└── AI_AUTO_RESPONSE_README.md          # File này
```

## 🚀 Cài đặt

### Bước 1: Chạy migration

```bash
npm run db:push
```

### Bước 2: Verify database

```sql
-- Kiểm tra functions đã tạo
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE 'match_knowledge%';

-- Kết quả mong đợi:
-- match_knowledge_entries
-- increment_helpful_count
-- increment_not_helpful_count
-- increment_view_count
```

### Bước 3: Test

1. Mở ticket detail page
2. AI suggestions sẽ tự động hiển thị
3. Click vào suggestion để xem chi tiết

## 💡 Cách sử dụng

### Sinh viên

1. **Xem ticket**

   - Mở ticket detail
   - AI suggestions hiển thị tự động

2. **Xem gợi ý**

   - Click vào suggestion card
   - Đọc câu trả lời chi tiết

3. **Áp dụng**

   - Click "Áp dụng" để điền vào comment
   - Hoặc "Copy" để dùng ở nơi khác

4. **Đánh giá**
   - 👍 Hữu ích
   - 👎 Không hữu ích

### Giảng viên

1. **Tạo knowledge entry**

   - Trả lời ticket
   - Click "Save to Knowledge Base"
   - Điền tags, course code

2. **Xem thống kê**
   ```sql
   SELECT
     ke.question_text,
     COUNT(ks.id) as times_suggested,
     ke.helpful_count
   FROM knowledge_entries ke
   LEFT JOIN knowledge_suggestions ks ON ke.id = ks.entry_id
   GROUP BY ke.id
   ORDER BY times_suggested DESC;
   ```

## 🔧 Cấu hình

### Điều chỉnh threshold

File: `src/services/ticketAutoResponseService.ts`

```typescript
private static readonly SIMILARITY_THRESHOLD = 0.7; // Giảm để có nhiều kết quả
private static readonly MAX_SUGGESTIONS = 3; // Tăng để hiển thị nhiều hơn
```

### Tắt AI suggestions

File: `src/pages/TicketDetail.tsx`

```typescript
const [showAISuggestions, setShowAISuggestions] = useState(false);
```

## 📊 Metrics

### Xem usage

```sql
-- Số ticket có suggestions
SELECT COUNT(DISTINCT ticket_id)
FROM knowledge_suggestions
WHERE created_at > NOW() - INTERVAL '7 days';

-- Tỷ lệ helpful
SELECT
  COUNT(CASE WHEN was_helpful = true THEN 1 END)::float /
  COUNT(*) * 100 as helpful_rate
FROM knowledge_suggestions
WHERE was_helpful IS NOT NULL;
```

## 🐛 Troubleshooting

### Không có suggestions

**Kiểm tra:**

1. Knowledge base có dữ liệu chưa?

   ```sql
   SELECT COUNT(*) FROM knowledge_entries
   WHERE question_embedding IS NOT NULL;
   ```

2. Gemini API key đúng chưa?

   ```typescript
   console.log(import.meta.env.VITE_GEMINI_API_KEY);
   ```

3. Threshold có quá cao không?
   - Giảm xuống 0.6 để test

### Suggestions không chính xác

**Cải thiện:**

1. Viết question_text chi tiết hơn
2. Thêm context vào answer_text
3. Sử dụng tags phù hợp

### Performance chậm

**Optimize:**

```sql
-- Tạo index
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_embedding
ON knowledge_entries
USING ivfflat (question_embedding vector_cosine_ops);

-- Vacuum
VACUUM ANALYZE knowledge_entries;
```

## 📚 Tài liệu liên quan

- [AI_AUTO_RESPONSE_GUIDE.md](./AI_AUTO_RESPONSE_GUIDE.md) - Hướng dẫn chi tiết
- [RAG_ASSISTANT_README.md](./RAG_ASSISTANT_README.md) - RAG system
- [RAG_DEPLOYMENT_GUIDE.md](./RAG_DEPLOYMENT_GUIDE.md) - Deployment guide

## 🎓 Demo

### UI Preview

```
┌─────────────────────────────────────────────────────┐
│ ✨ Gợi ý câu trả lời từ AI                          │
│ Tìm thấy 3 câu trả lời tương tự                     │
├─────────────────────────────────────────────────────┤
│ #1 📚 Knowledge Base  🟢 Độ tin cậy cao             │
│ Làm sao để fix lỗi NullPointerException?            │
│ 👨‍🏫 Nguyễn Văn A  PRJ301  👍 15                      │
│                                                     │
│ [Click để xem chi tiết]                             │
├─────────────────────────────────────────────────────┤
│ #2 ✨ RAG Documents  🟡 Độ tin cậy trung bình       │
│ Java NullPointerException debugging                 │
│                                                     │
│ [Click để xem chi tiết]                             │
└─────────────────────────────────────────────────────┘
```

### Expanded View

```
┌─────────────────────────────────────────────────────┐
│ #1 📚 Knowledge Base  🟢 Độ tin cậy cao             │
│ Làm sao để fix lỗi NullPointerException?            │
│ 👨‍🏫 Nguyễn Văn A  PRJ301  👍 15                      │
├─────────────────────────────────────────────────────┤
│ Câu trả lời:                                        │
│                                                     │
│ NullPointerException xảy ra khi bạn truy cập       │
│ object null. Để fix:                                │
│ 1. Check null trước khi dùng                        │
│ 2. Sử dụng Optional<T>                              │
│ 3. Initialize object đúng cách                      │
│                                                     │
│ Tags: [java] [debugging] [exception]                │
├─────────────────────────────────────────────────────┤
│ [✓ Áp dụng]  [📋 Copy]  Hữu ích? [👍] [👎]         │
└─────────────────────────────────────────────────────┘
```

## 🔄 Workflow

```
Ticket mới
    ↓
Generate embedding (Gemini)
    ↓
Vector search (Knowledge Base + RAG)
    ↓
Rank by similarity
    ↓
Display top 3 suggestions
    ↓
User clicks → View details
    ↓
User applies → Fill comment
    ↓
User rates → Update stats
```

## 📈 Roadmap

### Phase 1 (Current) ✅

- [x] Vector search
- [x] UI component
- [x] Feedback mechanism
- [x] Analytics

### Phase 2 (Next)

- [ ] Multi-language support
- [ ] Semantic reranking
- [ ] Auto-update knowledge base
- [ ] Instructor dashboard

### Phase 3 (Future)

- [ ] AI-generated answers
- [ ] Conversation-aware
- [ ] Chat widget integration
- [ ] Mobile app

## 🤝 Contributing

### Báo lỗi

Tạo ticket với tag `ai-suggestions`

### Feature request

Tạo ticket với tag `feature-request`

### Code contribution

1. Fork repo
2. Create branch
3. Make changes
4. Submit PR

## 📞 Support

- **Documentation**: Xem docs/
- **Issues**: Tạo ticket
- **Questions**: Hỏi trong chat widget

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Developed for**: FPT University EduTicket AI
