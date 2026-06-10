# Fullstack Personal Project V2 — Lộ trình chuẩn "StarCi Shop"

> Capstone Fullstack = build **một ecommerce app hoàn chỉnh, deploy được** ("StarCi Shop"), từng milestone là 1 increment để lại app chạy được, kết thúc bằng milestone capstone tích hợp + deploy + demo.
>
> Mọi content milestone/task hiện có = **REF**. Bản này là lộ trình CHUẨN để viết lại theo format criteria V2.
>
> Spec format: `docs/personal-project-v2-plan.md` §3 (đã cập nhật). Liên quan memory: [[personal-project-v2-plan]] [[fs-course-overview]].

## 0. Sản phẩm "StarCi Shop" — definition of done

App ecommerce đầy đủ: khách đăng ký/đăng nhập → duyệt sản phẩm (có ảnh) → thêm giỏ → checkout → tạo đơn (trừ kho trong transaction) → job nền xử lý → email/SMS xác nhận + realtime trạng thái → trang storefront (server-state, RSC, perf) → polish/a11y → observability/security/test → đóng gói deploy CI/CD → **tích hợp end-to-end + deploy live + demo**.

- **Backend**: học viên chọn **1 trong 4 ngôn ngữ** (TypeScript/Java/C#/Go) và làm xuyên suốt. Task backend = criteria per-lang (lang đã chọn).
- **Frontend**: React/Next.js (agnostic). Task FE = criteria agnostic (1 block `lang: agnostic`).
- **1 repo lớn dần**; mỗi task chấm trên trạng thái repo hiện tại.

## 1. Format criteria V2 (chốt) — áp cho MỌI task

```
task = title · description · type · weight · orderIndex · maxScore(=100) · verified
     · criterias
        └── ## N  (per lang: typescript/java/csharp/go  HOẶC  agnostic)
             ├── lang
             ├── body          ← đề bài ĐẦY ĐỦ: mục tiêu + bước + code mẫu + gotcha,
             │                    markdown bọc @starci/seperator, dùng :::muted callout
             ├── outcome        ← Σ = 30   (3 criterion × 10)
             │    └── #### M → body · score · critical
             └── approach       ← Σ = 70   (40 critical + 15 + 15)
                  └── #### M → body · score · critical
```

- **Bỏ hẳn `codeImplementations`** — code mẫu nằm trong `body`.
- **Σ điểm mỗi task = 100** (outcome 30 + approach 70). Yes/no: met→full, miss→0. `critical` miss → zero cả task.
- **outcome** = kết quả quan sát được (HTTP/JSON/state/edge-case), agnostic — body giống nhau cả 4 lang.
- **approach** = cách làm đọc-code-verify, khác nhau theo lang (backend); agnostic task thì approach cũng 1 block.
- Mỗi criterion `body` nêu **3 ý**: *kiểm gì / bằng chứng quan sát được / cái gì làm RỚT*.
- Backend task: 4 block lang (ts/java/csharp/go). FE/agnostic task: 1 block `agnostic`.
- `body` (đề bài) dùng callout `:::muted Mục tiêu :::`, `:::muted Các bước :::`, `:::muted Code mẫu :::`, `:::muted Gotcha :::`.

## 2. Lộ trình 11 milestone

> Cột **Lang**: `4-lang` = backend (ts/java/csharp/go) · `agnostic` = FE/integration.
> Mỗi task Σ=100. `type` ∈ design|techIntegrate|business.

### M0 — Project Initialization & Configuration  *(nền tảng backend chạy được)*
| # | task | type | lang | increment |
|---|---|---|---|---|
| 0 | project-initialization | techIntegrate | 4-lang | App backend boot, healthcheck `/health` 200 |
| 1 | environment-configuration | techIntegrate | 4-lang | Config tập trung từ env, fail-fast khi thiếu |
| 2 | structured-logging | techIntegrate | 4-lang | Log JSON có request-id |
| 3 | database-postgresql-integration | techIntegrate | 4-lang | Pool từ config + migration `products` + `/health/db` |

### M1 — Authentication & Authorization
| 0 | user-entity-design | techIntegrate | 4-lang | Bảng users (email unique, password hash) |
| 1 | jwt-register-login | business | 4-lang | `/auth/register` `/auth/login` trả JWT |
| 2 | refresh-token-logout | business | 4-lang | Refresh rotation + logout thu hồi |
| 3 | rbac-guards | techIntegrate | 4-lang | Route admin chặn role user (403) |

### M2 — Product Catalog *(+ file upload — lấp gap module 11)*
| 0 | product-entity-seeding | techIntegrate | 4-lang | Entity product + seed mock |
| 1 | catalog-api-pagination | business | 4-lang | `/products` phân trang + filter |
| 2 | product-details-caching | techIntegrate | 4-lang | `/products/:id` + cache |
| 3 | **product-image-upload** *(MỚI)* | techIntegrate | 4-lang | Upload ảnh sản phẩm (presigned/S3 hoặc disk), trả URL |

### M3 — Shopping Cart & Orders
| 0 | cart-management-api | techIntegrate | 4-lang | CRUD giỏ per-user |
| 1 | order-creation-transaction | business | 4-lang | Tạo order trong transaction |
| 2 | inventory-stock-deduction | business | 4-lang | Trừ kho an toàn (không âm/oversell) |
| 3 | order-history-api | techIntegrate | 4-lang | `/orders` lịch sử per-user |

### M4 — Async Workflows & Notifications
| 0 | background-order-processing | techIntegrate | 4-lang | Job nền xử lý order (queue) |
| 1 | order-confirmation-email-sms | techIntegrate | 4-lang | Gửi email/SMS xác nhận (provider/mock) |
| 2 | realtime-order-status | techIntegrate | 4-lang | WebSocket đẩy trạng thái order |

### M5 — Storefront: Browsing & Data Fetching *(FE)*
| 0 | server-state-tanstack-query | techIntegrate | agnostic | List sản phẩm qua TanStack Query |
| 1 | filters-pagination-url-state | techIntegrate | agnostic | Filter/paginate đồng bộ URL |
| 2 | product-pages-rsc-suspense | techIntegrate | agnostic | Trang chi tiết RSC + Suspense |
| 3 | frontend-performance | techIntegrate | agnostic | Tối ưu ảnh/memo/code-split |

### M6 — Checkout: Forms & Client State *(FE)*
| 0 | checkout-form-rhf-zod | techIntegrate | agnostic | Form checkout validate Zod |
| 1 | cart-client-state | techIntegrate | agnostic | State giỏ (Zustand/Jotai) persist |

### M7 — UI Polish & Accessibility *(FE)*
| 0 | ui-polish-toast-dialog-darkmode-i18n | techIntegrate | agnostic | Toast/dialog/dark mode/i18n |
| 1 | interaction-accessibility | techIntegrate | agnostic | Keyboard/focus/aria, dnd/cmdk |

### M8 — Production Readiness
| 0 | observability-logs-tracing-errors | techIntegrate | 4-lang | Structured log + trace + error report |
| 1 | security-end-to-end | techIntegrate | 4-lang | Helmet/CORS/throttle/validation |
| 2 | testing-strategy | techIntegrate | 4-lang | Unit + e2e cho luồng order |

### M9 — Deployment & DevOps
| 0 | dockerize-application | techIntegrate | 4-lang | Dockerfile multi-stage + compose |
| 1 | ci-cd-pipeline | techIntegrate | 4-lang | CI build/test/lint + CD |
| 2 | database-migration-feature-flags | techIntegrate | 4-lang | Migration on deploy + feature flag |

### M10 — Capstone: Integrate, Deploy & Demo *(MỚI — app hoàn chỉnh)*
| 0 | end-to-end-integration | business | agnostic | FE+BE nối đủ luồng mua hàng end-to-end |
| 1 | live-deployment | techIntegrate | agnostic | Deploy live (URL công khai) toàn stack |
| 2 | demo-and-acceptance | design | agnostic | README "cách chạy" + demo video/screenshot luồng đầy đủ |

**Tổng: 11 milestone / 35 task** (24 backend 4-lang + 11 agnostic).

## 3. Khác biệt vs roadmap cũ
1. **+task `product-image-upload`** (M2.3) — lấp gap file-upload (module 11).
2. **+milestone M10 capstone** (integrate + deploy + demo) — chốt "app hoàn chỉnh deploy được".
3. Mọi task **maxScore 10 → 100** + criteria V2 (outcome/approach, yes/no, critical), bỏ codeImplementations (gộp vào body).

## 4. Thứ tự thực thi (autonomous) — TRẠNG THÁI 2026-06-10
1. ✅ Roadmap chuẩn (file này).
2. ✅ Spec format chốt + **task GOLD** (M0.3 database, 4-lang) ra .mount = chuẩn vàng (gate PASS).
3. ✅ Nhân ra toàn bộ **36/36 task FS** viết V2 (fan-out agent, 11 milestone) — **gate 36/36 PASS** (verify độc lập).
4. ✅ Gate `scratch/gate-task-v2.mjs`: Σoutcome=30, Σapproach=70, tổng=100, ≥1 critical, ≥3 callout :::muted, mirror vi/en — pass hết.
5. ✅ Capstone M10 (milestone mới + 3 task agnostic, bằng-chứng-repo/URL).
6. ⏳ **CHƯA render được** — content V2 đã xong nhưng **parser/schema/grader CHƯA support format mới** (P1-P3). Bật seed bây giờ sẽ vỡ. Cần làm P1-P4 trước khi seed.

### Còn lại
- **P1 schema**: +cột outcomeCriteria/approachCriteria (hoặc parse lang-first → jsonb) + verified lên milestone_task; bỏ dùng milestone_task_criteria cũ.
- **P2 parser** `milestone-task.service.ts`: parse `# criterias` lang-first (## N lang → lang/body/outcome/approach → #### M → body/score/critical) → pivot sang jsonb grader dùng. Set verified, maxScore=100.
- **P3 grader**: nhánh V2 route theo task.verified, collect outcome+approach theo lang, yes/no + critical → 0, Σ=100.
- **P4 FE**: lang Tabs chọn ngôn ngữ cho task backend V2, body :::muted render, gửi lang khi submit.
- **THEN** bật `_seed.yaml` milestones FS `0-10` + sync CDN/ES → render.
- **SD course**: chưa làm (lần sau, 11 milestone tương tự).
- Content đã ghi đĩa `.mount/data` (repo StarCi-Academy/data, branch main) — **chưa commit** (chờ thầy).
