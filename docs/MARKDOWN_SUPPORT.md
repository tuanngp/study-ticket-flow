# Markdown Support trong Comments

## 🎨 Tổng quan

Comments trong EduTicket AI hỗ trợ **Markdown formatting** để giúp bạn viết câu trả lời đẹp và dễ đọc hơn.

## ✨ Tính năng

### 1. Live Preview

- Click "Xem trước" để xem kết quả
- Click "Chỉnh sửa" để quay lại chế độ edit
- Preview hiển thị chính xác như comment sau khi gửi

### 2. Markdown Guide

- Click vào "Markdown Guide" để xem hướng dẫn nhanh
- Hiển thị các syntax phổ biến nhất

### 3. Auto-render

- Comments đã gửi tự động render markdown
- Hỗ trợ dark mode

## 📝 Markdown Syntax

### Text Formatting

#### Bold (In đậm)

```markdown
**text in đậm**
**text in đậm**
```

**Kết quả:** **text in đậm**

#### Italic (In nghiêng)

```markdown
_text in nghiêng_
_text in nghiêng_
```

**Kết quả:** _text in nghiêng_

#### Bold + Italic

```markdown
**_text in đậm và nghiêng_**
```

**Kết quả:** **_text in đậm và nghiêng_**

#### Strikethrough (Gạch ngang)

```markdown
~~text bị gạch~~
```

**Kết quả:** ~~text bị gạch~~

### Code

#### Inline Code

```markdown
Sử dụng `console.log()` để debug
```

**Kết quả:** Sử dụng `console.log()` để debug

#### Code Block

````markdown
```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```
````

**Kết quả:**

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

#### Code Block với Syntax Highlighting

Hỗ trợ các ngôn ngữ:

- `java`, `javascript`, `python`, `sql`, `html`, `css`, `json`, `xml`, etc.

### Headings (Tiêu đề)

```markdown
# Heading 1

## Heading 2

### Heading 3

#### Heading 4
```

**Kết quả:**

# Heading 1

## Heading 2

### Heading 3

#### Heading 4

### Lists (Danh sách)

#### Unordered List

```markdown
- Item 1
- Item 2
  - Sub-item 2.1
  - Sub-item 2.2
- Item 3
```

**Kết quả:**

- Item 1
- Item 2
  - Sub-item 2.1
  - Sub-item 2.2
- Item 3

#### Ordered List

```markdown
1. Bước 1
2. Bước 2
3. Bước 3
```

**Kết quả:**

1. Bước 1
2. Bước 2
3. Bước 3

### Links (Liên kết)

```markdown
[Google](https://google.com)
[FPT University](https://fpt.edu.vn)
```

**Kết quả:**
[Google](https://google.com)
[FPT University](https://fpt.edu.vn)

### Blockquotes (Trích dẫn)

```markdown
> Đây là một trích dẫn
> Có thể nhiều dòng
```

**Kết quả:**

> Đây là một trích dẫn
> Có thể nhiều dòng

### Tables (Bảng)

```markdown
| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |
```

**Kết quả:**
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1 | Data 2 | Data 3 |
| Data 4 | Data 5 | Data 6 |

### Horizontal Rule (Đường kẻ ngang)

```markdown
---
```

## **Kết quả:**

## 💡 Use Cases

### 1. Trả lời câu hỏi code

````markdown
Để fix lỗi `NullPointerException`, bạn cần:

1. **Check null trước khi dùng:**
   ```java
   if (object != null) {
       object.method();
   }
   ```
````

2. **Sử dụng Optional:**

   ```java
   Optional<String> optional = Optional.ofNullable(value);
   optional.ifPresent(v -> System.out.println(v));
   ```

3. **Initialize đúng cách:**
   - Không để object = null
   - Khởi tạo trong constructor

````

### 2. Hướng dẫn từng bước

```markdown
## Cách submit assignment

1. **Chuẩn bị code:**
   - Đảm bảo code chạy được
   - Remove debug statements
   - Format code đẹp

2. **Tạo file ZIP:**
   - Chỉ include source code
   - Không include `.class` files
   - Đặt tên: `StudentID_AssignmentName.zip`

3. **Submit lên FAP:**
   - Login vào FAP
   - Vào Assignment section
   - Upload file ZIP
   - Click Submit

> **Lưu ý:** Deadline là 23:59, submit muộn bị trừ điểm!
````

### 3. Giải thích lỗi

````markdown
Lỗi này xảy ra vì:

- **Nguyên nhân:** Connection string không đúng
- **Giải pháp:**

  ```java
  String url = "jdbc:mysql://localhost:3306/database";
  String user = "root";
  String password = "your_password";

  Connection conn = DriverManager.getConnection(url, user, password);
  ```
````

**Checklist:**

- [ ] MySQL đã chạy chưa?
- [ ] Database đã tạo chưa?
- [ ] Username/password đúng chưa?

````

### 4. So sánh options

```markdown
## So sánh ArrayList vs LinkedList

| Feature | ArrayList | LinkedList |
|---------|-----------|------------|
| Access | O(1) | O(n) |
| Insert | O(n) | O(1) |
| Delete | O(n) | O(1) |
| Memory | Ít hơn | Nhiều hơn |

**Kết luận:**
- Dùng `ArrayList` khi cần **truy cập nhanh**
- Dùng `LinkedList` khi cần **insert/delete nhiều**
````

### 5. Highlight quan trọng

```markdown
⚠️ **QUAN TRỌNG:**

Trước khi submit, hãy đảm bảo:

1. ✅ Code compile được
2. ✅ Không có hardcoded paths
3. ✅ Comment đầy đủ
4. ✅ Follow naming conventions

> Nếu không làm đúng, bài làm sẽ bị **0 điểm**!
```

## 🎯 Best Practices

### 1. Sử dụng Code Blocks

✅ **Đúng:**

````markdown
```java
System.out.println("Hello");
```
````

❌ **Sai:**

```markdown
System.out.println("Hello")
```

### 2. Format Lists

✅ **Đúng:**

```markdown
1. Bước 1
2. Bước 2
3. Bước 3
```

❌ **Sai:**

```markdown
1. Bước 1
1. Bước 2
1. Bước 3
```

### 3. Sử dụng Headings

✅ **Đúng:**

```markdown
## Giải pháp

### Bước 1: Setup

### Bước 2: Code
```

❌ **Sai:**

```markdown
**Giải pháp**

**Bước 1: Setup**
**Bước 2: Code**
```

### 4. Preview trước khi gửi

- Luôn click "Xem trước" để check
- Đảm bảo format đúng
- Đảm bảo code block có syntax highlighting

## 🔧 Tips & Tricks

### 1. Emoji Support

Sử dụng emoji để làm nổi bật:

```markdown
✅ Đúng
❌ Sai
⚠️ Cảnh báo
💡 Gợi ý
🔥 Quan trọng
📝 Ghi chú
```

### 2. Nested Lists

```markdown
1. Main item
   - Sub item 1
   - Sub item 2
     - Sub-sub item
2. Main item 2
```

### 3. Multiple Code Blocks

````markdown
**Java:**

```java
System.out.println("Hello");
```
````

**JavaScript:**

```javascript
console.log("Hello");
```

````

### 4. Inline Code trong Lists
```markdown
1. Sử dụng `ArrayList` cho dynamic arrays
2. Sử dụng `LinkedList` cho frequent insertions
3. Sử dụng `HashMap` cho key-value pairs
````

## 🐛 Common Issues

### Issue 1: Code block không hiển thị

**Nguyên nhân:** Thiếu backticks hoặc language identifier

**Giải pháp:**

````markdown
```java
// code here
```
````

### Issue 2: List không indent đúng

**Nguyên nhân:** Thiếu spaces

**Giải pháp:**

```markdown
- Item 1
  - Sub item (2 spaces)
    - Sub-sub item (4 spaces)
```

### Issue 3: Link không work

**Nguyên nhân:** Syntax sai

**Giải pháp:**

```markdown
[Text](https://url.com) ✅
[Text] (https://url.com) ❌ (có space)
```

## 📚 Resources

### Markdown Cheatsheet

- [Markdown Guide](https://www.markdownguide.org/)
- [GitHub Markdown](https://guides.github.com/features/mastering-markdown/)

### Practice

- [Markdown Live Preview](https://markdownlivepreview.com/)
- [Dillinger](https://dillinger.io/)

## 🎓 Examples từ thực tế

### Example 1: Debug help

````markdown
## Lỗi NullPointerException

**Nguyên nhân:**
Object `student` chưa được khởi tạo.

**Code lỗi:**

```java
Student student;
System.out.println(student.getName()); // NPE here!
```
````

**Fix:**

```java
Student student = new Student();
System.out.println(student.getName()); // OK!
```

**Hoặc:**

```java
if (student != null) {
    System.out.println(student.getName());
}
```

````

### Example 2: Assignment instructions
```markdown
# Assignment 2: Student Management System

## Requirements

1. **Database:**
   - Table: `students`
   - Columns: `id`, `name`, `email`, `gpa`

2. **Features:**
   - ✅ CRUD operations
   - ✅ Search by name
   - ✅ Sort by GPA

3. **Submission:**
   - Format: `StudentID_Assignment2.zip`
   - Deadline: **2025-02-01 23:59**
   - Submit to: FAP System

> ⚠️ Late submission: -10% per day
````

---

**Version:** 1.0  
**Last Updated:** January 2025  
**Developed for:** FPT University EduTicket AI
