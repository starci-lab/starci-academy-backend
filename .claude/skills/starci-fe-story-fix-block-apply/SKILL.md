---
name: starci-fe-story-fix-block-apply
description: >
  GIAI ĐOẠN 2 (apply) của lane sửa render 1 BLOCK story. Nhận plan ĐÃ DUYỆT từ
  `starci-fe-story-fix-block-plan` → **apply fix THẬT** vào component + story local trong `.storybook`
  (storybook-driven → sửa .tsx local hợp lệ) → **render ĐỦ mọi state, mỗi phase 1 `<Label>`** (async-lifecycle
  như `ContinueCard/Hero`) → tsc/eslint → báo thầy soi. Dùng khi thầy gõ `/starci-fe-story-fix-block-apply
  <block>` sau khi đã duyệt plan, "apply fix block <X>", "vẽ đủ states cho <X>". CHỈ chạy khi có plan duyệt —
  chưa có plan thì route về `-plan` trước. KHÔNG phải layout/overlay (dùng `-layout-apply`/`-overlay-apply`).
---

# /starci-fe-story-fix-block-apply — apply plan đã duyệt + vẽ đủ states

> **Nền luôn-bật:** [`discipline/verify-empirically.md`](../../discipline/verify-empirically.md) (tsc/eslint là gate; render đẹp thầy soi mắt) · [`safe-bulk-edit`](../../discipline/safe-bulk-edit.md) (đụng ≥2 render-site → grep hết trước) · `three-layer-sync` (sửa component PHẢI update story cùng lượt).

## Điều kiện vào
CHỈ chạy khi có **plan đã duyệt** (`$FE_SOURCE/.artifacts/plans/story-fix-<block>.md` + thầy OK). Không có → **STOP, route `-plan`**. Không tự nghĩ fix mới ngoài plan (fix mới = quay lại plan).

## B3 — Apply fix vào block (component + story local)
- Sửa THẬT trong `$FE_SOURCE/.storybook/stories/blocks/**` — component `.tsx` local + story. (Storybook-driven: component sống local trong `.storybook`, sửa hợp lệ; sync về `src` là bước sau, KHÔNG trong lượt này.)
- Chỉ đổi theo plan duyệt: class/token/prop đã chốt (vd hạ check về `text-muted`, bỏ `text-align:center`, đổi chip→muted text). `diagnose-before-fix`: đụng nhiều layout branch (grid/line) → grep hết, sửa cả loạt.
- Compose primitive thay vì vẽ tay (đúng principle: dùng `CrossListCard`/`PriceTag`… không hand-roll).
- ⭐ **Anatomy = KIỂM KÊ ĐẦY ĐỦ (U1, thầy chốt 2026-07-22):** `blockShell` phải liệt kê **MỌI** part block dựng nên — KHÔNG kể tuỳ tiện. Mỗi part gắn `tier: "block"|"primitive"` (block cấu tạo từ block CON + primitive: vd `CrossListCard`/`PriceTag` = block, `Button`/`Typography`/`Chip`/cover-media = primitive). Part **chỉ ở 1 state** (Skeleton) → gắn `state: "Đang tải"`, KHÔNG kể như thành phần chung. Đối chiếu import + JSX thật để không sót (vd quên 2 Button, cover).

## B4 — Render ĐỦ states = NESTED FOLDER (chuẩn C, thầy chốt 2026-07-22)
Mỗi state = **1 LEAF riêng** trong folder theo KIND — KHÔNG stack nhiều state + `<Label>` trên 1 canvas (bản cũ). Neo mẫu: `ContinueCard/{Item,Hero}`.
- **Title nest theo kind:** `title: "Block/<cat>/<Component>/<Kind>"` (vd `.../ContinueCard/Hero`). **1 file = 1 title** → mỗi kind 1 file `<Component>.<Kind>.stories.tsx`. (Component nhiều kind → nhiều file; chúng tự merge dưới `<Component>` trong cây.)
- **Mỗi state = 1 `export const` + `name:` = nhãn phase** (vd `name: "Đang tải · có tiến độ"`). **Tên leaf CHÍNH LÀ nhãn** → KHÔNG dùng `<Label>` inline nữa.
- **1 state = 1 canvas** (chỉ card/skeleton/error đó), `layout:"fullscreen"`. Content state → `blockShell(<div className="w-*">…</div>, ANATOMY)` (blockShell tự thêm `p-8` + anatomy hover). Skeleton/error (SectionCard-based, KHÔNG phải block) → render plain + tự `p-8`.
- **Đối chiếu LOGIC consumer thật** (AsyncContent/loader) — state CÓ THẬT, đừng bịa (empty CHỈ khi consumer có nhánh empty; ContinueCard không có empty).
- Data-backed đủ: **content variants** (mỗi kind/nhánh) + **1 skeleton mỗi KIND** + **error trong card** ("mạng rớt").
- ⭐ **Skeleton = 1 per KIND, KHÔNG per content-variant (thầy chốt 2026-07-22):** skeleton gen theo NGUYÊN TẮC (mirror layout kind, y chang, KHÔNG accent-sweep) → 1 leaf `Đang tải` đủ. Đừng đẻ `Đang tải · <mỗi variant>` (vd no-progress vs có-progress) = duplicate vô ích; content-variant chỉ khác prop, skeleton không cần nhân theo.
- ⭐ **Nhiều variant → 1 BASE scenario + spread delta ("nội suy từ gốc", thầy chốt 2026-07-22):** định nghĩa `<kind>Base` (props CHUNG) rồi mỗi leaf = `{ ...base, <delta> }` / `<Comp {...base} deltaProp />`. Delta NHỎ → hiện rõ CÁI GÌ đổi (vd `NoProgress` = `heroBase` **bỏ `value`** → ProgressMeter tự không render; `Enrolled` = `discountedCourse` **+ `isEnrolled`**). Dùng CHUNG 1 scenario để cô lập biến (không đổi kịch bản mỗi leaf → che mất delta). Fixtures data-heavy → tách file `.mocks.ts` (neo: `CourseCard.mocks.ts`). Variant là **kịch bản KHÁC hẳn thật** (vd Free = không giá) → để riêng, đừng ép derive.

## Verify + bàn giao
- `npx tsc --noEmit` + `npx eslint <file sửa>` ở `$FE_SOURCE`. KHÔNG tự drive browser verify (Storybook :6006 HMR tự áp — treo pane).
- Reconcile 3 lớp: component sửa → story khớp (UI-ref) → principle vẫn đúng. Báo thầy **refresh soi mắt** + tóm fix đã apply + states đã thêm.

## Ràng (STRICT)
- KHÔNG apply khi chưa có plan duyệt. KHÔNG mở rộng ngoài plan (phát sinh → ghi plan mới).
- Sửa component PHẢI update story cùng lượt (three-layer-sync) — không để story lag.
- KHÔNG đụng `.storybook/preview.tsx` / `main.ts`.
- Skeleton KHÔNG accent-sweep; error/empty render TRONG khung card, không ngoài.

## Liên quan
- `starci-fe-story-fix-block-plan` — giai đoạn 1 (ra plan). · `.claude/fe/principles.md` — thước.
