# Khám phá và mua khóa học

> Business identity: `miamia/course-marketplace@806dbd5d25423c2339cace8b53bac2b9f0c598ca5ef84347bfeae644eb739d8b`
>
> Source heads: `fe@775bc711bafd`, `be@9dc84d7278ab`
>
> Load this file first. Load only the modules named by the current task.

## Decision capsule

**Purpose.** Khách và thành viên duyệt danh mục, mở chi tiết, phân biệt khóa đã sở hữu với khóa để khám phá, đưa khóa vào giỏ và chuyển tới nhà cung cấp thanh toán cho đơn đang chờ xác nhận.

**Primary actor.** Khách hoặc người mua đã đăng nhập

**Primary outcome.** Khóa đã sở hữu không xuất hiện như món cần mua

**Never does.** Xác nhận thanh toán trước webhook

## Invariants

- `BR-01` — Danh mục tách khóa đã sở hữu khỏi danh sách khám phá và hỗ trợ tìm kiếm, phân trang cùng chế độ grid/line.
- `BR-02` — Checkout không tự ghi danh; người mua chỉ được chuyển tới checkoutUrl và phải chờ webhook xác nhận.

## Primary flow

```text
pending → pending → ready
```

## Surface map

| Surface | Route | Owns | Module |
|---|---|---|---|
| `course-catalog` | `/[lang]/courses` | Tìm khóa học và phân biệt nội dung đã sở hữu với nội dung có thể mua. | [surface](surfaces/course-catalog.md) |
| `course-detail` | `/[lang]/courses/[displayId]` | Giải thích khóa học, chương trình, giá và quyết định mua. | [surface](surfaces/course-detail.md) |
| `course-cart` | `/[lang]/cart` | Xem các dòng khóa, tổng giá server trả về và bắt đầu checkout. | [surface](surfaces/course-cart.md) |

## Data and operation map

| Operation | Owner | Input | Result |
|---|---|---|---|
| `courses` | frontend | filters, optional token | count, course rows |
| `coursesCheckout` | frontend | courseIds, paymentType, returnUrl, cancelUrl | checkoutUrl, referenceId, transactionId |

## Explicit unknowns

- `course-backend-contract` — Resolver current-head nào triển khai courses và coursesCheckout mà FE đang gọi? Impact: Các operation này chỉ được xác nhận ở FE và phải giữ strength partial cho tới khi BE route hiện tại chứng minh contract.
- `installment-provider` — Khi nào backend hỗ trợ lịch trả góp được surface mô tả? Impact: Không gửi installmentMonths hoặc hiển thị lịch thanh toán như khả năng đã hoạt động.

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
