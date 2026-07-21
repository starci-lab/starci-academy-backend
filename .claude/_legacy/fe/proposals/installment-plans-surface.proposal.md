# Proposal — "Kế hoạch trả góp của tôi" (My Installment Plans)

> Part 8 (cuối) của tính năng trả góp (`docs/installment-payment-plan.md`, plan `elegant-toasting-lake.md`). Thầy chốt trước: brainstorm layout TRƯỚC rồi mới dựng. Brainstorm qua `starci-fe-layout-brainstorm` → prototype `scratchpad/installment-plans-flow/index.html` (host :8081, 8080 bị chiếm) → thầy duyệt bằng "xúc" → build thẳng (không tách session).

## Route + shell
- Route mới `/[locale]/profile/settings/installments` (mirror `Sessions`/`Membership`).
- Shell: **centered `max-w-2xl`, không rail** (theo `page-shell-selection` câu 5 — 1 tác vụ tập trung, list ngắn không đáng rail). `PageHeader` + `SettingsBreadcrumb` + `AsyncContent` (loading skeleton mirror-layout / empty / error) + list `Card` (mirror `Sessions/index.tsx` — mỗi plan 1 `Card`, KHÔNG dùng `SurfaceListCard` vì mỗi plan là 1 bounded object có action riêng, không phải row đồng nhất).

## State matrix
| State | Render |
|---|---|
| Rỗng (không có plan nào) | `AsyncContent emptyContent` — "Bạn không có khoản trả góp nào" + CTA "Khám phá khóa học" → `/courses` (phễu, không ngõ cụt) |
| `Fixed`, `Active`/`Overdue` | Chip status semantic + `ProgressMeter` (đã trả N/M kỳ) + `monthlyAmountVnd` CỐ ĐỊNH + `nextDueAt` + nút "Trả kỳ này" (không sửa số tiền) |
| `FlexiblePool`, `Active`/`Overdue` | Chip status + "Còn nợ {remainingVnd}" + caption công thức minh bạch ("{minPaymentPercent}% số dư, tối thiểu {minPaymentFloorVnd}") + `TextField` số tiền (default = `minPaymentVnd`, chặn client-side không cho nhập dưới min) + nút "Trả" |
| `Locked`/`Defaulted` (bất kỳ planType) | Chip `danger` + CTA đổi copy "Thanh toán để mở khoá" + dòng phụ ghi rõ ngày quá hạn thật (không đếm-ngược giả) |
| Đang mutate | Nút hàng đó → `Spinner`, các nút khác disable (mirror `Sessions` `revokingId` pattern) |

Màu status: semantic (`success`/`warning`/`danger`), KHÔNG `accent` (đúng rule Chip cho status).

## Block briefs (element-aware)
- `PageHeader` + `SettingsBreadcrumb` (đã có, mirror `Sessions`).
- `AsyncContent` (`blocks/async`) — 4-state chuẩn.
- `Card`/`CardContent` (HeroUI) — 1 card/plan, KHÔNG card-in-card.
- `Chip` (HeroUI) — status, `color` semantic.
- `ProgressMeter` (`blocks/stats/ProgressMeter`) — CHỈ cho `Fixed` (`value=installmentsPaid, max=months`).
- `TextField`/`Input` (HeroUI) — số tiền `FlexiblePool`, `type="number"`, `onChange` clamp `>= minPaymentVnd`.
- `Button` + `Spinner` (HeroUI) — nút trả theo hàng, mirror `Sessions`' revoke button.
- Course chips: `Chip size="sm" variant="soft"` cho từng course trong `plan.courses`.

## Data — đã có sẵn (không cần BE mới)
- Query `myInstallmentPlans` (đã build Part 4 session này) — trả đủ field cho mọi state trên.
- Mutation `payNextInstallment` (đã có sẵn từ trước) — nhận `{ installmentPlanId, paymentType, amountVnd? }` (kiểm tra request type thật khi build — nếu `FlexiblePool` cần truyền `amountVnd` tuỳ chỉnh thì field đó phải tồn tại, nếu chưa có → đây là gap BE nhỏ cần vá khi apply).
- FE cần thêm: `query-my-installment-plans.ts` (+ types) và SWR hook `useQueryMyInstallmentPlansSwr`; `mutation-pay-next-installment.ts` (+ types) và SWR hook `useMutatePayNextInstallmentSwr`. Cả 2 mirror pattern `my-sessions`/`revoke-session`.
- i18n `installmentPlans.*` (vi+en): title, subtitle, empty, statusActive/Overdue/Locked/Completed, payThisCycle, pay, minPaymentFormula, remainingLabel, unlockCta, overdueSince.

## Files to touch (apply)
- BE: kiểm tra `payNextInstallment` request có field `amountVnd` optional cho FlexiblePool chưa — nếu chưa, thêm (nhỏ, không đổi contract Fixed).
- FE: `src/modules/api/graphql/queries/query-my-installment-plans.ts` + `types/my-installment-plans.ts`; `src/modules/api/graphql/mutations/mutation-pay-next-installment.ts` + `types/pay-next-installment.ts`; `src/hooks/swr/api/graphql/queries/useQueryMyInstallmentPlansSwr.ts`; `src/hooks/swr/api/graphql/mutations/useMutatePayNextInstallmentSwr.ts`; `src/components/features/profile/InstallmentPlans/index.tsx` (mới, mirror `Sessions`); `src/app/[locale]/profile/settings/installments/page.tsx` (mới); thêm entry nav vào `Settings` (danh sách link cài đặt) nếu có; `src/messages/{vi,en}.json` `installmentPlans.*`.

## Verify plan
- `tsc --noEmit` + `eslint` sạch file mới/sửa cả 2 repo.
- GraphQL introspection xác nhận field mutation mới (nếu vá BE) live trên :3001.
- Đọc lại: clamp amount client-side đúng (không cho < min), trạng thái Locked có CTA rõ ràng không ngõ cụt, mọi Chip màu semantic không accent.
- **CHƯA thể test tay browser thật** (preview headless không đăng nhập) — nhờ thầy soi lại sau khi build.

## Trạng thái
✅ Prototype duyệt ("xúc") → build thẳng ngay session này (skip PENDING riêng).

**Đã xong:**
- BE: vá `payNextInstallment` thêm `amountVnd?: number` optional (FlexiblePool only, validate `>= computeMinPaymentVnd`, reject cho Fixed) — `pay-next-installment/graphql-types/request.ts` + `pay-next-installment.handler.ts`. Live-verify qua GraphQL introspection (field `amountVnd` xuất hiện trên `PayNextInstallmentRequest`).
- FE client: `query-my-installment-plans.ts` + `types/my-installment-plans.ts`, `mutation-pay-next-installment.ts` + `types/pay-next-installment.ts`, `useQueryMyInstallmentPlansSwr`, `useMutatePayNextInstallmentSwr`.
- FE surface: `InstallmentPlans/index.tsx` (mirror `Sessions`) + route `profile/settings/installments/page.tsx` + `pathConfig().profile().installments()` + nav entry (`Settings/nav.tsx`, nhóm "content" cạnh membership) + i18n `installmentPlans.*` (vi+en) + `profileSettings.items.installments`.
- Verify: `tsc --noEmit` sạch TUYỆT ĐỐI (0 lỗi) toàn FE repo · eslint sạch mọi file mới/sửa · BE `tsc --noEmit -p tsconfig.build.json` xác nhận KHÔNG có lỗi mới (205 lỗi pre-existing y hệt trước, không file nào của installment xuất hiện trong list).

**CHƯA:** test tay browser thật — port 3000 (FE) đang bị 1 session Claude khác giữ khoá `.next/dev/lock` (`preview-tool-cross-repo-workspace-limitation`), không khởi động được server riêng cho session này. Giữ 🔨 IN-PROGRESS tới khi thầy tự soi qua browser thật hoặc phiên khác rảnh port.
