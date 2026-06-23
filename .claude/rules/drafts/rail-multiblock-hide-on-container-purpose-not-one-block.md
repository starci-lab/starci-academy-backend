# Draft — Rail/section NHIỀU block: ẩn theo MỤC ĐÍCH container, KHÔNG ẩn cả rail vì 1 block rỗng (2026-06-24)

- File/§ đích khi `/merge`: `starci-ui.rules` (rail/OnThisPage) + **đính chính** [[on-this-page-clean-label-and-depth]] + [[labeled-section-render-empty-not-self-hide]].
- Bối cảnh: lesson reader, tab **"Thử thách"** (`?tab=challenges`, query param — KHÔNG phải route segment) bị **mất hẳn rail "Trên trang này" (OnThisPage)** so với tab "Nội dung". Thầy: *"sao thử thách lại mất cái OnThisPage nhỉ"*.
- Gốc: `OnThisPage` có `if (headings.length === 0) return null` → tự ẩn **TOÀN BỘ** rail khi body không có heading. Nhưng rail gồm **4 block**: TOC (heading) **+ ContentActions (bookmark/share) + LessonFlashcards (ôn tập) + LessonChallenges (luyện tập)** — 3 block sau thuộc về BÀI, không phụ thuộc heading. Tab Thử thách = list card (0 heading) → early-return giết oan cả 3 → rail biến mất → **layout nhảy** khi đổi tab.

## Luật (STRICT)
- **Container nhiều block (rail/section) KHÔNG được tự ẩn cả container chỉ vì MỘT block rỗng.** Điều kiện ẩn phải bám **mục đích thật của container**, không bám trạng thái của 1 thành phần. OnThisPage là **sidebar per-lesson** → hiện khi **có bài đang mở** (`contentId`), ẩn khi không có bài (vd module overview). Heading rỗng chỉ ẩn **đúng block TOC**, không ẩn rail.
- **Mỗi block tự quản empty riêng, render có điều kiện trong container:** TOC `{headings.length > 0 && <nav/>}`; Flashcards/Challenges/Actions tự self-hide (AsyncContent empty / null). Đừng để 1 cờ (headings) quyết định sự sống của cả cụm.
- **Đổi tab cùng 1 surface KHÔNG được làm layout nhảy.** Rail phải ổn định qua các tab của cùng 1 trang (Nội dung ↔ Thử thách); chỉ NỘI DUNG bên trong rail đổi (TOC xuất hiện/biến mất), khung rail giữ nguyên → không giật chiều rộng cột đọc.
- **Block trong rail trùng nội dung với body của tab hiện tại → ẩn block đó trên tab đó** (chống lặp). Vd LessonChallenges ("luyện tập bài này" + CTA mở tab Thử thách) **ẩn khi `contentTab === ContentTab.Challenges`** vì body đã liệt kê đúng các challenge đó. Nguyên tắc: rail bổ trợ cho body, không nhân đôi body.
- **Phân biệt tab (query param) vs route segment:** `?tab=challenges` là **query param** (đổi client-side trong cùng trang) — KHÁC trang SOLVE `…/challenges/<id>` (route segment, `segments.includes("challenges")`). Layout đọc segment để bật/tắt rail; đừng nhầm 2 thứ. Trang reader (mọi tab) GIỮ rail; chỉ leaf solve mới full-bleed (ref [[solving-surface-fullbleed-no-course-rails]]).

## ĐÃ ÁP DỤNG 2026-06-24
- `features/learn/OnThisPage/index.tsx`: bỏ `if (headings.length === 0) return null` → đổi thành `if (!contentId) return null` (ẩn rail chỉ khi không có bài mở). TOC `<nav>` bọc trong `{headings.length > 0 && …}`. LessonChallenges bọc `{contentTab !== ContentTab.Challenges && …}` (đọc `state.tabs.contentTab`). tsc/lint sạch (lỗi `.next/types/validator.ts` là artifact build cũ, không phải src).
- Kết quả: tab Thử thách giữ rail = ContentActions + LessonFlashcards (no TOC, no duplicate "luyện tập") → không còn layout nhảy.
