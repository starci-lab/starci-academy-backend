<!-- starci-workflow: v2 -->

## plan r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Database | Primary PostgreSQL; E2E reads wallet payment row through the real application transaction. |
| Repo / branch | D:\Repositories\nivo-backend @ `main` (`6d4e68322bab900cfef17029dcc3a9fabd40a420`) |
| Purpose | Giữ và kiểm tra `gateway` qua global ValidationPipe để `createWalletTopUpPayLink` định tuyến đúng PayOS/SePay. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\wallet-top-up-gateway-validation.md |
| Language | vi |
| Phase | plan |
| Touching | Chỉ D:\Repositories\starci-academy-backend\.workflows\feature\nivo\wallet-top-up-gateway-validation.md; không ghi product source trong Plan. |

### SCHEMA AND SIBLING EVIDENCE

Unfiltered live schema trả 113 mutation, gồm `createWalletTopUpPayLink` -> `CreateWalletTopUpPayLinkResponse`; không thêm cửa mới. Input hiện có validator cho `amountVnd`, `returnUrl`, `cancelUrl` nhưng `gateway` chỉ có `@Field`. Với global ValidationPipe `whitelist`, field không mang class-validator metadata bị loại trước service, nên switch nhận `undefined` và ném unsupported gateway. Sibling `CreateInvoicePayLinkInput.gateway` có cùng hình dạng và được ghi cảnh báo, nhưng revision này chỉ sửa wallet top-up theo yêu cầu hiện tại.

### PROPOSED CAPABILITY

Revision đề xuất: `nivo-wallet-top-up-gateway-validation-r1`.

- Thêm `@IsEnum(InvoicePaymentGateway)` cho `CreateWalletTopUpPayLinkInput.gateway`.
- Twin dùng chính ValidationPipe production options để chứng minh PayOS và SePay được giữ, giá trị ngoài enum bị từ chối, field thiếu bị từ chối.
- E2E vào qua GraphQL thật: anonymous bị guard chặn; authenticated PayOS/SePay đến đúng external provider double; invalid enum bị GraphQL/validation chặn trước provider; payment/wallet state không bị ghi ở refusal.
- Live call dùng test account hiện tại và gateway cấu hình; không ghi credential hoặc tạo khoản thanh toán thật ngoài môi trường dev đã phê duyệt.

### PROPOSED FILE TREE

| Tree | Details | Shape evidence |
|---|---|---|
| `D:\Repositories\nivo-backend\src\features\core\api\core\graphql\mutations\wallet\create-wallet-top-up-pay-link\graphql-types\input.ts` | modified — add enum validation metadata. | Existing input and class-validator family. |
| `D:\Repositories\nivo-backend\src\features\core\api\core\graphql\mutations\wallet\create-wallet-top-up-pay-link\graphql-types\input.spec.ts` | added — ValidationPipe twin. | Input-level boundary where the defect occurs. |
| `D:\Repositories\nivo-backend\src\tests\e2e\nivo\wallet-top-up-pay-link.e2e-spec.ts` | added — auth/routing/refusal flow through GraphQL. | Existing Nivo payment E2E family. |

### TEST MATRIX

| Case | Expected proof |
|---|---|
| PayOS enum through whitelist | Field remains `PayOs`; PayOS provider receives one request. |
| SePay enum through whitelist | Field remains `Sepay`; SePay provider receives one request. |
| Gateway omitted | Validation fails before service/provider/database write. |
| Value outside enum | GraphQL or ValidationPipe rejects; no provider call. |
| Anonymous caller | Auth guard rejects; no payment row. |
| Invalid amount/URL | Existing validators still reject; gateway fix does not weaken them. |
| Authenticated valid request | Response has selected gateway/pay-link identity and corresponding pending payment state. |
| Live call | Test account reaches configured dev gateway without `unsupported gateway undefined`. |

### OUTPUTS

| Concept | Result |
|---|---|
| Wallet gateway validation brief | `nivo-wallet-top-up-gateway-validation-r1`: preserve and validate enum through whitelist. |
| Transport boundary | Existing GraphQL mutation remains the only door; no service default hides missing input. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\wallet-top-up-gateway-validation.md` | added — defect evidence, exact repair tree and test matrix. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Matching invoice DTO defect | Recommended: keep r1 wallet-only, then route `CreateInvoicePayLinkInput.gateway` as a linked bounded repair after wallet proof. Alternative: widen this revision to both DTOs before Review. |

### WARNINGS

| Warning | Impact |
|---|---|
| `CreateInvoicePayLinkInput.gateway` has the same missing validator metadata. | Invoice pay-link can fail by the same whitelist mechanism; wallet-only Apply does not claim it fixed. |
| A live gateway call can create an external pending payment link. | E2E mocks only the external SDK; live proof must use the approved dev-price path and record no secret. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Default missing gateway inside service | Validate and preserve the caller's explicit enum | A default would hide the transport defect and may charge through the wrong provider. |

### OWED

| Owed | Cleared by |
|---|---|
| Review approval | `$starci-be-feature-review` freezes wallet-only versus both matching DTOs. |
| Apply/live proof | `$starci-be-feature-apply`, focused twin, GraphQL E2E and live dev call. |

## review r1.1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\starci-academy-backend |
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | nivo |
| Database | Primary PostgreSQL payment/wallet rows. |
| Repo / branch | D:\Repositories\nivo-backend @ `main` (`6d4e68322bab900cfef17029dcc3a9fabd40a420`) |
| Purpose | Challenge whether wallet-only repair clears the actual AgentOS purchase/UI path. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\feature\nivo\wallet-top-up-gateway-validation.md |
| Language | vi |
| Phase | review |
| Touching | Chỉ workflow này; proposed widened production boundary waits for explicit approval. |

Candidate revision: `nivo-payment-gateway-input-validation-r1.1`.

Approved revision: `nivo-payment-gateway-input-validation-r1.1` — owner approved all three r1.1 revisions with “ok” on 2026-08-15, including the widened wallet + invoice boundary.

### REVIEW FINDINGS

| Finding | Revision |
|---|---|
| Wallet-only clears top-up but AgentOS catalog checkout uses `createInvoicePayLink`. | Widen to both matching input DTOs in one transport repair. |
| Both fields have GraphQL enum metadata but no class-validator metadata. | Add `@IsEnum(InvoicePaymentGateway)` symmetrically; no service default. |
| Separate E2E files would duplicate app/provider setup. | One `payment-gateway-input-validation.e2e-spec.ts` covers both production mutations, auth and provider refusal. |

### REVISED FILE TREE

| Tree | Details |
|---|---|
| `D:\Repositories\nivo-backend\src\features\core\api\core\graphql\mutations\wallet\create-wallet-top-up-pay-link\graphql-types\input.ts` | modified — enum validation. |
| `D:\Repositories\nivo-backend\src\features\core\api\core\graphql\mutations\wallet\create-wallet-top-up-pay-link\graphql-types\input.spec.ts` | added — production ValidationPipe twin. |
| `D:\Repositories\nivo-backend\src\features\core\api\core\graphql\mutations\invoices\create-invoice-pay-link\graphql-types\input.ts` | modified — matching enum validation. |
| `D:\Repositories\nivo-backend\src\features\core\api\core\graphql\mutations\invoices\create-invoice-pay-link\graphql-types\input.spec.ts` | added — matching twin. |
| `D:\Repositories\nivo-backend\src\tests\e2e\nivo\payment-gateway-input-validation.e2e-spec.ts` | added — both GraphQL doors, both enum members, auth/refusal and durable-state proof. |

### REVISED TEST MATRIX

Both PayOS/SePay survive whitelist on both inputs; omitted/invalid gateway refuses before provider/write; anonymous caller refuses; wallet link creates only wallet-top-up pending payment; invoice link belongs to authenticated invoice owner and routes only selected provider; stranger invoice remains not-found/forbidden; existing amount/URL/invoice-status guards remain unchanged. Live proof uses one dev-price link only and does not settle it.

### OUTPUTS

| Concept | Result |
|---|---|
| Candidate revision | `nivo-payment-gateway-input-validation-r1.1` ready for explicit approval. |
| Scope correction | Both matching DTOs are fixed because the AgentOS purchase path uses invoice pay-link. |
| Behavior | Explicit gateway survives whitelist; no implicit provider default. |

### CHANGES

| Tree | Details |
|---|---|
| `D:\Repositories\starci-academy-backend\.workflows\feature\nivo\wallet-top-up-gateway-validation.md` | modified — widened candidate boundary and test matrix. |

### NEED APPROVALS

| Question | Options |
|---|---|
| Approve payment input revision | Recommended: approve widened `nivo-payment-gateway-input-validation-r1.1` for both wallet and invoice DTOs; wallet-only would leave AgentOS checkout broken. |

### WARNINGS

| Warning | Impact |
|---|---|
| Live proof creates one external pending dev-price payment link. | It is not paid/settled and no credential is recorded; skip live external call if gateway configuration is unavailable. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Wallet-only r1 | Symmetric wallet + invoice DTO repair | AgentOS purchase UI reaches invoice pay-link and would retain the same undefined gateway defect. |

### OWED

| Owed | Cleared by |
|---|---|
| Explicit approval | Owner approves `nivo-payment-gateway-input-validation-r1.1` exact five-file boundary. |
| Apply | Baseline commit, twin specs, GraphQL E2E and one live dev call. |

## apply

### CONTEXT

| Field | Value |
|---|---|
| Source | D:\Repositories\starci-academy-backend |
| Project | nivo |
| Frontend | D:\Repositories\nivo-fe |
| Backend | D:\Repositories\nivo-backend |
| App | nivo |
| Applied revision | `nivo-payment-gateway-input-validation-r1.1` |
| Baseline commit | `511e9bf` |
| Apply commit | `0ecdf00` |

### OUTPUTS

| Capability | Result |
|---|---|
| Wallet DTO | `gateway` now carries `@IsEnum(InvoicePaymentGateway)` through the production whitelist pipe. |
| Invoice DTO | Matching `createInvoicePayLink` input is fixed symmetrically; no provider default was introduced. |
| Deterministic proof | Input twins and GraphQL E2E cover both enum members, omission/invalid values, anonymous access, provider routing and refusal without writes. |
| Live checkout | Authenticated Nivo UI created AgentOS order `97ff54ba-efad-452e-883e-70903bce5694`; local wallet payment charged exactly `₫490.000` and activated fulfillment. |

### CHANGES

| Path | Change |
|---|---|
| `D:\Repositories\nivo-backend\src\features\core\api\core\graphql\mutations\wallet\create-wallet-top-up-pay-link\graphql-types\input.ts` | Added enum validation metadata. |
| `D:\Repositories\nivo-backend\src\features\core\api\core\graphql\mutations\wallet\create-wallet-top-up-pay-link\graphql-types\input.spec.ts` | Added whitelist/enum twin. |
| `D:\Repositories\nivo-backend\src\features\core\api\core\graphql\mutations\invoices\create-invoice-pay-link\graphql-types\input.ts` | Added matching enum validation metadata. |
| `D:\Repositories\nivo-backend\src\features\core\api\core\graphql\mutations\invoices\create-invoice-pay-link\graphql-types\input.spec.ts` | Added matching twin. |
| `D:\Repositories\nivo-backend\src\tests\e2e\nivo\payment-gateway-input-validation.e2e-spec.ts` | Added six-case GraphQL transport/provider/durable-state proof. |

### NEED APPROVALS

| Item | State |
|---|---|
| External live gateway charge | None requested; the accepted live product path used approved local test-wallet credit. |

### WARNINGS

| Warning | Evidence / disposition |
|---|---|
| SePay credentials are unset in local runtime. | External live SePay link was not claimed; both provider branches are proven through GraphQL E2E doubles. |
| Wallet page contains older unpaid test invoices. | Only the newly created first unpaid invoice was paid; balance delta and new workspace identity match the tested order. |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Invent a default gateway | Validate the explicit enum | Prevents silent routing through the wrong provider. |
| Claim an external SePay live pass | Record unavailable credential honestly | No live provider credential exists in this runtime. |

### OWED

| Owed | State |
|---|---|
| Payment DTO source proof | Cleared: lint 0 errors; build PASS; focused twins PASS; GraphQL E2E 6/6 PASS. |
| External SePay live link | Deferred until dev credentials are configured; no product source error remains. |
