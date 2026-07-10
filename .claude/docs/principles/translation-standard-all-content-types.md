# PRINCIPLE — One translation standard, every content type

> **Chốt 2026-07-10.** `terminology-bold.md` (3-loại-từ + bold rule) là **NGUỒN DUY NHẤT**
> cho terminology/dịch/bold — áp dụng cho **TẤT CẢ** loại content thầy author qua các skill
> `starci-*-audit`/`starci-*-generate`, không riêng content+challenges như phạm vi cũ.

## Rule

Mọi loại content dưới đây, khi có bản `vi.md`, đều PHẢI tuân `.audits/rules/
terminology-bold.md` (3 loại từ §1, polysemy §2, bold §3, verify §7) — **KHÔNG mỗi loại tự
suy diễn chuẩn dịch riêng**:

| Loại content | Field áp dụng | Skill |
|---|---|---|
| **Content (lesson)** | `# body` văn xuôi | `starci-module-audit`/`generate` |
| **Challenges** | `title`/`description`/`requirements`/`steps` body/`outputs`/`prerequisites` | `starci-module-audit`/`generate` |
| **Flashcard** | `# answer` (Interview Arc: Chốt/Cơ chế/Trade-off/Bẫy/Đào sâu/Từ khoá) | `starci-flashcard-audit`/`generate` |
| **Mock-interview** | `# prompt`/`# idealAnswer`/`# rubric` item text/`# followUps`/`# hints` | `starci-interview-audit`/`generate` |
| **Milestone** | `### body`/`### outcome`/`### approach` per brief | `starci-milestone-audit`/`generate` |

Cùng 1 bộ quy tắc: 3 loại từ (phổ thông dịch / English-khó-dịch giữ nguyên / jargon
English+bold), polysemy đọc context, bold CHỈ 2 nhóm được phép, vi **đủ dấu**, không dịch ép
Loại 3, không dịch token code (Loại 4).

## Vì sao gộp 1 chuẩn

Trước đây mỗi rule doc con (`flashcard-answer.md`, `interview-answer.md`, milestone-skill
prose) chỉ nói "giữ term English, không dịch ép" — mô tả LẶP LẠI hời hợt, không trỏ về
`terminology-bold.md` như authority duy nhất → dễ lệch chuẩn giữa các loại content (vd
flashcard bold khác quy ước challenge). Principle này khoá lại: **CHỈ 1 rule doc quyết định
terminology/bold**, mọi rule con khác chỉ tham chiếu, không tự định nghĩa lại.

## Áp dụng

- Rule con của từng loại content (flashcard/interview/milestone/module) **PHẢI** có dòng trỏ
  thẳng `.audits/rules/terminology-bold.md` làm authority — không diễn giải lại bằng lời riêng.
- Khi `terminology-bold.md` cập nhật (vd thêm entry §5 bẫy false-positive mới) → áp dụng NGAY
  cho mọi loại content, không cần đồng bộ thủ công từng rule con.
- Gate/audit của từng loại (flashcard/interview/milestone/module) verify phần "vi đủ dấu +
  không dịch ép Loại 3" bằng cách đọc `terminology-bold.md`, không hard-code lại quy tắc.

## Liên quan

[[accordion-for-sequential-steps]] — principle song song, cùng tinh thần "1 chuẩn áp mọi loại
content".
