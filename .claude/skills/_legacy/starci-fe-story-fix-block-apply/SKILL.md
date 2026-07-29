---
name: starci-fe-story-fix-block-apply
description: >
  GIAI ĐOẠN 2 (apply) của lane sửa render 1 BLOCK story. Nhận plan ĐÃ DUYỆT từ
  `starci-fe-story-fix-block-plan` → **dựng primitives/blocks THIẾU đã chốt TRƯỚC** (gốc rễ trước) → **apply fix
  THẬT** vào component + story local trong `.storybook` (storybook-driven → sửa .tsx local hợp lệ) → **render ĐỦ
  states theo cây `variant / scenario(=shape) / state`, mỗi state 1 leaf** (neo `ContinueCard/Hero/{Progress,No progress}`) → tsc/eslint → báo thầy soi.
  Code chạy **Sonnet 5** (spec khó do Opus viết trước ở `-plan`, Sonnet code). Dùng khi thầy gõ
  `/starci-fe-story-fix-block-apply <block>` sau khi đã duyệt plan, "apply fix block <X>", "vẽ đủ states cho <X>".
  CHỈ chạy khi có plan duyệt — chưa có plan thì route về `-plan` trước. KHÔNG phải layout/overlay (dùng
  `-layout-apply`/`-overlay-apply`).
---

# /starci-fe-story-fix-block-apply — dựng primitive thiếu → apply plan → render states

Vai: **APPLY**. Thực thi plan ĐÃ DUYỆT thành code + story THẬT (story-local `.storybook`).

> **MODEL:** code chạy **Sonnet 5**. Build lớn/đụng API → Opus viết impl-spec kĩ (ở `-plan`/mở đầu) rồi Sonnet code.
> **Nền:** [`verify-empirically`](../../discipline/verify-empirically.md) · [`safe-bulk-edit`](../../discipline/safe-bulk-edit.md) · `three-layer-sync`.

## 🛡️ Chống hallucination (LUÔN — mọi step)
- **Đọc file THẬT + grep trước khi sửa** — đối chiếu import/JSX thật, không đoán tên/props.
- **Chỉ làm cái plan đã CHỐT.** Phát sinh hình/element mới ngoài plan → **STOP, quay lại `-plan`** (không tự sáng tác).
- **Không bịa:** state theo consumer logic thật; anatomy mỗi leaf theo JSX THẬT của leaf đó.
- **Gate CỨNG:** `tsc --noEmit` + `eslint` phải XANH mới coi là xong.

## Điều kiện vào (gate)
Có **plan duyệt** (`$FE_SOURCE/.artifacts/plans/story-fix-<block>.md`) chứa **phương án đã chốt** cho mỗi primitive/block thiếu + cho fix block (thầy chọn từ 3–5 widget). Thiếu chốt → **STOP, route `-plan`**.
`$FE_SOURCE` = `.artifacts/config.json` (nay `C:\Repositories\starci-academy`, mtp). Sửa ở **story-local `.storybook`**; sync về `src` là bước SAU (không trong lượt này).

## Các bước — chạy tuần tự, MỞ file bước để lấy chi tiết
1. **S1 — Dựng primitive/block THIẾU** → [`s1-build-missing.md`](s1-build-missing.md) · gốc rễ TRƯỚC, reuse không đẻ trùng.
2. **S2 — Apply fix vào block** → [`s2-apply-fix.md`](s2-apply-fix.md) · compose · §4 · §2d · spacing.
3. **S3 — Render states** → [`s3-render-states.md`](s3-render-states.md) · cây `variant/scenario/state`, anatomy-đúng-leaf, base+delta.
4. **S4 — Verify + bàn giao** → [`s4-verify.md`](s4-verify.md) · tsc/eslint XANH → báo thầy soi.

## Ràng
- Chỉ làm cái đã chốt; **dựng primitive TRƯỚC block**. Sửa component PHẢI update story cùng lượt (three-layer-sync).
- KHÔNG đụng `.storybook/preview.tsx` / `main.ts`. Skeleton KHÔNG sweep; error/empty render TRONG khung card.
- Liên quan: `starci-fe-story-fix-block-plan` (ra plan) · `.claude/fe/principles/INDEX.md` (thước).
