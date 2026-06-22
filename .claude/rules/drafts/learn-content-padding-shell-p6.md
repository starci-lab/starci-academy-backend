# Draft — Mọi trang /learn: cột nội dung = `p-6`, SHELL sở hữu padding (2026-06-21)

- File/§ đích khi `/merge`: `starci-ui.rules` (layout/container) + `main.md` §8 spacing + cập nhật [[three-tier-page-layout]].
- Bối cảnh: thầy chỉ "phần màu xanh" (cột nội dung trang `/learn/foundations`) đang `p-3` (12px) → muốn `p-6` (24px),
  **áp dụng cho TOÀN BỘ trang ở `/learn`**. Trước đó padding rải rác mỗi feature: Foundations `p-3`, Flashcards/Practice
  `px-6 py-6`, Leaderboard KHÔNG có, PersonalProject `p-6` (lại bị **double** vì shell cũng `p-6`).

## Luật (STRICT)
- **Cột nội dung của trang `/learn` = `p-6`, và `LearnShell` (shell) SỞ HỮU padding này — feature KHÔNG tự khai.**
  Đây là hệ quả trực tiếp của luật "padding = container/block sở hữu, feature chỉ placement" (xem
  [[three-tier-page-layout]]). Feature chỉ còn `max-w-* + mx-auto + gap` (cap cột + canh giữa + nhịp dọc), CẤM `p-*`
  ở wrapper feature.
- **Cài đặt 1 nơi:** `LearnShell` content column = `cn("min-h-0 min-w-0 flex-1", !fullBleed && "p-6", leftRail && "max-lg:pb-16 lg:pr-0 lg:pb-0", …)`.
  Mọi tab learn (foundations, flashcards, practice, leaderboard, headhuntings, personal-project, modules…) lấy `p-6`
  từ đây → đồng nhất, hết drift, hết double-padding.
- **Full-bleed opt-out:** trang canvas tràn viền (mind-map) truyền `fullBleed` (layout: `fullBleed={segment === "mind-map"}`)
  để BỎ `p-6` (canvas chiếm trọn viewport). Đây là ngoại lệ DUY NHẤT; mọi trang "đọc" khác đều padded.
- **Hệ quả khi refactor padding về shell:** PHẢI gỡ `p-*` ở wrapper feature cũ, nếu không double padding (vd
  personal-project đang `p-6`(shell) + `p-6`(feature)). Kiểm cả route có `leftRail` (modules/personal-project) vì
  shell đã `p-6` sẵn ở đó.
- Repo FE thật: **`D:\Repositories\starci-academy`** (branch `final-mvp`), route `src/app/[locale]/courses/[courseId]/learn/`.
  (KHÔNG phải `C:\Repositories\starci-academy` — đó là bản cũ.)

## Bổ sung 2026-06-21 (personal-project workspace)
- **Flush phải (`lg:pr-0 lg:pb-0`) của shell content column = gate theo `rightRail`, KHÔNG theo `leftRail`.**
  Lý do: bỏ padding phải chỉ đúng khi cột nội dung ÁP SÁT vào right-rail (trang `modules` + on-this-page). Trang
  có leftRail nhưng KHÔNG có rightRail (vd `personal-project`, rail "Github dự án" nằm TRONG content) phải GIỮ
  `pr-6`/`pb-6` để rail không dính mép. → `rightRail && "lg:pr-0 lg:pb-0"`, còn `leftRail && "max-lg:pb-16"` (chỗ
  trống cho mobile tab bar) tách riêng.
- **ĐÍNH CHÍNH [[three-tier-page-layout]]:** trong layout SPLIT (đọc trái + action phải), cột đọc **dùng `mx-auto`
  (CĂN GIỮA)**, KHÔNG còn left-align như bản cũ ghi (thầy chốt 2026-06-21 trên personal-project task). Cột đọc vẫn
  `max-w-3xl`, chỉ thêm `mx-auto` để brief nằm giữa vùng đọc.
