# Hướng Dẫn Test Suite - Tiếng Việt

## Giới Thiệu

Đây là bộ test tự động cho tính năng **Tạo Ticket và AI Triage** trong hệ thống quản lý ticket học tập. Bộ test này giúp đảm bảo code hoạt động đúng và phát hiện lỗi sớm.

### Test Suite Là Gì?

**Test Suite** (Bộ kiểm thử) là tập hợp các đoạn code tự động kiểm tra xem chương trình có hoạt động đúng như mong đợi hay không. Thay vì phải test thủ công bằng tay, chúng ta viết code để test code.

### Tại Sao Cần Test?

1. **Phát hiện lỗi sớm**: Tìm bug trước khi người dùng gặp phải
2. **Tự tin khi sửa code**: Biết ngay nếu thay đổi làm hỏng tính năng cũ
3. **Tài liệu sống**: Test cho biết code hoạt động như thế nào
4. **Tiết kiệm thời gian**: Không cần test thủ công mỗi lần thay đổi

## Thống Kê Bộ Test

- **Tổng số test**: 119 test cases
- **Số file test**: 8 files
- **Độ phủ code**: 63%+ (63% code được test)
- **Thời gian chạy**: ~30 giây
- **Trạng thái**: ✅ Tất cả đều pass (đạt)

## Cài Đặt và Chạy Test

### Yêu Cầu Hệ Thống

- Node.js (đã cài)
- npm (đã cài)
- Đã chạy `npm install`

### Các Lệnh Cơ Bản

#### 1. Chạy Tất Cả Test

```bash
npm test
```

**Giải thích**: Lệnh này chạy toàn bộ 119 test cases một lần. Kết quả sẽ hiển thị:

- ✓ (dấu tick xanh) = Test pass (đạt)
- ✗ (dấu x đỏ) = Test fail (không đạt)
- Thời gian chạy
- Số lượng test pass/fail

**Khi nào dùng**: Trước khi commit code, trước khi deploy

#### 2. Chạy Test Với Coverage (Độ Phủ)

```bash
npm run test:coverage
```

**Giải thích**: Lệnh này chạy test và tạo báo cáo cho biết bao nhiêu % code đã được test.

**Kết quả hiển thị**:

```
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|--------
ticketService.ts      |     100 |    91.66 |     100 |     100
```

- **% Stmts** (Statements): % câu lệnh được test
- **% Branch** (Nhánh): % điều kiện if/else được test
- **% Funcs** (Functions): % hàm được test
- **% Lines** (Dòng): % dòng code được test

**Khi nào dùng**: Khi muốn biết phần nào của code chưa được test

#### 3. Chạy Test Ở Chế Độ Watch (Tự Động)

```bash
npm run test:watch
```

**Giải thích**: Test sẽ tự động chạy lại mỗi khi bạn lưu file. Rất tiện khi đang viết code.

**Khi nào dùng**: Khi đang phát triển tính năng mới hoặc sửa bug

#### 4. Chạy Test Với Giao Diện UI

```bash
npm run test:ui
```

**Giải thích**: Mở giao diện web để xem và chạy test, dễ nhìn hơn terminal.

**Khi nào dùng**: Khi muốn xem chi tiết từng test case

#### 5. Chạy Test Của Một File Cụ Thể

```bash
npm test -- src/__tests__/services/ticketService.test.ts
```

**Giải thích**: Chỉ chạy test trong file được chỉ định, nhanh hơn chạy tất cả.

**Khi nào dùng**: Khi đang làm việc với một file cụ thể

#### 6. Chạy Test Theo Tên

```bash
npm test -- --grep "AI Triage"
```

**Giải thích**: Chỉ chạy các test có tên chứa "AI Triage".

**Khi nào dùng**: Khi muốn test một tính năng cụ thể

#### 7. Tạo Dữ Liệu Test Mới

```bash
npm run test:generate-data
```

**Giải thích**: Tự động tạo dữ liệu mẫu cho test (tickets, AI responses, users).

**Khi nào dùng**: Khi cần thêm dữ liệu test mới

## Cấu Trúc Thư Mục

```
src/__tests__/
├── 📄 README.md                    # Tài liệu đầy đủ (tiếng Anh)
├── 📄 QUICK_START.md               # Hướng dẫn nhanh (tiếng Anh)
├── 📄 MOCK_PATTERNS.md             # Hướng dẫn mock (tiếng Anh)
├── 📄 HUONG_DAN_TIENG_VIET.md     # File này
│
├── 📁 services/                    # Test cho tầng service
│   └── ticketService.test.ts      # 25 tests cho TicketService
│
├── 📁 components/                  # Test cho React components
│   └── UnifiedTicketCreation.test.tsx  # 17 tests cho component
│
├── 📁 ai-functions/                # Test cho các hàm AI
│   ├── validateInput.test.ts      # 10 tests - Validate input
│   ├── callGeminiAI.test.ts      # 9 tests - Gọi API AI
│   ├── createPrompt.test.ts      # 12 tests - Tạo prompt
│   └── parseTypeAndPriority.test.ts  # 20 tests - Parse response
│
├── 📁 integration/                 # Test tích hợp
│   ├── aiTriageIntegration.test.ts    # 7 tests - AI workflow
│   └── errorHandling.test.ts          # 19 tests - Xử lý lỗi
│
└── 📁 fixtures/                    # Dữ liệu test mẫu
    ├── ticketData.ts              # Dữ liệu ticket
    ├── aiResponses.ts             # Response từ AI
    └── userProfiles.ts            # Thông tin user
```

## Các Loại Test

### 1. Positive Tests (Test Tích Cực)

**Mục đích**: Kiểm tra chức năng hoạt động đúng với dữ liệu hợp lệ.

**Ví dụ**:

```typescript
it("TC01: should create ticket with valid data", async () => {
  // Arrange (Chuẩn bị)
  const validData = {
    title: "Bug in login page",
    description: "Cannot login with correct password",
    type: "bug",
    priority: "high",
  };

  // Act (Thực hiện)
  const result = await TicketService.createTicket(validData, userId);

  // Assert (Kiểm tra)
  expect(result).toBeDefined();
  expect(result.title).toBe("Bug in login page");
});
```

**Giải thích**:

- **Arrange**: Chuẩn bị dữ liệu test
- **Act**: Gọi hàm cần test
- **Assert**: Kiểm tra kết quả có đúng không

### 2. Negative Tests (Test Tiêu Cực)

**Mục đích**: Kiểm tra hệ thống xử lý lỗi đúng với dữ liệu không hợp lệ.

**Ví dụ**:

```typescript
it("TC03: should reject ticket with empty title", async () => {
  // Dữ liệu không hợp lệ (title rỗng)
  const invalidData = {
    title: "",
    description: "Valid description",
    type: "bug",
    priority: "high",
  };

  // Expect (Mong đợi) hàm throw error
  await expect(TicketService.createTicket(invalidData, userId)).rejects.toThrow(
    "Title is required"
  );
});
```

**Giải thích**: Test này kiểm tra xem hệ thống có báo lỗi đúng khi title bị rỗng không.

### 3. Edge Tests (Test Biên)

**Mục đích**: Kiểm tra các trường hợp đặc biệt, giới hạn.

**Ví dụ**:

- Title quá dài (200 ký tự)
- Description quá ngắn (dưới 10 ký tự)
- Ký tự đặc biệt, emoji
- Nhiều request cùng lúc

### 4. Error Tests (Test Lỗi)

**Mục đích**: Kiểm tra xử lý lỗi hệ thống (database lỗi, API timeout, v.v.)

**Ví dụ**:

```typescript
it("TC09: should handle database connection failure", async () => {
  // Giả lập database bị lỗi
  mockDatabase.mockRejectedValue(new Error("Connection failed"));

  // Kiểm tra hệ thống xử lý lỗi đúng
  await expect(TicketService.createTicket(validData, userId)).rejects.toThrow(
    "Connection failed"
  );
});
```

## Mock - Giả Lập Là Gì?

### Khái Niệm

**Mock** là kỹ thuật tạo phiên bản giả của các thành phần bên ngoài (database, API, v.v.) để test không phụ thuộc vào chúng.

### Tại Sao Cần Mock?

1. **Test nhanh hơn**: Không cần kết nối database thật
2. **Test ổn định**: Không bị ảnh hưởng bởi mạng, server
3. **Test dễ dàng**: Có thể giả lập mọi tình huống (lỗi, timeout, v.v.)
4. **Test độc lập**: Mỗi test không ảnh hưởng test khác

### Ví Dụ Mock

#### Mock Database (Supabase)

```typescript
// Tạo mock database
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({
            data: { id: "123", title: "Test" },
            error: null,
          })
        ),
      })),
    })),
  })),
};
```

**Giải thích**:

- `vi.fn()` tạo một hàm giả
- Khi gọi `from().insert().select().single()`, nó trả về dữ liệu giả
- Không cần database thật

#### Mock AI Service

```typescript
// Giả lập AI trả về kết quả
mockAI.callGeminiAI.mockResolvedValue({
  suggested_type: "bug",
  suggested_priority: "high",
  analysis: "This is a critical bug",
});
```

**Giải thích**: Khi gọi AI, nó trả về kết quả giả ngay lập tức, không cần gọi API thật.

## Đọc Hiểu Kết Quả Test

### Kết Quả Pass (Đạt)

```
✓ src/__tests__/services/ticketService.test.ts (25 tests) 86ms
  ✓ TicketService > createTicket() > Positive Tests
    ✓ TC01: should create ticket with valid data
    ✓ TC02: should create ticket with AI suggestions
```

**Giải thích**:

- ✓ = Test pass
- (25 tests) = Có 25 test trong file
- 86ms = Chạy hết 86 mili giây
- Tất cả test con đều pass

### Kết Quả Fail (Không Đạt)

```
✗ src/__tests__/services/ticketService.test.ts
  ✗ TC01: should create ticket with valid data
    Expected: { id: '123', title: 'Test' }
    Received: undefined
```

**Giải thích**:

- ✗ = Test fail
- Expected = Kết quả mong đợi
- Received = Kết quả thực tế nhận được
- Cần sửa code hoặc sửa test

### Coverage Report (Báo Cáo Độ Phủ)

```
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines
----------------------|---------|----------|---------|---------|----------------
ticketService.ts      |     100 |    91.66 |     100 |     100 | 103-109
```

**Giải thích**:

- **100% Stmts**: Tất cả câu lệnh được test
- **91.66% Branch**: 91.66% nhánh if/else được test
- **100% Funcs**: Tất cả hàm được test
- **Uncovered Lines 103-109**: Dòng 103-109 chưa được test

## Cách Viết Test Mới

### Bước 1: Chọn File Test

- Test service → `services/`
- Test component → `components/`
- Test AI function → `ai-functions/`
- Test tích hợp → `integration/`

### Bước 2: Viết Test Theo Mẫu

```typescript
describe("Tên tính năng", () => {
  // Chạy trước mỗi test
  beforeEach(() => {
    vi.clearAllMocks(); // Xóa mock cũ
  });

  describe("Tên hàm cần test", () => {
    describe("Loại test (Positive/Negative/Edge/Error)", () => {
      it("TC##: should mô tả hành vi mong đợi", async () => {
        // Arrange - Chuẩn bị
        const testData = {
          /* dữ liệu test */
        };

        // Act - Thực hiện
        const result = await functionToTest(testData);

        // Assert - Kiểm tra
        expect(result).toBeDefined();
        expect(result.property).toBe("expected value");
      });
    });
  });
});
```

### Bước 3: Chạy Test

```bash
npm test -- --grep "TC##"
```

### Bước 4: Sửa Cho Đến Khi Pass

- Nếu fail, đọc error message
- Sửa code hoặc sửa test
- Chạy lại cho đến khi pass

## Các Lệnh Assert Thường Dùng

### So Sánh Giá Trị

```typescript
// Bằng nhau (===)
expect(value).toBe(5);
expect(value).toBe("hello");

// Bằng nhau (deep comparison cho object/array)
expect(object).toEqual({ name: "John", age: 30 });
expect(array).toEqual([1, 2, 3]);
```

### Kiểm Tra Tồn Tại

```typescript
// Có giá trị (không null/undefined)
expect(value).toBeDefined();

// Là null
expect(value).toBeNull();

// Là true/false
expect(value).toBeTruthy();
expect(value).toBeFalsy();
```

### Kiểm Tra Số

```typescript
// Lớn hơn
expect(score).toBeGreaterThan(50);

// Nhỏ hơn
expect(age).toBeLessThan(100);

// Trong khoảng
expect(value).toBeGreaterThanOrEqual(0);
expect(value).toBeLessThanOrEqual(10);
```

### Kiểm Tra String

```typescript
// Chứa chuỗi con
expect(message).toContain("error");

// Khớp regex
expect(email).toMatch(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
```

### Kiểm Tra Array

```typescript
// Chứa phần tử
expect(array).toContain(item);

// Độ dài
expect(array).toHaveLength(5);
```

### Kiểm Tra Object

```typescript
// Có property
expect(user).toHaveProperty("name");
expect(user).toHaveProperty("age", 30);

// Khớp một phần object
expect(user).toMatchObject({ name: "John" });
```

### Kiểm Tra Async/Promise

```typescript
// Promise resolve
await expect(promise).resolves.toBe("success");

// Promise reject (throw error)
await expect(promise).rejects.toThrow("Error message");
```

### Kiểm Tra Function Mock

```typescript
// Đã được gọi
expect(mockFn).toHaveBeenCalled();

// Được gọi với tham số cụ thể
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);

// Được gọi n lần
expect(mockFn).toHaveBeenCalledTimes(3);
```

## Xử Lý Lỗi Thường Gặp

### Lỗi 1: Test Timeout

**Triệu chứng**:

```
Error: Test timed out in 5000ms
```

**Nguyên nhân**: Test chạy quá lâu (quá 5 giây)

**Giải pháp**:

```typescript
// Tăng timeout lên 10 giây
it("test name", async () => {
  // test code
}, 10000);
```

### Lỗi 2: Mock Không Hoạt Động

**Triệu chứng**: Test gọi service thật thay vì mock

**Giải pháp**:

```typescript
beforeEach(() => {
  vi.clearAllMocks(); // Xóa mock cũ
  // Setup mock lại
});
```

### Lỗi 3: Async/Await Thiếu

**Triệu chứng**:

```
Expected: { data: ... }
Received: Promise { <pending> }
```

**Nguyên nhân**: Quên await

**Giải pháp**:

```typescript
// Sai
const result = functionAsync();

// Đúng
const result = await functionAsync();
```

### Lỗi 4: Test Fail Sau Khi Sửa Code

**Nguyên nhân**: Code thay đổi, test cũ không còn đúng

**Giải pháp**:

1. Đọc error message
2. Kiểm tra xem code mới có đúng không
3. Cập nhật test cho phù hợp với code mới

### Lỗi 5: Coverage Thấp

**Giải pháp**:

1. Chạy `npm run test:coverage`
2. Xem dòng nào chưa được test (Uncovered Lines)
3. Viết test cho những dòng đó

## Quy Trình Làm Việc

### Khi Viết Code Mới

1. Viết test trước (TDD - Test Driven Development)
2. Test sẽ fail (vì chưa có code)
3. Viết code để test pass
4. Refactor (tối ưu) code
5. Chạy lại test để đảm bảo vẫn pass

### Khi Sửa Bug

1. Viết test tái hiện bug (test sẽ fail)
2. Sửa code
3. Test pass = bug đã fix
4. Commit cả code và test

### Trước Khi Commit

```bash
# 1. Chạy tất cả test
npm test

# 2. Kiểm tra coverage
npm run test:coverage

# 3. Nếu tất cả pass → commit
git add .
git commit -m "Your message"
```

### Trước Khi Deploy

```bash
# Chạy test một lần nữa
npm test

# Nếu pass → deploy
```

## Giải Thích Cho Người Khác

### Giải Thích Đơn Giản

> "Test là code tự động kiểm tra code. Thay vì mình phải test thủ công mỗi tính năng, mình viết code để test tự động. Khi có thay đổi, chỉ cần chạy 1 lệnh là biết có lỗi gì không."

### Giải Thích Chi Tiết

> "Bộ test này có 119 test cases kiểm tra tính năng tạo ticket và AI triage. Mỗi test case kiểm tra một tình huống cụ thể:
>
> - **Positive tests**: Kiểm tra tính năng hoạt động đúng với dữ liệu hợp lệ
> - **Negative tests**: Kiểm tra hệ thống báo lỗi đúng với dữ liệu không hợp lệ
> - **Edge tests**: Kiểm tra các trường hợp đặc biệt (dữ liệu quá dài, ký tự đặc biệt, v.v.)
> - **Error tests**: Kiểm tra xử lý lỗi hệ thống (database lỗi, API timeout, v.v.)
>
> Tất cả test đều dùng mock (giả lập) để không phụ thuộc vào database hay API thật. Điều này giúp test chạy nhanh (30 giây) và ổn định.
>
> Coverage 63% nghĩa là 63% code đã được test. Mục tiêu là giữ trên 60%."

### Demo Cho Người Khác

```bash
# 1. Chạy test
npm test

# 2. Giải thích kết quả
# - Dấu tick xanh = pass
# - Số test và thời gian chạy
# - Tất cả 119 tests đều pass

# 3. Chạy coverage
npm run test:coverage

# 4. Giải thích coverage report
# - % code được test
# - Dòng nào chưa test

# 5. Mở UI để xem chi tiết
npm run test:ui
```

## Tài Liệu Tham Khảo

### Tài Liệu Trong Project

- `README.md` - Tài liệu đầy đủ (tiếng Anh)
- `QUICK_START.md` - Hướng dẫn nhanh (tiếng Anh)
- `MOCK_PATTERNS.md` - Hướng dẫn mock chi tiết (tiếng Anh)

### Tài Liệu Bên Ngoài

- [Vitest Documentation](https://vitest.dev/) - Framework test
- [Testing Library](https://testing-library.com/) - Test React components
- [Test Requirements](./.kiro/specs/ticket-creation-unit-tests/requirements.md) - Yêu cầu test
- [Test Design](./.kiro/specs/ticket-creation-unit-tests/design.md) - Thiết kế test

## Câu Hỏi Thường Gặp (FAQ)

### Q1: Test có bắt buộc không?

**A**: Có, test rất quan trọng để:

- Đảm bảo code hoạt động đúng
- Phát hiện bug sớm
- Tự tin khi refactor code
- Duy trì chất lượng code

### Q2: Khi nào cần viết test?

**A**:

- Khi viết tính năng mới
- Khi sửa bug
- Khi refactor code
- Trước khi commit/deploy

### Q3: Test mất bao lâu để chạy?

**A**: ~30 giây cho tất cả 119 tests

### Q4: Làm sao biết test nào fail?

**A**: Chạy `npm test`, kết quả sẽ hiển thị test nào fail và lý do

### Q5: Coverage bao nhiêu là đủ?

**A**: Mục tiêu là 60%+. Hiện tại đang ở 63%.

### Q6: Mock có ảnh hưởng đến code thật không?

**A**: Không, mock chỉ dùng trong test, không ảnh hưởng code production.

### Q7: Có cần internet để chạy test không?

**A**: Không, tất cả đều dùng mock nên chạy offline được.

### Q8: Test có chạy tự động không?

**A**: Có thể setup CI/CD để chạy tự động khi commit/push.

## Tổng Kết

### Điều Quan Trọng Cần Nhớ

1. **Chạy test trước khi commit**: `npm test`
2. **Test phải pass 100%**: Không commit nếu có test fail
3. **Giữ coverage trên 60%**: Viết test cho code mới
4. **Mock để test nhanh**: Không dùng database/API thật
5. **Đọc error message**: Nó cho biết chính xác lỗi gì

### Lệnh Hay Dùng Nhất

```bash
npm test                    # Chạy tất cả test
npm run test:watch          # Chạy tự động khi save
npm run test:coverage       # Xem coverage
npm test -- --grep "TC##"   # Chạy test cụ thể
```

### Khi Cần Giúp Đỡ

1. Đọc file này lại
2. Xem file `README.md` (tiếng Anh)
3. Xem code test mẫu
4. Hỏi team members
5. Google error message

---

**Chúc bạn test thành công! 🚀**

_Nếu có câu hỏi, đừng ngại hỏi team._
