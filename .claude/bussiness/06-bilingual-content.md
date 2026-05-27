# 06 — Bilingual Content (VI + EN)

## §06.1 Hai ngôn ngữ chuẩn
- **vi** (Tiếng Việt) — mặc định, mọi nội dung phải có VI.
- **en** (English) — bắt buộc parity với VI cho mọi entity dạng content.

## §06.2 Translation entity pattern
Mỗi entity nội dung chính có thực thể `*-translation` đi kèm để lưu text theo locale:
- `course-translation`, `module-translation`, `content-translation`
- `challenge-translation`, `challenge-requirement-translation`, `challenge-step-translation`
- `challenge-output-translation`, `challenge-reference-translation`, `challenge-prerequisite-translation`
- `challenge-submission-prompt-translation`, `challenge-submission-translation`
- `challenge-step-code-implementation-translation`
- `code-explaining-translation`, `code-implementation-translation`
- `content-reference-translation`, `consultant-translation`
- `foundation-translation`, `foundation-category-translation`, `foundation-tag-translation`
- `headhunting-company-translation`, `lesson-video-translation`
- `livestream-session-translation`, `milestone-translation`
- `milestone-task-translation`, `milestone-task-criteria-translation`

## §06.3 Parity rules
Khi viết content phải đảm bảo VI ↔ EN:
- **Cùng số lượng** requirement, step, criteria, reference.
- **Cùng cấu trúc heading** (cùng order các H1/H2/H3).
- **Cùng score sum**.
- **Cùng separator position** (cho file challenge markdown).
- **Cùng nghĩa** — không thêm/bớt thông tin, chỉ chuyển ngữ.

## §06.4 Markdown file convention
- Folder lesson/challenge chứa cặp file `vi.md` + `en.md`.
- File `test.md` (nếu có) bằng EN — để dev test prompt.
- Tên slug folder luôn **bằng tiếng Anh** (không dùng tiếng Việt có dấu).

## §06.5 Quy ước thuật ngữ
- **Em-dash strict** — dùng `—` (U+2014), không dùng `--` hoặc `-`.
- Tên công nghệ giữ nguyên (Kafka, Redis, NestJS) trong cả 2 ngôn ngữ.
- Đơn vị: tiếng Việt dùng "RPS", "p99", "ms" như EN — không dịch.
- Số liệu giữ format quốc tế: `1,000` không dùng `1.000`.

## §06.6 Khi content chỉ có 1 locale
- **Không cho phép** — mọi content phải có cả VI và EN trước khi publish.
- Audit script kiểm tra `missingEn` / `missingVi` phải = 0 trước release.

## §06.7 UI ngôn ngữ
- Frontend cho user chọn locale (mặc định VI nếu IP Việt Nam, EN nếu nước ngoài).
- Locale lưu vào profile user — preference cá nhân.
- Một số entity không cần dịch (vd: video URL, ảnh) — chỉ text dịch.

## §06.8 Workflow viết content
1. Viết VI trước (ngôn ngữ gốc, sát nghiệp vụ).
2. Dịch sang EN giữ parity §06.3.
3. Chạy audit script verify parity + format.
4. Submit cho admin review.
5. Publish khi cả 2 locale đều pass.
