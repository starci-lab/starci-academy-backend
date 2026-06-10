# Fullstack Personal Project V2 — Roadmap 20 Milestone (để thầy duyệt)

> Capstone = build một app ecommerce (deploy được). **20 milestone / 58 task** (thiết kế bởi workflow `fullstack-20-milestone-roadmap`).
>
> **CHỐT 2026-06-10: Fullstack BUỘC CÓ FE — backend + frontend đều REQUIRED.** Mỗi task chấm 0-100 (outcome 30 / approach 70, yes/no + critical); milestone = trung bình weighted. Chấm = **functionality-in-code** (grader đọc source, không render/screenshot); README text-only; screenshot optional không chấm.
> Backend: chọn 1/4 lang (TS/Java/C#/Go) = `4lang`. FE: React+Next+HeroUI v3 mono (navbar chỉ ghi "App", không logo) = `agnostic`. Tất cả ● required.
> Phase: M1–5 BE cơ bản · M6–10 FE · **M11–17 nâng cao (BE+FE xen kẽ)** · M18–20 production+testing+deploy.

## Phase 1 — Backend cơ bản (M1–5) · tất cả ● required, 4lang
| M | Milestone | Tasks |
|---|---|---|
| 1 | Project Initialization | ● project-setup-and-structure (`/health` 200) |
| 2 | Environment Config & Logging | ● typed-configuration-layer · ● structured-json-logging-with-request-id |
| 3 | PostgreSQL Integration | ● pooled-connection-from-config · ● products-table-migration · ● health-db-readiness-probe |
| 4 | Auth: Register & Login | ● user-entity-with-password-hashing · ● POST /auth/register · ● POST /auth/login (JWT) |
| 5 | Refresh Token & RBAC | ● refresh-token-rotation · ● POST /auth/logout · ● rbac-guards-and-roles |

## Phase 2 — Frontend (M6–10) · ⚪ **TẤT CẢ OPTIONAL**, agnostic + HeroUI mono
| M | Milestone | Tasks (⚪ optional) | Widget |
|---|---|---|---|
| 6 | FE Setup — HeroUI v3 + Theme | heroui-tailwind-provider-setup · app-shell-navbar-layout · dark-mode-toggle | app-shell |
| 7 | Auth UI — Login & Register | login-form-rhf-zod · register-form-rhf-zod · route-guard-middleware | auth |
| 8 | Storefront — List/Filter/Detail | product-list-tanstack · filters-pagination-url-state · product-detail-rsc-suspense · image-lazy-loading | storefront |
| 9 | Cart & Checkout | cart-client-state-zustand · add-to-cart-button · checkout-form · order-confirmation-page | cart/checkout |
| 10 | UI Polish — a11y/i18n/perf | toast-dialog · keyboard-aria · i18n-locale · perf-memo-codesplit | app-shell |

## Phase 3 — Backend nâng cao + UI xen kẽ (M11–15)
| M | Milestone | Backend ● (4lang) | UI ⚪ optional (agnostic) |
|---|---|---|---|
| 11 | Catalog API | ● catalog-pagination · ● details-caching · ● product-entity-seeding | — |
| 12 | Image Upload & Storage | ● product-image-upload | ⚪ image-upload-ui-heroui |
| 13 | Cart API & Sync | ● cart-management-api | ⚪ cart-client-sync (guest merge) |
| 14 | Order Creation & Inventory | ● order-creation-transaction · ● inventory-stock-deduction | ⚪ checkout-to-order-ui |
| 15 | Order History & Orders UI | ● order-history-api | ⚪ orders-list-detail-ui |

## Phase 4 — Async/Ops/Deploy (M16–20)
| M | Milestone | Backend ● (4lang) | UI ⚪ optional |
|---|---|---|---|
| 16 | Background Jobs & Notifications | ● background-order-processing (BullMQ) · ● order-confirmation-email-sms | ⚪ order-processing-status-ui |
| 17 | Realtime Order Status (WebSocket) | ● realtime-order-status-websocket | ⚪ realtime-orders-detail-ui |
| 18 | Production Readiness | ● observability-logs-tracing-errors · ● security-end-to-end | ⚪ error-ui-toast-boundary |
| 19 | Testing Strategy | ● unit-e2e-testing | ⚪ frontend-functional-test-note |
| 20 | Deployment & Capstone (VPS) | ● dockerize · ● ci-cd-pipeline · ● vps-nginx-https (DO+certbot) · ● live-deployment | ⚪ end-to-end-integration · ⚪ capstone-demo |

## Tổng kết
- **Required (core)**: ~38 task backend 4lang (API + auth + orders + jobs + realtime + observability + security + testing + deploy).
- **Optional (UI)**: ~20 task FE agnostic (M6–10 toàn bộ + UI xen kẽ M12–20). Học viên làm UI để hoàn thiện app nhưng **không bắt buộc để pass capstone**.
- Mọi outcomeIntent đã viết theo **functionality-in-code** (đọc code verify: endpoint shape/status, guard, handler, transaction, idempotency, event publish/consume...). Chi tiết outcome/approach từng task trong output workflow.

## Cần thầy chốt
1. **Khung 20 milestone trên** — ổn chưa?
2. **UI optional** đánh dấu vậy đúng ý chưa (M6–10 + UI xen kẽ = optional; backend = required)?
3. Gật khung → workflow thứ 2 **viết content V2 từng task** (en/vi, gate). Backend trước (required), UI sau (optional).
