# 01 — Course Hierarchy

## §01.1 Cấu trúc 4 tầng
```
Course (khoá học)
 └─ Module (chương)
     └─ Content / Lesson (bài học)
         └─ Challenge (bài tập)
```

## §01.2 Course
- 1 Course = 1 lộ trình hoàn chỉnh (vd: Full Stack Mastery, System Design Mastery).
- Có metadata: tên, mô tả, ảnh bìa, độ dài ước tính, đối tượng mục tiêu.
- Có **pricing phase** riêng (xem §05).
- Course có thể có **prerequisite** (course khác phải hoàn thành trước) — optional.
- Hỗ trợ **preview content**: vài lesson đầu mở miễn phí để dùng thử.

## §01.3 Module
- 1 Module = 1 chương lớn trong Course, đánh số 0..N (vd: M0 Fundamentals, M1 Database).
- Mỗi Module có **lesson video** giới thiệu chương (intro video).
- Module có thứ tự cố định trong Course — không skip ngẫu nhiên.

## §01.4 Content (Lesson)
- 1 Lesson = 1 đơn vị học cuối cùng có nội dung markdown VI + EN + test.
- Lesson có thể chứa:
  - **Body markdown** (theory + flow + diagram mermaid)
  - **Code explaining** (giải thích đoạn code có sẵn)
  - **Code implementation** (mẫu code đa ngôn ngữ — TypeScript / C# / Go / Java cho SD)
  - **Content reference** (tài liệu tham khảo)
  - **Lesson video** (record video phát trên giao diện)
  - **Preview content** (đoạn trích để bán/demo)
- Lesson có **slide deck** (Gamma format) + **SRT subtitle** + **record script** cho phần video.

## §01.5 Foundation
- **Foundation** = kiến thức nền (ngoài Mastery Course chính).
- Foundation gắn **category** + **tag** để học viên duyệt theo chủ đề (vd: SQL, Docker, Linux).
- Foundation có thể nằm độc lập hoặc bổ trợ cho lesson trong Mastery Course.

## §01.6 Quy tắc đánh số slot
- Folder slot dạng `<N>-<slug>` với N là index từ 0.
- Module: `0-fundamentals-of-system-design`, `1-database-fundamentals`, …
- Lesson trong module: same convention.
- Challenge trong lesson: `<N>-<slug>-<tier>` (xem §02).

## §01.7 Quy tắc cập nhật nội dung
- **Không xoá** lesson đã có học viên enroll (chỉ archive).
- Thay đổi prerequisite: phải migrate enrollment hiện tại, không break user đang học.
- Bản dịch VI ↔ EN phải parity (xem §06).
