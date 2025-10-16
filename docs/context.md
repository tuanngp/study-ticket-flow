# 🧠 **Project Context: EduTicket AI – Hệ thống quản lý yêu cầu học tập & dự án thông minh cho FPT University**

## 1. 🎯 **Tổng quan**

**EduTicket AI** là nền tảng nội bộ được thiết kế riêng cho **môi trường học tập của FPT University (FPTU)**, cho phép **sinh viên – trợ giảng – giảng viên – quản lý bộ môn** trao đổi và xử lý các **yêu cầu học tập, lỗi kỹ thuật, vấn đề dự án** thông qua một **hệ thống ticket thông minh có AI hỗ trợ.**

Mục tiêu là **tự động hóa và tập trung hóa quy trình hỗ trợ học tập**, đồng thời **khai thác dữ liệu ticket để sinh báo cáo và cải thiện chương trình đào tạo**.

---

## 2. 😣 **Nỗi đau người dùng hiện nay**

| Đối tượng                             | Nỗi đau chính                                                                                                                                                              |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🎓 **Sinh viên**                      | - Không biết nên hỏi ai khi gặp lỗi (code, nộp bài, grading).<br>- Câu hỏi trùng lặp, mất thời gian chờ phản hồi.<br>- Không theo dõi được tiến độ xử lý yêu cầu.          |
| 🧑‍🏫 **Giảng viên / Trợ giảng (TA)** | - Quá tải tin nhắn từ nhiều kênh (Messenger, Email, Teams).<br>- Khó xác định mức độ khẩn cấp / loại lỗi.<br>- Thiếu thống kê và báo cáo tổng hợp để đánh giá tiến độ lớp. |
| 🧑‍💼 **Quản lý môn học / ngành**     | - Thiếu công cụ theo dõi tổng thể: môn/lớp nào gặp nhiều vấn đề nhất.<br>- Không có dữ liệu định lượng để đánh giá chất lượng học tập và TA.                               |

➡️ **Hệ quả:** Mất thời gian – Thiếu dữ liệu – Giảm hiệu quả hỗ trợ và học tập.

---

## 3. 🎯 **Mục tiêu & Mục đích**

| Mục tiêu                                       | Diễn giải                                                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 🎯 **Tập trung hóa hỗ trợ học tập**            | Một nền tảng duy nhất thay thế Messenger, Email, Google Form trong việc trao đổi học tập.           |
| 🧠 **Tự động hóa bằng AI**                     | Phân loại ticket tự động (bug code, grading, config, report…), gợi ý người xử lý và mức độ ưu tiên. |
| 📊 **Theo dõi tiến độ học tập qua dữ liệu**    | Sinh báo cáo, biểu đồ tiến độ và thống kê học kỳ cho từng lớp, nhóm, môn học.                       |
| 💬 **Cải thiện trải nghiệm học tập số**        | Giảm trùng lặp, giảm thời gian chờ, có AI hướng dẫn bước đầu cho sinh viên.                         |
| 🧩 **Xây dựng dataset nghiên cứu AI giáo dục** | Thu thập dữ liệu thực tế để huấn luyện mô hình phân loại ticket và chatbot học tập.                 |

---

## 4. 💡 **Giải pháp đề xuất: EduTicket AI Platform**

### 🧠 Ý tưởng cốt lõi

> “Biến mỗi thắc mắc, lỗi hay yêu cầu học tập của sinh viên thành một *ticket thông minh*, được AI phân loại, gợi ý người xử lý, và tổng hợp thành *báo cáo học tập toàn diện*.”

### 🔧 Cấu trúc mô hình học đường

```
Ngành (Software Engineering)
 ├── Môn học (PRJ301, SWP391, LAB211, ...)
 │     ├── Lớp học (SE1730, SE1731, ...)
 │     │     ├── Nhóm dự án (Team 07, Team 12, ...)
 │     │     │     └── Ticket của từng thành viên
 │     │     └── Báo cáo tổng kết lớp
 └── Báo cáo toàn ngành (so sánh môn, lớp, nhóm)
```

---

## 5. ⚙️ **Các Chức năng Chính (Feature Set)**

| Nhóm chức năng                     | Mô tả                                                                           | 
| ---------------------------------- | --------------------------------------------------------------------------------| 
| 🎫 **Ticket thông minh**           | Sinh viên tạo ticket khi gặp lỗi / câu hỏi học tập. AI tự gắn nhãn loại ticket. |
| 🧠 **AI Triage & Auto Assignment** | AI xác định độ ưu tiên, gợi ý TA/GV phù hợp để xử lý.                           |
| 💬 **AI Learning Assistant**       | Chatbot hỗ trợ 24/7, trả lời câu hỏi phổ biến và hướng dẫn fix lỗi.             |
| 📊 **Dashboard & Analytics**       | Thống kê tiến độ xử lý, top lỗi phổ biến, biểu đồ lớp / nhóm.                   |
| 📈 **Auto Report & Insight**       | AI tổng hợp báo cáo tự động: lỗi phổ biến, xu hướng tuần/tháng.                 |
| 🔔 **Notification & Integration**  | Gửi thông báo ticket qua Email / Discord / LMS.                                 |
| 🧩 **User & Role Management**      | Quản lý các vai trò: Student, TA, Lecturer, Manager, Admin.                     |

---

## 6. 🚀 **Điểm nổi bật & sáng tạo**

| Khác biệt                                          | Ý nghĩa                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| 🧠 **AI triage học từ dữ liệu FPTU thực tế**       | Phân loại chính xác và thích nghi dần với môi trường học tập Việt Nam.   |
| 🔁 **Active Learning Loop**                        | Khi người dùng sửa nhãn → mô hình tự cải thiện.                          |
| 📚 **Ứng dụng cho nghiên cứu giáo dục & SE**       | Dữ liệu ticket là nguồn cho các nghiên cứu NLP, triage, hành vi học tập. |
| 🔗 **Tích hợp đa nền tảng (LMS, GitHub, Discord)** | Hỗ trợ PRJ/SWP/LAB/Workshop đồng bộ.                                     |
| 🧠 **AI Insight cho quản lý môn học**              | Thống kê lỗi, đề xuất cải tiến nội dung giảng dạy.                       |

---

## 7. 🎓 **Lợi ích cho FPTU**

| Đối tượng                        | Lợi ích cụ thể                                                         |
| -------------------------------- | ---------------------------------------------------------------------- |
| 🎓 **Sinh viên**                 | Hỏi – được trả lời chính thống, theo dõi tiến độ, có AI hỗ trợ trước.  |
| 🧑‍🏫 **Trợ giảng / Giảng viên** | Giảm tải tin nhắn, dễ phân loại, có báo cáo hiệu suất.                 |
| 🧑‍💼 **Quản lý ngành / bộ môn** | Theo dõi toàn ngành, phát hiện vấn đề sớm, có dữ liệu cải tiến.        |
| 🧠 **Nhà nghiên cứu / SV SE**    | Có nguồn dataset tiếng Việt thực tế để huấn luyện mô hình AI giáo dục. |

---

## 🔍 **Tóm lược cốt lõi cho AI sử dụng**

* **Tên hệ thống:** EduTicket AI
* **Lĩnh vực:** Educational Technology (EdTech + AI)
* **Ngữ cảnh triển khai:** FPT University – môi trường học tập & dự án phần mềm
* **Trọng tâm kỹ thuật:** AI triage, NLP classification, LLM chatbot, dashboard analytics
* **Trọng tâm người dùng:** Sinh viên – TA – Giảng viên – Quản lý môn/ngành
* **Mục tiêu cuối:** Giảm quá tải hỗ trợ học tập, tự động hóa phân loại, tạo báo cáo thông minh, xây dataset AI học đường.

---