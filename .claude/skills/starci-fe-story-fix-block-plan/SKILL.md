---
name: starci-fe-story-fix-block-plan
description: >
  GIAI ĐOẠN 1 (plan, read-only) của lane sửa render 1 BLOCK story (`Block/*` — Cards, Feed, Commerce,
  Grading, Learn, Notifications…). Đọc principle → audit story qua MẮT (browser) → **LIỆT KÊ primitives/blocks
  còn THIẾU** (rule: 1 block = tập hợp primitives/blocks) → **mỗi cái thiếu VÀ mỗi cách-fix đều render 3–5
  visual_widget cho thầy CHỌN** (nói rõ lý do, không tự chốt 1 hình) → xuất plan → **STOP cho thầy duyệt**.
  KHÔNG sửa code. Brainstorm chạy **Opus (effort high)**. Đối tác: `starci-fe-story-fix-block-apply` (giai đoạn 2
  apply plan đã duyệt). Dùng khi thầy gõ `/starci-fe-story-fix-block-plan <story|họ>` (vd `CourseCard`, `cards`),
  "plan sửa block <X>", "phân tích cách fix render block <X>". KHÔNG phải audit-toàn-bộ (đó là
  `starci-fe-story-audit`); đây là 1 block, ra plan fix cụ thể. KHÔNG phải layout/overlay (dùng skill
  `-layout-plan`/`-overlay-plan`).
---

# /starci-fe-story-fix-block-plan — audit 1 block → liệt kê thiếu → 3–5 widget/cái → thầy duyệt

Vai: **PLAN (read-only)**. Ra *cách fix + primitive cần thêm* để `-apply` thực thi. Plan sai → apply sai theo.

> **MODEL:** brainstorm chạy **Opus, effort high** (session khác model → đổi trước).
> **Nền:** [`verify-empirically`](../../discipline/verify-empirically.md) · [`diagnose-before-fix`](../../discipline/diagnose-before-fix.md) · `ground-in-source`.

## 🛡️ Chống hallucination (LUÔN — mọi step)
- **Đọc/grep file THẬT trước khi khẳng định** — không nhớ tên prop/component, không đoán; neo `file:line`.
- **Màu + phân lớp = VISUAL → NHÌN** render (:6006) hoặc **ĐO DOM** (computed style). CẤM chấm bằng đọc class.
- **Không bịa:** state khớp logic consumer thật; **anatomy = ĐÚNG cây DOM thật của LEAF** (mọi part render có mặt — kể cả cấu trúc `AsyncContent`/wrapper — nesting khớp DOM, dùng primitive THẬT không stub inline; không sót/dư/curate); option widget KHÁC nhau thật.
- **Không tự chốt** — mọi lựa chọn để THẦY quyết. Không có luật principle phủ → ghi *đề xuất luật mới*, KHÔNG tự chế.

## Luật nền (STRICT)
1. **1 block = tập hợp primitives/blocks.** Cần element CHƯA CÓ → phải LIỆT KÊ (S3), không hand-roll ngầm.
2. **block = chức năng** (ContinueCard, CourseCard) · **primitive = gốc rễ generic** (StatusChip, MetaRow, Button).
3. **Mọi đề xuất = 3–5 widget cho thầy CHỌN** — áp cho CẢ primitive thiếu LẪN cách-fix. Không tự chốt 1 hình.

## Các bước — chạy tuần tự, MỞ file bước để lấy chi tiết
1. **S1 — Ground** → [`s1-ground.md`](s1-ground.md) · đọc principle + component/story + spacing (source-first).
2. **S2 — Audit** → [`s2-audit.md`](s2-audit.md) · NHÌN/ĐO 7 chiều + matrix `variant/scenario/state`.
3. **S3 — Liệt kê THIẾU** → [`s3-list-missing.md`](s3-list-missing.md) · grep kho → primitives/blocks còn thiếu.
4. **S4 — 3–5 widget/cái** → [`s4-widgets.md`](s4-widgets.md) · brainstorm → render → thầy chọn.
5. **S5 — Xuất plan + STOP** → [`s5-output.md`](s5-output.md) · ghi `.artifacts/plans/` + cái đã chọn.

## Ràng
- **Read-only** (chỉ đọc + widget + ghi `.artifacts`). 1 block/lượt (họ lớn → `starci-fe-story-audit` khoanh trước).
- Liên quan: `starci-fe-story-fix-block-apply` (thực thi) · `starci-fe-story-audit` (full-scan) · `.claude/fe/principles.md` (SSOT thước).
