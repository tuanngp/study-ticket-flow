# Cải thiện Gợi ý Câu trả lời từ AI

## Vấn đề đã giải quyết

Trước đây, phần "Gợi ý câu trả lời từ AI" trả về nhiều chunks riêng lẻ từ RAG documents, khiến câu trả lời bị chia nhỏ và không liên kết với nhau.

## Giải pháp

### 1. Gộp chunks cùng document (SQL)

Tạo migration mới `0014_improve_rag_document_search.sql` để:

- Gộp các chunks cùng document lại với nhau
- Lấy top 5 chunks có similarity cao nhất cho mỗi document
- Sắp xếp theo thứ tự chunk_index để đảm bảo nội dung liên kết
- Trả về thông tin về số lượng chunks đã gộp

### 2. Sử dụng AI tổng hợp câu trả lời (TypeScript)

Tạo service mới `aiAnswerService.ts` để:

- Sử dụng Gemini AI để tổng hợp nội dung từ nhiều chunks
- Đảm bảo câu trả lời chỉ dựa trên context đã có (không bịa đặt)
- Trả lời bằng tiếng Việt, chuyên nghiệp và dễ hiểu
- Kiểm tra chất lượng câu trả lời trước khi hiển thị

### 3. Cập nhật UI

Component `TicketAISuggestions.tsx` hiển thị:

- Badge "Tổng hợp từ X đoạn" khi câu trả lời được tổng hợp từ nhiều chunks
- Câu trả lời mạch lạc, dễ đọc hơn

## Cách áp dụng

### Bước 1: Apply migration

```bash
# Nếu dùng Supabase CLI
supabase db push

# Hoặc chạy migration trực tiếp trên Supabase Dashboard
# Copy nội dung file supabase/migrations/0014_improve_rag_document_search.sql
# Paste vào SQL Editor và Execute
```

### Bước 2: Restart TypeScript Server

Trong VS Code:

1. Mở Command Palette (Ctrl+Shift+P hoặc Cmd+Shift+P)
2. Gõ "TypeScript: Restart TS Server"
3. Enter

Hoặc restart IDE/Editor của bạn.

### Bước 3: Test

1. Tạo một ticket mới với câu hỏi
2. Xem phần "Gợi ý câu trả lời từ AI"
3. Kiểm tra xem câu trả lời có mạch lạc và đầy đủ không

## Kết quả mong đợi

### Trước khi cải thiện:

```
Chunk 1: "Để cài đặt Node.js..."
Chunk 2: "...sau đó chạy npm install"
Chunk 3: "Cuối cùng, khởi động server..."
```

→ Các đoạn rời rạc, khó hiểu

### Sau khi cải thiện:

```
Để cài đặt và chạy dự án, bạn cần thực hiện các bước sau:

1. Cài đặt Node.js từ trang chủ nodejs.org
2. Clone repository và chạy npm install để cài đặt dependencies
3. Tạo file .env và cấu hình các biến môi trường
4. Cuối cùng, khởi động server bằng lệnh npm run dev

Lưu ý: Đảm bảo Node.js version >= 18.0.0
```

→ Câu trả lời mạch lạc, đầy đủ, chuyên nghiệp

## Cấu hình

### Environment Variables

Đảm bảo có biến môi trường:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Tùy chỉnh

Trong `aiAnswerService.ts`, bạn có thể:

- Thay đổi model AI (hiện tại: `gemini-1.5-flash`)
- Tùy chỉnh prompt template
- Điều chỉnh logic kiểm tra chất lượng câu trả lời

Trong `ticketAutoResponseService.ts`, bạn có thể:

- Thay đổi `SIMILARITY_THRESHOLD` (mặc định: 0.7)
- Thay đổi `MAX_SUGGESTIONS` (mặc định: 3)
- Điều chỉnh số lượng chunks tối đa cho mỗi document (hiện tại: 5)

## Lưu ý

1. **Chi phí API**: Mỗi lần tổng hợp câu trả lời sẽ gọi Gemini API. Nếu lo ngại chi phí, có thể:

   - Chỉ tổng hợp khi có > 2 chunks
   - Cache kết quả đã tổng hợp
   - Giới hạn số lần gọi API mỗi ngày

2. **Fallback**: Nếu AI không tạo được câu trả lời chất lượng, hệ thống sẽ tự động fallback về nội dung gốc đã gộp

3. **Performance**: Việc gọi AI có thể mất 1-3 giây. UI đã có loading state để UX tốt hơn

## Troubleshooting

### Lỗi: "Cannot find module '@google/generative-ai'"

```bash
npm install @google/generative-ai
```

### Lỗi: TypeScript không nhận diện functions mới

- Restart TypeScript Server (xem Bước 2)
- Hoặc restart IDE

### Câu trả lời vẫn bị chia nhỏ

- Kiểm tra migration đã được apply chưa
- Xem logs trong Console để debug
- Kiểm tra `chunk_count` trong metadata

### AI trả lời sai hoặc bịa đặt

- Kiểm tra prompt trong `aiAnswerService.ts`
- Đảm bảo context được truyền đầy đủ
- Có thể cần điều chỉnh prompt để AI tuân thủ context chặt chẽ hơn
