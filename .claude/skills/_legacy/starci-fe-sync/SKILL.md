---
name: starci-fe-sync
description: >
  Đồng bộ trạng thái FE THẬT ↔ Storybook và ghi DIFF vào `.claude/fe/_state/` để các skill
  brainstorm/apply KHỎI rescan toàn bộ source mỗi lần. Incremental theo GIT: so `HEAD` với
  `lastSyncCommit` trong `snapshot.json`, `git diff` chỉ những file component (`src/components/**`)
  + story (`src/**/*.stories.tsx`) đã đổi → phân loại thay đổi (component mới/đổi prop/xoá · story
  mới/lệch/thiếu · component-chưa-có-story = coverage hole) → append 1 block ngày vào `diff.md` +
  cập nhật `snapshot.json` (map component↔story + `lastSyncCommit` mới). Cache **COMMIT vào git**
  → session/máy khác chia sẻ baseline, khỏi quét lại từ đầu. READ-ONLY source, chỉ GHI `_state/`.
  **Song song (KHÔNG thay) `starci-fe-audit-story-book`**: sync = incremental nhanh chạy thường
  xuyên (chỉ phần đổi); audit = full-scan coverage sâu khi thầy chủ động gọi. `starci-fe-story-fix`
  KHÔNG kích hoạt sync (chỉnh story ≠ đổi app state, không ghi diff). Trigger khi thầy gõ
  `/starci-fe-sync [scope]`, hoặc "sync fe", "cập nhật diff fe", "đồng bộ storybook ↔ code".
---

# /starci-fe-sync — Đồng bộ FE↔Storybook, ghi DIFF, KHỎI rescan

Nguồn sự thật của vòng FE là **Storybook**. Skill này giữ 1 **cache trạng thái đã-biết** trong
`.claude/fe/_state/` để `layout/block-brainstorm` và `*-apply` đọc DIFF thay vì quét lại cả
`src/`. Chạy nhanh, thường xuyên; grounded vào GIT nên chính xác.

App FE chính: `C:\Repositories\starci-academy` (⚠️ nếu path lệch — xem memory `fe-app-repo-location` — hỏi thầy trước khi quét).

## Nhà cache — `.claude/fe/_state/` (COMMIT vào git)
- **`snapshot.json`** — trạng thái lần sync gần nhất:
  ```jsonc
  {
    "lastSyncCommit": "<sha app-FE lúc sync>",   // neo git để diff incremental
    "generatedAt": "<ISO, do người/agent điền — KHÔNG bịa>",
    "components": { "<path>": { "story": "<path story|null>", "exports": ["Foo"] } },
    "stories":    { "<path>": { "of": "<component path>", "titles": ["..."] } },
    "holes":      ["<component chưa có story>"]
  }
  ```
- **`diff.md`** — log **append-only**, mỗi lần sync 1 block ngày: bảng `Added/Modified/Removed`
  cho component + story + `holes` mới phát sinh. Đây là cái brainstorm/apply đọc.
- **`README.md`** — giải thích cache (đọc trước khi sửa tay).

## Quy trình (incremental, theo git)
1. **Đọc `snapshot.json`** → lấy `lastSyncCommit`. Chưa có (lần đầu) → coi như full: liệt kê mọi
   component + story (glob) làm baseline, KHÔNG cần diff.
2. **Neo commit hiện tại** của app FE: `git -C <app> rev-parse HEAD`.
3. **Chỉ lấy file đổi**: `git -C <app> diff --name-status <lastSyncCommit> HEAD -- src/components 'src/**/*.stories.tsx'`.
   (Không đổi gì → báo "đã đồng bộ", dừng — KHỎI quét.)
4. **Phân loại** từng file đổi:
   - component `A`/`M`/`D` (thêm/sửa/xoá) — với `M`: đọc diff prop/export nếu cần cho drift.
   - **story-ONLY (bỏ qua diff chính):** story đổi mà **component tương ứng KHÔNG nằm trong danh sách đổi** → đây là
     `story-fix` lặt vặt → **KHÔNG ghi vào block diff brainstorm-facing** (cùng lắm 1 dòng phụ "story-only: …" cho log,
     không phải tín hiệu "app đổi"). Đây là cách hiện thực hoá "story-fix không vào diff".
   - **story kèm component (GHI):** story `A`/`M` đi cùng component mới/đổi (news từ `*-apply`, hoặc coverage hole→có story)
     → GHI vào diff (đó mới là thay đổi app state brainstorm cần biết). Story gắn `tags:['news']` chờ duyệt → ghi kèm nhãn "news".
   - **coverage hole**: component có mà không có `*.stories.tsx` tương ứng → thêm vào `holes`.
   - **drift nhẹ**: story tham chiếu prop/value không còn trong component đổi → đánh dấu (không tự sửa; đó là việc `story-fix`/`audit`).
5. **Ghi**: append 1 block ngày vào `diff.md`; cập nhật `snapshot.json` (map + `lastSyncCommit = HEAD`).
6. **KHÔNG sửa source, KHÔNG sửa story** — sync chỉ ĐỌC source, chỉ GHI `_state/`. Sửa là việc của skill khác.

## Ranh giới (STRICT)
- **KHÔNG thay `starci-fe-audit-story-book`.** Sync = incremental (phần đổi). Cần soi COVERAGE sâu
  toàn Storybook / drift ngữ nghĩa → gọi audit-story-book (full-scan, nặng). Sync có thể *chỉ ra*
  holes để audit/generate xử lý, không tự generate story.
- **`story-fix` KHÔNG kích hoạt sync** và sync KHÔNG ghi thay đổi do story-fix: chỉnh story lặt vặt
  ≠ đổi app state, đừng làm bẩn `diff.md` (giữ diff chỉ phản ánh thay đổi COMPONENT thật).
- READ-ONLY `src/`; WRITE-ONLY `.claude/fe/_state/`.
- `generatedAt`/thời gian: điền mốc THẬT (không bịa) — nếu không chắc, để agent lấy từ commit.

## Liên quan
- Tiêu thụ diff: `starci-fe-layout-brainstorm`, `starci-fe-block-brainstorm` (đọc `_state/diff.md`
  + `concepts/` thay vì rescan) · `*-apply` (đẩy story "news" → thầy duyệt → lần sync sau ghi vào diff).
- Full-scan: `starci-fe-audit-story-book` · story lặt vặt: `starci-fe-story-fix` (không đụng diff).
- Bản đồ: `.claude/fe/README.md`.
