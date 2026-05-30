# Fullstack Mastery — Audit Concept-First (toàn khóa)

> File này để chủ nhiệm chốt kế hoạch rewrite. Survey 20 module, 79 lesson hiện tại. Nguồn: `.mount/data/courses/0-fullstack-mastery/modules/`. Quy chuẩn: `.mount/data/rules/super-audit.md`.

## 1. Model concept-first (tóm tắt)

Dạy **concept**, không dạy cú pháp/framework. NestJS / Next.js chỉ là **công cụ demo** minh họa concept; tên lesson + lời mở đầu phải có nghĩa kể cả với người không dùng framework đó. Mỗi lesson phân nhóm: **①** = concept quan sát được từ output/hành vi (agnostic, challenge chấm output, map được nhiều ngôn ngữ); **②** = idiom nội tại framework mà output không phản ánh (trung thực framework-bound, chỉ concept-mapping ngắn cho ngôn ngữ khác). 1 lesson ôm ≥2 concept tách biệt → tách; tên bám tool → reframe về concept.

**Lưu ý FE:** các module 4-8, 12-15 là frontend React/Next.js. Concept FE (server state, form state, client state, routing, RSC...) là ① quan sát được, nhưng **KHÔNG fan-out 4 ngôn ngữ** — React/Next là môi trường thực thi đặc thù, đối chiếu (nếu có) là Vue/Svelte/SwiftUI chứ không phải Go/C#/Java. Challenge FE chấm theo hành vi UI/output, không per-language backend.

---

## 2. Bảng audit per module

Ký hiệu: **①** concept agnostic · **②** idiom framework · **FE** frontend (không 4-lang) · effort tách = mức công viết lại.

### M0 — NestJS Core & Request Lifecycle  (3 → 5 lesson)
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| Thiết lập môi trường và nắm vững NestJS Core | **TÁCH**: (a) "Framework backend là gì? Module & cấu trúc" · (b) "Dependency Injection & IoC Container" | a=① · b=**②** | tách 1→2 (env-setup gộp vào (a)) |
| Vòng đời Request trong NestJS | **"Vòng đời request/response"** | ① | giữ (middleware+guard+pipe+interceptor = các mặt cùng 1 concept) |
| Cấu hình đa môi trường và logging chuẩn production | **TÁCH**: (a) "Cấu hình đa môi trường" · (b) "Logging chuẩn production" | ① · ① | tách 1→2 |
*Ghi chú: DI/IoC/Module là điểm ② hiếm của toàn khóa — viết trung thực "đây là idiom NestJS", đối chiếu .NET DI / Spring @Component / Go wire thủ công 1 đoạn ngắn.*  **Sau audit: 5 lesson.**

### M1 — Database Integration & Caching  (4 → 4)
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| SQL và NoSQL trong NestJS | "SQL vs NoSQL — chọn mô hình dữ liệu" | ① | giữ |
| Làm chủ PostgreSQL với TypeORM | "Quan hệ, index & truy vấn với SQL" (TypeORM = ví dụ) | ① | giữ |
| Lưu trữ NoSQL với MongoDB và Mongoose | "Mô hình document NoSQL" | ① | giữ |
| Tăng tốc hệ thống với bộ nhớ đệm Redis | "Caching: chiến lược & invalidation" | ① | giữ |
*Reframe nhẹ tên (bỏ tên tool khỏi title). Effort thấp.*

### M2 — REST API Design & Documentation  (4 → 4)
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| RESTful API và CRUD Best Practices | "Thiết kế REST API & CRUD" | ① | giữ |
| DTO và Validation trong NestJS | "Validation & contract đầu vào" | ① | giữ |
| Response thống nhất và Error Handling | "Response envelope & xử lý lỗi nhất quán" | ① | giữ |
| Swagger và API Documentation | "Tài liệu hóa API (OpenAPI)" | ① | giữ |

### M3 — Authentication & Authorization  (4 → 4)
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| Luồng xác thực JWT trong NestJS | "Xác thực bằng JWT" | ① | giữ |
| Chiến lược Refresh Token | "Refresh token & rotation" | ① | giữ |
| RBAC và Guards trong NestJS | "Phân quyền RBAC" (Guard = cơ chế NestJS chặn) | ① (Guard idiom ②) | giữ |
| OAuth2 Google Login | "OAuth2 / OIDC login" | ① | giữ |

### M4 — Server State (TanStack Query)  (4 → 4) · FE
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| useQuery và Vòng đời Cache | "Server state & vòng đời cache phía client" | ① FE | giữ |
| Mutations và Đồ thị Invalidation | "Mutation & invalidation cache" | ① FE | giữ |
| Optimistic Update với Rollback | "Optimistic update & rollback" | ① FE | giữ |
| Infinite Query và Cursor Pagination | "Infinite scroll & cursor pagination" | ① FE | giữ |
*Concept agnostic FE; đối chiếu (nếu cần) SWR/RTK Query, KHÔNG 4-lang.*

### M5 — Form Mastery (RHF + Zod)  (4 → 4) · FE
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| useForm và zodResolver | "Quản lý form state & schema validation" | ① FE | giữ |
| Async validation với debounce | "Async validation & debounce" | ① FE | giữ |
| Wizard nhiều bước với FormProvider | "Form nhiều bước (wizard)" | ① FE | giữ |
| Dynamic fields với useFieldArray | "Dynamic field array" | ① FE | giữ |

### M6 — Client State (Zustand + Jotai)  (4 → 4) · FE
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| Zustand Store và Selector | "Client state store & selector" | ① FE | giữ |
| Persist và Đồng Bộ Cross-Tab | "Persist & đồng bộ cross-tab" | ① FE | giữ |
| Slices Pattern Cho Store Lớn | "Tổ chức store lớn (slices)" | ① FE | giữ |
| Jotai Atoms cho Derived State | "Atomic state & derived state" | ① FE | giữ |

### M7 — Routing & URL State (Next.js)  (4 → 4) · FE
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| Dynamic Routes, Nested Layouts và Route Groups | "Routing: dynamic route, nested layout" | ① FE (idiom Next nặng) | giữ |
| Search Params là State | "URL là nguồn state (searchParams)" | ① FE | giữ |
| Parallel và Intercepting Routes — Modal Trên Page | "Parallel / intercepting routes" | ② FE (idiom Next thuần) | giữ |
| Middleware — Auth Redirect và Locale Routing | "Edge middleware: redirect & locale" | ① FE | giữ |
*Parallel/intercepting routes là idiom Next gần như không port — trung thực Next-bound.*

### M8 — WebSocket Realtime  (4 → 4)
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| Socket.IO Realtime Chat | "Giao tiếp realtime (WebSocket)" | ① | giữ |
| Socket.IO Security với JWT | "Bảo mật kết nối realtime" | ① | giữ |
| Presence và Typing Indicator | "Presence & typing indicator" | ① | giữ |
| Reconnection và Replay tin nhắn bị miss | "Reconnection & replay tin nhắn miss" | ① | giữ |

### M9 — Background Jobs & Workers  (4 → 4)
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| BullMQ Message Queue | "Hàng đợi job nền (queue)" | ① | giữ |
| Task Scheduling với Cron | "Lập lịch tác vụ (cron)" | ① | giữ |
| Priority, Retry và Dead Letter Queue | "Priority, retry & DLQ" | ① | giữ |
| Scale Worker và Concurrency | "Scale worker & concurrency" | ① | giữ |

### M10 — Email / SMS / OTP  (4 → 4)
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| Gửi email với Nodemailer | "Gửi email giao dịch" | ① | giữ |
| Xác thực OTP với Redis | "OTP: phát sinh, TTL & verify" | ① | giữ |
| Tích hợp SMS với Twilio | "Gửi SMS qua nhà cung cấp" | ① | giữ |
| Tuỳ chọn thông báo và Opt-out | "Notification preference & opt-out" | ① | giữ |

### M11 — File Upload & Storage  (4 → 4)
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| Upload File đơn với Multer | "Nhận & xử lý file upload" | ① | giữ |
| Presigned URL với S3 / MinIO | "Object storage & presigned URL" | ① | giữ |
| Chunked Upload với Progress | "Chunked upload & progress" | ① | giữ |
| Resumable Upload với giao thức tus.io | "Resumable upload (giao thức)" | ① | giữ |

### M12 — Server Components / Suspense / Streaming  (4 → 4) · FE
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| Ranh giới RSC và Client Component | "Render phía server vs client (boundary)" | ② FE (idiom Next/RSC) | giữ |
| Suspense và Streaming HTML | "Streaming HTML & Suspense" | ① FE | giữ |
| Server Actions và mutation form | "Server actions: mutation từ server" | ② FE | giữ |
| Partial Prerendering (PPR) | "Partial prerendering" | ② FE | giữ |
*Module ② nặng nhất ở FE — RSC/Server Actions/PPR là idiom Next, output không bộc lộ cơ chế. Trung thực Next-bound, concept-mapping (Astro islands, Remix) ngắn.*

### M13 — Frontend Performance  (4 → 4) · FE
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| Code Splitting và Dynamic Import | "Code splitting & lazy load" | ① FE | giữ |
| next/image và Pipeline Sharp | "Tối ưu ảnh (responsive, format)" | ① FE | giữ |
| Virtualization danh sách với TanStack Virtual | "List virtualization" | ① FE | giữ |
| Đẩy tính toán nặng sang Web Worker với Comlink | "Offload compute sang Web Worker" | ① FE | giữ |

### M14 — UI Polish  (4 → 4) · FE
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| Toast system với HeroUI Toast | "Toast / notification UI" | ① FE | giữ |
| Modal Dialog với HeroUI Modal | "Modal & dialog (a11y)" | ① FE | giữ |
| Dark Mode và Design Tokens với next-themes | "Theming & design tokens" | ① FE | giữ |
| Internationalization với next-intl | "Internationalization (i18n)" | ① FE | giữ |
*Tên bám HeroUI/next-* nhiều nhất — reframe mạnh tay về concept UI.*

### M15 — Interaction & Accessibility  (4 → 4) · FE
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| Drag and Drop với dnd-kit | "Drag & drop interaction" | ① FE | giữ |
| UX Command Palette với cmdk | "Command palette UX" | ① FE | giữ |
| Focus Management và các pattern Accessibility | "Focus management & a11y" | ① FE | giữ |
| Animation với Framer Motion | "Animation có nguyên tắc" | ① FE | giữ |

### M16 — Observability  (4 → 4)
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| Structured Logging với Pino và Correlation IDs | "Structured logging & correlation ID" | ① | giữ |
| Distributed Tracing với OpenTelemetry... | "Distributed tracing" | ① | giữ |
| Theo dõi lỗi end-to-end bằng Sentry... | "Error tracking end-to-end" | ① | giữ |
| Health, Readiness, Liveness Probes với @nestjs/terminus | "Health / readiness / liveness probe" | ① | giữ |

### M17 — Security End-to-End  (4 → 5?)
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| Phòng thủ XSS, CSRF, CORS... | **Cân nhắc TÁCH**: XSS+CSRF (injection/forgery) vs CORS (origin policy) | ① | 1→2? (xem câu hỏi) |
| Rate Limiting và phòng thủ Brute-Force với @nestjs/throttler | "Rate limiting & chống brute-force" | ① | giữ |
| Header bảo mật Helmet và Content Security Policy | "Security header & CSP" | ① | giữ |
| Quản lý Secrets với HashiCorp Vault và ConfigModule | "Quản lý secret" | ① | giữ |
*Lesson 0 ôm 3 concept (XSS/CSRF/CORS) — ứng viên tách. Chốt với chủ nhiệm.*  **Sau audit: 4 hoặc 5.**

### M18 — Testing Strategy  (4 → 4)
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| Unit Test NestJS Service với Vitest | "Unit test & test double" | ① | giữ |
| HTTP E2E Test cho Controller... với Supertest | "HTTP integration / e2e test" | ① | giữ |
| UI End-to-End Test với Playwright và Page Object | "UI e2e test & page object" | ① FE | giữ |
| Mock API với MSW và Visual Regression | "API mocking & visual regression" | ① FE | giữ |

### M19 — Deploy & DevOps  (4 → 4)
| Legacy | Concept-first | Nhóm | Tách/gộp |
|---|---|---|---|
| Dockerfile multi-stage cho NestJS production | "Container hóa & multi-stage build" | ① | giữ |
| CI/CD với GitHub Actions... | "CI/CD pipeline" | ① | giữ |
| Database Migration Zero-downtime ở Production | "Migration zero-downtime" | ① | giữ |
| Feature Flag và Canary Rollout | "Feature flag & canary rollout" | ① | giữ |

---

## 3. Ưu tiên rollout

Khuyến nghị làm **backend trước** (① rõ ràng, criteria 4-lang dễ chuẩn hóa, model challenge mới phát huy nhất), FE sau (cần điều chỉnh model challenge cho hành vi UI thay vì 4-lang).

| Đợt | Module | Lý do | Effort |
|---|---|---|---|
| **Tier 1 — BE nền** | M0, M1, M2, M3 | Nền tảng, tái cấu trúc M0 (tách 3→5) là ưu tiên cao nhất; có ② cần viết mẫu chuẩn | M0 **cao** · M1-M3 **vừa** |
| **Tier 2 — BE hệ thống** | M8, M9, M10, M11, M16 | ① thuần, challenge output rõ, dễ ra criteria proof-cơ-chế | **vừa** mỗi module |
| **Tier 3 — BE vận hành/bảo mật** | M17, M18, M19 | M17 cần chốt tách lesson 0; testing/deploy ① | M17 **vừa-cao** · M18/M19 **vừa** |
| **Tier 4 — FE** | M4, M5, M6, M7, M12, M13, M14, M15 | Cần model challenge FE (hành vi UI); M7/M12 có ② idiom Next | M14 **thấp** (reframe tên) · M12, M7 **cao** (② + model FE) · còn lại **vừa** |

Gợi ý mốc: chốt **M0 làm mẫu reference** (cả ① lẫn ②, cả tách lesson) trước khi nhân rộng. Chốt **1 FE lesson mẫu** (vd M4 L0) để định hình model challenge FE trước Tier 4.

---

## 4. Câu hỏi cần chủ nhiệm chốt

1. **M0 tách 3→5**: đồng ý tách env-setup gộp vào lesson "Framework là gì", tách riêng DI/IoC, và tách config khỏi logging? (kéo theo renumber slot + update overview + memory `fs-module-01`).
2. **M17 lesson 0**: tách "XSS/CSRF/CORS" thành 2 lesson (injection+forgery / origin policy) hay giữ 1 lesson 3 mặt? Ảnh hưởng tổng lesson khóa.
3. **Model challenge FE**: 8 module FE không hợp 4-lang TS/Go/C#/Java. Chấm theo **hành vi UI/DOM/output** (outcomeCriteria) + **approachCriteria single-lang TS** (Σ=70)? Hay bỏ tách lang, dùng criteria thuần outcome cho FE?
4. **Đối chiếu ngôn ngữ cho lesson ②** (DI M0, RSC/Server Actions/PPR M12, parallel routes M7): chỉ 1 đoạn concept-mapping ngắn (đúng playbook §1) — xác nhận KHÔNG fan-out code 4-lang cho các lesson này?
5. **Reframe tên giữ thuật ngữ tool?** Playbook muốn title nói concept. Có giữ tên tool trong ngoặc phụ (vd "Caching (Redis)") để học viên dễ nhận diện stack khóa, hay bỏ hẳn tên tool khỏi title?
6. **`# verified` & EN mirror**: rewrite đồng thời vi.md + en.md (mirror 1-1) ngay từng lesson, hay rewrite vi trước toàn khóa rồi mirror en đợt sau?
7. **Phạm vi challenge**: chỉ kiểm 1 module có thư mục `challenges/`? (survey này chỉ đọc contents — cần xác nhận mỗi lesson đã có challenge legacy để áp model §6, hay nhiều lesson FE chưa có challenge và phải viết mới).

---

## 5. Tổng kết số liệu

- Module: **20** (M0-M19).
- Lesson hiện tại: **79** (M0=3, còn lại 4/module).
- Lesson sau audit (ước lượng): **81-82** (M0: +2 → 5; M17: 0 hoặc +1).
- Lesson nhóm **②** đáng chú ý: **6** — M0 DI/IoC, M0 Module-structure (một phần), M3 Guard (idiom trong lesson ①), M7 parallel/intercepting routes, M12 RSC boundary, M12 Server Actions, M12 PPR.
- Module FE (không 4-lang): **8** (M4, M5, M6, M7, M12, M13, M14, M15).
