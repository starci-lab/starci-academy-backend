# Membership, gói tải đề và thanh toán

> Business identity: `miamia/membership-payments@f1a2dcfee6c5e0b2cbbdc5a7855362040b4954c9cdbedfb58f3759d31d910966`
>
> Source heads: `fe@775bc711bafd`, `be@9dc84d7278ab`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Khách đọc catalog giá do server sở hữu; thành viên chọn membership hoặc gói tải đề, nhận checkout URL và chỉ được cấp quyền sau khi transaction được provider xác nhận.

**Primary actor.** Khách xem giá hoặc thành viên mua quyền

**Primary outcome.** Checkout transaction được tạo

**Never does.** Course-cart checkout

## Invariants

- `BR-01` — Pricing catalog public do server trả membership price/entitlements và exam-download packages.
- `BR-02` — Purchase membership chỉ tạo checkout details; quyền membership được cấp khi reconciliation xác nhận paid.
- `BR-03` — Giao dịch paid được settle idempotent; unpaid/expired không cấp membership hoặc download entitlement.

## Primary flow

```text
pending → ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `pricing` | `/[lang]/pricing` | So sánh membership và gói tải đề bằng dữ liệu server-owned. | [surface](surfaces/pricing.md) |
| `payment-return` | `provider-return-url (không có page chuyên biệt trong FE current head)` | Diễn giải pending/succeeded/unpaid từ transaction thay vì tự suy luận theo redirect. | [surface](surfaces/payment-return.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `pricingCatalog` | backend | none | membership offer, exam download packages |
| `purchaseMembership` | backend | membership request, authenticated customer | checkoutUrl, referenceId, transactionId, amount, checkoutFields |
| `reconcile transaction poll` | backend | transaction id, provider status | Succeeded/Unpaid/Pending, membership or entitlement grant |

## Explicit unknowns

- `payment-return-route` — Route FE nào sở hữu payment-return status cho membership và exam download? Impact: Business surface giữ routePattern mô tả provider-return vì current FE không có page chuyên biệt; design không được tự chọn route.
- `active-offer-values` — Giá và entitlement production hiện tại là gì tại runtime? Impact: Không ghi số đại diện vào prototype; phải render dữ liệu pricingCatalog thật.

## LOADS

| Need | Read |
|---|---|
| Scope, terminology and exclusions | [overview.md](overview.md) |
| Actor permissions and ownership | [actors.md](actors.md) |
| One user journey | `flows/<flow-id>.md` |
| One renderable screen | `surfaces/<surface-id>.md` |
| Business invariants | [rules.md](rules.md) |
| State transitions | [states.md](states.md) |
| Entities, inputs, outputs and failures | [contracts.md](contracts.md) |
| Completion and regression proof | [acceptance.md](acceptance.md) |
| Machine rendering/query | [model.json](model.json) |
| Exact source provenance | [evidence.json](evidence.json) |

## Context rule

Do not load every module by default. `CONTEXT.md` plus the one flow or surface being changed is the normal prompt. `model.json` is authoritative for machines; Markdown files are generated projections. Unknowns remain unknown until routed source or an explicit owner decision resolves them.
