---
name: starci-fe-sync
description: >
  Đồng bộ trạng thái FE THẬT ↔ Storybook INCREMENTAL theo git-diff và ghi cache vào
  `.artifacts/states/` (trong SOURCE FE `$FE_SOURCE`) để brainstorm/apply
  KHỎI rescan toàn bộ `src/` mỗi lần. So `HEAD` với `lastSyncCommit` trong `snapshot.json`,
  `git diff --name-status` chỉ file component (`src/components/**`) + story (`.storybook/stories/**/*.stories.tsx`)
  đã đổi → phân loại (component mới/đổi/xoá · story kèm-component vs story-only · coverage hole ·
  drift nhẹ) → append 1 block ngày vào `diff.md` + cập nhật `snapshot.json` (map component↔story +
  `lastSyncCommit` mới). READ-only source, GHI-only `.artifacts/states/` — KHÔNG ghi `.claude/`.
  Song song (KHÔNG thay) `starci-fe-audit-story-book` (full-scan nặng, thầy gọi riêng);
  `starci-fe-story-fix` KHÔNG kích hoạt sync và story-only KHÔNG vào diff. Trigger khi thầy gõ
  `/starci-fe-sync [scope]`, hoặc "sync fe", "cập nhật diff fe", "đồng bộ storybook ↔ code",
  "refresh states".
---

# /starci-fe-sync — Đồng bộ FE↔Storybook incremental, ghi `.artifacts/states`

Storybook = nguồn sự thật UI. Skill này giữ **cache trạng thái đã-biết** trong
`.artifacts/states/` của SOURCE FE, để `starci-fe-layout-brainstorm` / `starci-fe-block-brainstorm`
đọc DIFF thay vì quét lại cả `src/`. Chạy nhanh, thường xuyên, grounded vào GIT.

**App FE chính: `$FE_SOURCE` (branch `mtp`, có `.storybook/`).**
⚠️ Đường dẫn FE lấy từ `$BE_SOURCE/.artifacts/config.json` (`feSource`) — KHÔNG hard-code ổ đĩa.

## Nhà cache — `.artifacts/states/` (trong SOURCE FE, commit theo repo FE)

- **`snapshot.json`** — trạng thái lần sync gần nhất:
  ```jsonc
  {
    "lastSyncCommit": "<sha HEAD app-FE lúc sync>",   // neo git để diff incremental
    "generatedAt": "<ISO thật — lấy từ commit/clock, KHÔNG bịa>",
    "components": { "<path>": { "story": "<path story|null>", "exports": ["Foo"] } },
    "stories":    { "<path>": { "of": "<component path>", "titles": ["..."] } },
    "holes":      ["<component chưa có story>"]
  }
  ```
- **`diff.md`** — log **append-only**, mỗi lần sync 1 block ngày: bảng Added/Modified/Removed
  cho component + story, `holes` mới phát sinh, story `news` chờ duyệt. Đây là cái brainstorm đọc.
- **`README.md`** — giải thích cache (nếu chưa có thì tạo 1 lần; đọc trước khi sửa tay).

Sibling trong `.artifacts/`: `concepts/` · `prototypes/` · `proposals/` — skill này **KHÔNG đụng**,
chỉ ghi `states/`.

## Quy trình (incremental, theo git)

1. **Đọc `snapshot.json`** → lấy `lastSyncCommit`. Chưa có (lần đầu) → full baseline: glob mọi
   component (`src/components/**`) + story (`.storybook/stories/**/*.stories.tsx`), dựng map + holes, KHÔNG cần diff.
2. **Neo commit hiện tại**: `git -C $FE_SOURCE rev-parse HEAD`.
3. **Chỉ lấy file đổi**:
   `git -C <app> diff --name-status <lastSyncCommit> HEAD -- src/components '.storybook/stories/**/*.stories.tsx'`.
   Không có gì đổi → báo "đã đồng bộ tại `<sha>`", DỪNG — khỏi quét.
4. **Phân loại** từng file đổi:
   - **Component `A`/`M`/`D`** (thêm/sửa/xoá) — với `M`: đọc diff prop/export nếu cần cho drift.
   - **Story-ONLY (KHÔNG vào diff chính):** story đổi mà component tương ứng KHÔNG nằm trong danh
     sách đổi → đó là `story-fix` lặt vặt, KHÔNG phải tín hiệu "app đổi". Cùng lắm 1 dòng phụ
     `story-only: …` cuối block cho log — không làm bẩn diff brainstorm-facing.
   - **Story kèm component (GHI):** story `A`/`M` đi cùng component mới/đổi (story "news" từ
     `*-apply`, hoặc hole→có story) → GHI vào diff. Story có `tags: ['news']` + caption "Chờ duyệt"
     → ghi kèm nhãn **news** để thầy biết cái nào đang chờ duyệt trên Storybook.
   - **Coverage hole:** component tồn tại mà không có `*.stories.tsx` tương ứng → thêm `holes`.
   - **Drift nhẹ:** story tham chiếu prop/value không còn trong component đã đổi → ĐÁNH DẤU trong
     diff, KHÔNG tự sửa (việc của `starci-fe-story-fix` / audit).
5. **Ghi**: append 1 block ngày vào `diff.md`; cập nhật `snapshot.json`
   (map component↔story + holes + `lastSyncCommit = HEAD` + `generatedAt` thật).
6. **HẾT.** KHÔNG sửa source, KHÔNG sửa story, KHÔNG generate story mới — sửa là việc skill khác.

## Ranh giới (STRICT)

- **READ-only `src/` · GHI-only `.artifacts/states/`.** KHÔNG ghi `.claude/` (rule read-only trong
  vòng lặp skill), KHÔNG đụng `.artifacts/{concepts,prototypes,proposals}`.
- **KHÔNG thay `starci-fe-audit-story-book`.** Sync = incremental nhanh, chạy thường xuyên (chỉ
  phần đổi). Cần soi COVERAGE sâu toàn Storybook / drift ngữ nghĩa → audit-story-book (full-scan,
  nặng, thầy chủ động gọi). Sync chỉ *chỉ ra* holes, không tự lấp.
- **`starci-fe-story-fix` KHÔNG kích hoạt sync** và thay đổi story-only KHÔNG vào diff chính —
  giữ `diff.md` chỉ phản ánh thay đổi COMPONENT/app-state thật.
- **`*-apply` KHÔNG tự ghi states** — apply chỉ đẩy story "news" lên Storybook; lần sync KẾ mới
  ghi vào diff. Đây là hợp đồng 1-người-ghi: duy nhất fe-sync ghi `states/`.
- `generatedAt`/mốc thời gian: điền THẬT (từ commit hoặc clock) — không bịa.
- Path lệch / repo không phải `$FE_SOURCE` → DỪNG hỏi thầy, không tự đoán.

## Liên quan

- Tiêu thụ diff: `starci-fe-layout-brainstorm` · `starci-fe-block-brainstorm` (đọc
  `.artifacts/states/diff.md` + `.artifacts/concepts/` thay vì rescan src).
- Sản xuất thay đổi: `starci-fe-layout-apply` · `starci-fe-block-apply` (đẩy story `news` →
  thầy duyệt trên Storybook → lần sync sau vào diff).
- Full-scan coverage: `starci-fe-audit-story-book` · story lặt vặt: `starci-fe-story-fix`
  (cả hai KHÔNG ghi states).
- Bản đồ canon: [[fe/README]] · lớp element: [[fe/components/INDEX]] · quy ước story caption:
  [[fe/engineering/storybook-canvas]].
