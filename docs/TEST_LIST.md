## Feature được chọn: Ticket Creation và AI Triage

### 1. Mô tả Feature
- **Mục đích**: Cho phép sinh viên tạo ticket hỗ trợ học thuật với tích hợp AI thông minh để tự động phân loại, ưu tiên và gợi ý assignee
- **Lý do chọn**: Là core business logic của hệ thống quản lý ticket giáo dục, ảnh hưởng trực tiếp đến trải nghiệm người dùng, tính ổn định và hiệu quả routing ticket
- **Các dependency chính**: Supabase database, Gemini AI API, Authentication system, Notification service, Validation logic, Prompt engineering, Response parsing

### 📊 **Coverage Summary**
- **Functions**: 8/8 (100% complete)
- **Test Cases**: 61/61 (100% complete)
- **Coverage**: Positive: 28%, Negative: 30%, Edge: 23%, Error: 20%

### 2. Danh sách hàm trong Feature
| Tên hàm | Mô tả | Tham số | Trả về | Phụ thuộc |
|----------|-------|----------|---------|-------------|
| `TicketService.createTicket()` | Hàm chính tạo ticket với AI triage | formData, creatorId | Promise<CreatedTicket> | Supabase, AI service, Validation |
| `TicketService.getAITriageSuggestions()` | Lấy gợi ý từ AI triage service | formData | Promise<AITriageResult \| null> | Supabase edge function, AI API |
| `TicketService.validateTicketData()` | Validate dữ liệu ticket form | formData | {isValid, errors} | Validation rules |
| `UnifiedTicketCreation.handleSubmit()` | Xử lý submit form từ UI | formData (React event) | Promise<void> | TicketService, UI validation |
| `validateInput()` (AI function) | Validate input cho AI service | data | TriageRequest | Input validation rules |
| `callGeminiAI()` (AI function) | Gọi Gemini AI API | prompt, apiKey | Promise<string> | Gemini API, Network |
| `createPrompt()` (AI function) | Tạo AI prompt từ ticket data | data: TriageRequest | string | Prompt template logic |
| `parseTypeAndPriority()` (AI function) | Parse và validate AI response | response: string | {suggested_type, suggested_priority} | Response parsing logic |

**Tổng cộng: 8 functions**

### 3. Danh sách Test Case

**Thống kê Test Cases:**
- **Total**: 61 test cases
- **Positive Cases**: 17 (28%)
- **Negative Cases**: 18 (30%)
- **Edge Cases**: 14 (23%)
- **Error Cases**: 12 (20%)

| TC ID | Hàm | Loại | Input | Kết quả mong đợi | Ghi chú |
|--------|------|-------|--------|------------------|----------|
| TC01 | TicketService.createTicket() | Positive | Valid formData + valid creatorId | Ticket created successfully with AI suggestions | Standard creation flow |
| TC02 | TicketService.createTicket() | Positive | Valid formData with educational context | Ticket with course/class metadata | Educational context saved |
| TC03 | TicketService.createTicket() | Negative | Empty title | Error: "Title is required" | Title validation |
| TC04 | TicketService.createTicket() | Negative | Description < 10 chars | Error: "Description must be at least 10 characters long" | Length validation |
| TC05 | TicketService.createTicket() | Negative | Invalid type | Error: "Type is required" | Type enum validation |
| TC06 | TicketService.createTicket() | Negative | Invalid creatorId | Database foreign key error | User existence check |
| TC07 | TicketService.createTicket() | Edge | Title with 100+ characters | Success (trimmed if needed) | Length limits |
| TC08 | TicketService.createTicket() | Edge | Description with special characters | Success with proper escaping | XSS prevention |
| TC09 | TicketService.createTicket() | Error | AI service timeout | Ticket created with null AI suggestions | Graceful degradation |
| TC10 | TicketService.createTicket() | Error | Database connection failure | Error: "Failed to create ticket" | Database error handling |
| TC11 | TicketService.getAITriageSuggestions() | Positive | Valid formData | AI suggestions object returned | AI service working |
| TC12 | TicketService.getAITriageSuggestions() | Positive | Complex educational ticket | Relevant priority/type suggestions | AI context understanding |
| TC13 | TicketService.getAITriageSuggestions() | Negative | Invalid formData structure | Null returned with console error | Input validation |
| TC14 | TicketService.getAITriageSuggestions() | Edge | Very long description | AI processes within timeout | Performance limits |
| TC15 | TicketService.getAITriageSuggestions() | Error | AI service 500 error | Null returned | Service unavailability |
| TC16 | TicketService.getAITriageSuggestions() | Error | Network timeout | Null returned | Connection issues |
| TC17 | TicketService.validateTicketData() | Positive | Complete valid data | {isValid: true, errors: []} | All validations pass |
| TC18 | TicketService.validateTicketData() | Positive | Minimum valid data | {isValid: true, errors: []} | Basic requirements met |
| TC19 | TicketService.validateTicketData() | Negative | Empty title | {isValid: false, errors: ["Title is required"]} | Required field |
| TC20 | TicketService.validateTicketData() | Negative | Empty description | {isValid: false, errors: ["Description is required"]} | Required field |
| TC21 | TicketService.validateTicketData() | Negative | Short description (5 chars) | {isValid: false, errors: ["Description must be at least 10 characters"]} | Length validation |
| TC22 | TicketService.validateTicketData() | Negative | Invalid type enum | {isValid: false, errors: ["Type is required"]} | Enum validation |
| TC23 | TicketService.validateTicketData() | Negative | Invalid priority enum | {isValid: false, errors: ["Priority is required"]} | Enum validation |
| TC24 | TicketService.validateTicketData() | Edge | Title with only whitespace | {isValid: false, errors: ["Title is required"]} | Whitespace handling |
| TC25 | TicketService.validateTicketData() | Edge | Description with HTML tags | Success (should allow safe HTML) | Content validation |
| TC26 | UnifiedTicketCreation.handleSubmit() | Positive | Valid form data | Ticket created, success message | UI form submission |
| TC27 | UnifiedTicketCreation.handleSubmit() | Positive | Form with AI suggestions applied | Ticket with AI-suggested priority | AI integration in UI |
| TC28 | UnifiedTicketCreation.handleSubmit() | Negative | Empty title field | Alert: "Vui lòng nhập tiêu đề" | UI validation |
| TC29 | UnifiedTicketCreation.handleSubmit() | Negative | Empty description field | Alert: "Vui lòng nhập mô tả" | UI validation |
| TC30 | UnifiedTicketCreation.handleSubmit() | Edge | Network error during submission | Error toast displayed | Network error handling |
| TC31 | UnifiedTicketCreation.handleSubmit() | Edge | AI analysis timeout | Ticket created without suggestions | Graceful AI failure |
| TC32 | UnifiedTicketCreation.handleSubmit() | Error | Authentication expired | Redirect to login | Auth error handling |
| TC33 | validateInput() (AI) | Positive | Valid triage request | TriageRequest object | Input validation |
| TC34 | validateInput() (AI) | Negative | Missing title | Error: "Title is required" | Required field validation |
| TC35 | validateInput() (AI) | Negative | Missing description | Error: "Description is required" | Required field validation |
| TC36 | validateInput() (AI) | Negative | Missing type | Error: "Type is required" | Required field validation |
| TC37 | validateInput() (AI) | Negative | Non-string title | Error: "Title must be a string" | Type validation |
| TC38 | validateInput() (AI) | Edge | Title with only whitespace | Error: "Title must be non-empty" | Whitespace trimming |
| TC39 | validateInput() (AI) | Edge | Very long title/description | Success (within limits) | Length limits |
| TC40 | callGeminiAI() | Positive | Valid prompt and API key | AI response string | API communication |
| TC41 | callGeminiAI() | Negative | Invalid API key | Error: "API authentication failed" | Auth failure |
| TC42 | callGeminiAI() | Negative | Invalid prompt format | Error: "Invalid response format" | Response validation |
| TC43 | callGeminiAI() | Edge | Very long prompt | Success or truncated response | Token limits |
| TC44 | callGeminiAI() | Edge | Network timeout (30s) | Error: "Request timeout" | Timeout handling |
| TC45 | callGeminiAI() | Error | API rate limit exceeded | Error: "Rate limit exceeded" | Rate limiting |
| TC46 | callGeminiAI() | Error | API service down | Error: "API service unavailable" | Service outages |
| TC47 | AI Triage Integration | Edge | Concurrent requests | All processed within limits | Concurrency handling |
| TC48 | AI Triage Integration | Error | Environment variable missing | Fallback priority provided | Configuration errors |
| TC49 | createPrompt() | Positive | Valid TriageRequest | Prompt string với đầy đủ context | Prompt format đúng |
| TC50 | createPrompt() | Positive | TriageRequest với special chars | Prompt với content được escape | XSS prevention |
| TC51 | createPrompt() | Edge | Title/description rất dài | Prompt vẫn trong limits | Token limits |
| TC52 | createPrompt() | Edge | Title/description rỗng | Prompt với placeholders | Input validation |
| TC53 | createPrompt() | Error | Invalid data structure | Error thrown | Type safety |
| TC54 | parseTypeAndPriority() | Positive | "grading high" | {suggested_type: "grading", suggested_priority: "high"} | Standard format |
| TC55 | parseTypeAndPriority() | Positive | "technical critical" | {suggested_type: "technical", suggested_priority: "critical"} | Case insensitive |
| TC56 | parseTypeAndPriority() | Edge | "unknown_type medium" | {suggested_type: "question", suggested_priority: "medium"} | Fallback logic |
| TC57 | parseTypeAndPriority() | Edge | Response chỉ có priority | {suggested_type: "question", suggested_priority: "medium"} | Default type |
| TC58 | parseTypeAndPriority() | Edge | Response chỉ có type | {suggested_type: "bug", suggested_priority: "medium"} | Default priority |
| TC59 | parseTypeAndPriority() | Edge | Response trống | {suggested_type: "question", suggested_priority: "medium"} | Default fallbacks |
| TC60 | parseTypeAndPriority() | Negative | Invalid priority word | {suggested_type: "question", suggested_priority: "medium"} | Priority validation |
| TC61 | parseTypeAndPriority() | Negative | Invalid type word | {suggested_type: "question", suggested_priority: "medium"} | Type validation |