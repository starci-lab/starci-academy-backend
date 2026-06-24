# Debts — Header / rhythm follow-ups (2026-06-24)

> Nợ kỹ thuật gom từ buổi chuẩn-hoá header + List/Accordion Card trang khóa học. Trả sau khi thầy duyệt. Repo FE: `C:\Repositories\starci-academy`.

## A. Viết `elements/header.md` (doc Page Header)
- Doc element Page Header: 4 slot (tabs/breadcrumb · title H3 · description body-sm muted · chips số liệu) + spacing (outer gap-3, title↔desc gap-2, **header→content gap-10** theo [[gap]]) + impl = block `PageHeader` + chips = block `HighlightChip`.
- (Lần ghi trước bị lỗi permission — ghi lại.)

## B. Learn meta chips → `HighlightChip`
- `learn/CourseContents` header meta đang là raw `<Chip>` với i18n gộp ("24 chương", "~31 giờ học") → đổi sang block `HighlightChip` (value + label tách) cho khớp landing.
- Cần thêm i18n label-only ("chương" / "giờ học" / "học viên") để tách khỏi value (số).

## C. Trích block `SurfaceListCard` (dọn nợ layering)
- `CoursePrerequisites` + `CourseValueProps` đang **inline class surface** ở FEATURE (vi phạm "style chỉ ở block"): `overflow-hidden rounded-3xl border border-default bg-surface` + row `px-4 py-4` + separator `after:... bg-surface-foreground/6 left-[3%] w-[94%] last:after:hidden`.
- → trích thành block `blocks/cards/SurfaceListCard` (props: `items` + render row + optional leading icon/tick). Feature chỉ ghép. Ref [[elements/card]] §3b List Card.

## D. Verify mắt + commit/push
- Soi `localhost:3000`: landing `/courses/<slug>` + learn `/courses/<slug>/learn/content` — header đồng bộ, Accordion/List Card, chip.
- Commit + push: FE (`starci-academy`) + BE rules docs (`elements/`, `layouts/`, `debts/`).

## E. Nắn lại gap theo thang MỚI (`0/2/3/6/8` + header→content `10`)
- Buổi trước trò set `gap-6` cho sections + header→grid (tưởng 8/10 off-scale). Thang mới ([[gap]]): **PageHeader → nội dung dưới = `gap-10`**, không phải gap-6.
- Rà `CourseDetail/index.tsx` (+ các trang dùng PageHeader): khoảng từ header xuống content = `gap-10`; giữa các section narrative xem lại 6 vs 8.
- `gap-4` interior pricing card (`CoursePricingRail`) ngoài thang → nắn 3 hoặc 6.

## F. PaymentModal — surface-in-surface inherit + Interactive List Card + modal p-4 (CHỐT 2026-06-24, CHƯA apply — session khác)
> Thầy chốt qua screenshot modal Thanh toán. CHƯA code (defer sang session `/starci-fe-ux-apply`). File: `C:\Repositories\starci-academy\src\components\modals\PaymentModal\index.tsx`.
1. **Order summary card = surface-in-surface → BORDER + INHERIT bg (bỏ veil).** L274 `rounded-2xl border border-default bg-white/5 px-4 py-3` → bỏ `bg-white/5` (trong suốt, ăn màu modal). Loyalty divider L305 `border-white/10` → `border-default`. **Đính chính [[surface-in-surface-inner-has-border]]:** thầy chốt MỚI = card-in-surface chỉ **border + inherit bg**, KHÔNG veil `bg-white/5`. (Cập nhật lại rule đó khi /merge.)
2. **"Thanh toán trong nước" (method group) → Interactive List Card.** Thay N `PressableCard` rời (gap-2) bằng **1 container** `overflow-hidden rounded-3xl border border-default bg-surface`; mỗi method = `<button>` row `relative flex w-full items-center gap-3 px-4 py-4 text-left outline-none transition-colors hover:bg-default focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60` + separator inset `after:absolute after:bottom-0 after:left-[3%] after:h-px after:w-[94%] after:bg-surface-foreground/6 after:content-[''] last:after:hidden`. = da List Card §3b NHƯNG hover từng row đổi nền `bg-default` (copy `.accordion--surface .accordion__trigger:hover`) + click được (giữ onPress/disabled/spinner). Giữ icon + name + desc + amount + arrow/spinner như cũ.
3. **Modal gutter p-6 → p-4 (global).** `globals.css` thêm `.modal__dialog { padding: 1rem !important; }` (pattern override trần + `!important` như `.switch__control`). Áp MỌI modal → đính chính [[modal-body-no-padding-override-heroui-idiom]] (gutter chuẩn giờ p-4, không p-6).
4. **Rules:** `elements/card.md` §3b thêm biến thể **List Card INTERACTIVE** (row `<button>` + hover `bg-default` + focus ring + disabled, khác §3b tĩnh) — dùng cho list lựa chọn bấm-được muốn nhìn như accordion card (vd payment methods).
- ✅ ĐÃ làm sẵn (copy fix, không defer): i18n `payment.noCardStored` "StarCi" → "StarCi Academy" (vi+en).

## Trạng thái code ĐÃ áp (chưa push, local `main` FE)
- Block `HighlightChip` + `PageHeader` (slot `meta`, outer gap-3).
- Landing `CourseHero` → PageHeader; `CourseTrustStats` → HighlightChip (ẩn stat=0).
- Learn `CourseContents` → PageHeader.
- Accordion Card (curriculum/FAQ frameless + surface + border); List Card (prereq/value-props); module row title-trái-ellipsis + chip-phải; xoá badge "Trả phí".
