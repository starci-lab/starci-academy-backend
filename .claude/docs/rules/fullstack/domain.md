# Domain — Fullstack Mastery (`0-fullstack-mastery`)

> Đặc tả DOMAIN của khóa: **định vị · bản đồ giáo trình · quy ước RIÊNG domain**. Grounded từ 23 module thật + `contents.md`/`challenges.md`/`coding.md` (cùng thư mục). Đây là "khóa DẠY GÌ + đặc thù" để gen/audit bám; KHÔNG lặp format/wording (đã ở `contents.md`).

## 1. Định vị
- **Đối tượng + outcome:** nền tảng vững + kỹ năng thực chiến + tư duy engineering → **intern / Fresher / Junior**. Fullstack frontend↔backend, trọng tâm thực tế.
- **Trục domain:** mỗi lesson = 1 **năng lực production** của fullstack junior. Backend NestJS-led + frontend React. Không dạy CRUD-trên-slide; mỗi bài chạy thật + có challenge chấm.

## 2. Bản đồ giáo trình (23 module — grounded)
| Cụm | Module |
|---|---|
| **BE core + data** | 0 nestjs-core-and-request-lifecycle · 1 database-integration-and-caching · 2 rest-api-design-and-documentation · 21 graphql-api-design |
| **Auth + security** | 3 authentication-and-authorization · 17 security-end-to-end |
| **FE state + form** | 4 server-state-tanstack-query · 5 form-mastery-rhf-zod · 6 client-state-zustand-jotai · 7 react-reactivity-and-effects |
| **Realtime + async BE** | 8 websocket-realtime · 9 background-jobs-and-workers · 10 email-sms-otp · 11 file-upload-and-storage |
| **FE render + quality** | 12 server-components-suspense-streaming · 13 frontend-performance · 14 responsive-and-adaptive-rendering · 15 interaction-and-accessibility |
| **Prod-readiness** | 16 observability-logs-tracing-errors · 18 testing-strategy · 19 deploy-and-devops-workflow |
| **Integration** | 20 ai-llm-integration · 22 payment-integration |

## 3. Quy ước RIÊNG domain (khác generic — chi tiết `contents.md §0/§5`, `coding.md`)
- **Lang:** BE **4-lang** `typescript → java → csharp → go` (per-applicability — bỏ lang phải bịa concept); FE = **agnostic** (React). TS luôn có.
- **Variant/loại-bài (3):** **Pure BE** (curl/PowerShell flows) · **BE + Playwright** (websocket/file-upload/realtime — DOM tối thiểu, docs KHÔNG mô tả UX) · **FE-Vite** (form/state/perf/a11y — `isSandbox`).
- **FE = Vite (React) + Sandbox, KHÔNG Next.js** trừ khi `guidance` chỉ rõ (RSC/app-router). Repo cũ Next → migrate sạch.
- **E2E:** docker compose local (`.docker/compose.yaml`) + `nest start --watch`; 4-lang **parallel port-map** (ts 3000·java 3001·net 3002·go 3003); bind `127.0.0.1`.
- **Repo:** `fullstack-mastery-module-<N>-<slug>`; **CHÚ Ý off-by-one** một số repo FE = `module-<N+1>`.
- **Challenge:** 4/lesson (easy+medium+hard+insane); floor theo submission type ([[grading-floor-economy-not-difficulty]]).

## 4. Capstone (milestones) — "StarCi Shop"
20 milestone xây 1 backend thương mại phân tầng (http→domain→data) → frontend → feature (sản phẩm/giỏ/đơn/thanh toán) → indexing/perf/security. Task = brief per-lang (xem `rules/... check-task.mjs`).

## 5. Cho gen/audit (điều 1 agent PHẢI biết khi làm khóa này)
- Gen module mới → bám bản đồ §2, KHÔNG trùng topic; chọn variant theo BẢN CHẤT năng lực (§3); 4-lang chỉ khi portable, else concept-mapping/agnostic.
- Domain FS "rộng ngang" (nhiều năng lực rời) — mỗi module độc lập; khác SD (một mạch kiến trúc phân tán).
