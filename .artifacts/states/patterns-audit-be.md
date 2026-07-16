# patterns-audit-be — log (append-only)
> Ghi bởi `starci-be-patterns-audit`. Mỗi lần audit = 1 block ngày (vi phạm patterns/be + trạng thái nợ). Chưa có = chưa audit lần đầu.

---

## 2026-07-16 — full-scan 6 mảng (HEAD `5e694f9`)

Synthesize từ 6 brief sonnet trong `_audit/` (api-surface · type-safety · validation · config-and-env · exceptions · comments). Rubric: `starci-claude-canon/patterns/be/*.md`. Report-only.

### Tổng quan — vi phạm theo mảng (nặng → nhẹ)

| Mảng | Rule chính | Số vi phạm | Mức |
|---|---|---|---|
| **type-safety** | §6 `as unknown as` ngoài spec · §1 `Record<string,any>` mới | **~46** (35 cast ở 25 file + 8 `any` throttler + 1 sentry env) | TRUNG BÌNH — drift rule↔source lớn nhất |
| **api-surface** | reverse-import · resolver-không-mỏng · method≠`execute` · Swagger thiếu | **~44** (5 reverse-import/4 file + 7 resolver dày + 15 sai tên method + 1 hardcode `@ApiTags` + 9 controller thiếu `@ApiTags`) + 33 resolver inject `EntityManager` (đa số query) | CAO — reverse-import phá chiều phụ thuộc |
| **validation** | §1/§3/§4 boundary validator · §2 magic-number | **6 nhóm** (nhóm 1 = **66 query request.ts KHÔNG có 1 validator nào**) | SEVERE (nhóm 1) — input công khai, pagination unbounded |
| **config-and-env** | #3 hằng số thời lượng hard-code ngoài `envConfig()` | **9** (+1 note rubric) — cụm `RESUME_WINDOW_HOURS=24` lặp 4 nơi | THẤP-TRUNG |
| **exceptions** | Luật 2 — cấm Nest built-in trong `features/api` | **3** (module `mount-foundations` mới) | NHỎ |
| **comments** | §1 WHAT-not-WHY · §2 section-divider | **3 nhóm** (~14 dòng WHAT ở 2 file + 6 file divider quanh WIRING-TODO) | NHẸ |

**Cộng: ~108 vi phạm cụ thể + diện rộng (33 resolver query inject EntityManager, 66 query DTO thiếu validator).**

### TOP findings — RANKED (cao → thấp)

1. **[CAO/kiến trúc] Reverse-import `@modules/bussiness` → `@features/api`** — phá chiều api→bussiness→hạ tầng.
   - `src/modules/bussiness/daily-quest/daily-quest.service.ts:20` · reverse-import · `from "@features/api/processors/ai/shared/xp"`
   - `src/modules/bussiness/flashcard/flashcard-quiz-session.service.ts:22,25` · reverse-import (2 chỗ) · xp + `.../job-readiness/constants`
   - `src/modules/bussiness/flashcard/flashcard-review.service.ts:24` · reverse-import · xp
   - `src/modules/bussiness/streak/streak-milestone.service.ts:15` · reverse-import · xp
   - **fix:** di chuyển hằng XP/constants shared xuống `@modules/bussiness` (hoặc `@modules/common`), `features/api` import ngược lại.

2. **[SEVERE/security] 66 GraphQL query `request.ts` KHÔNG có bất kỳ class-validator nào** — chỉ `@Field`; pagination không trần trên, filter enum không `@IsEnum`; nhiều query không yêu cầu auth.
   - `src/features/api/core/graphql/queries/**/graphql-types/request.ts` (66/66) — vd `queries/job-postings/job-postings/request.ts:29-66`, `queries/users/search-users/request.ts:14-32`, `queries/coding/coding-problems/request.ts:15-51`
   - **fix:** `@IsOptional()@IsInt()@Min(0)@Max(<const>)` cho limit/offset/page; `@IsEnum` cho filter; `@IsString()@MaxLength(<const>)` cho search/tag.

3. **[CAO] Resolver KHÔNG mỏng — business logic/transaction nằm thẳng trong resolver** (tự inject `EntityManager`).
   - `src/features/api/core/graphql/mutations/job-postings/submit-job-posting/submit-job-posting.resolver.ts:81-354` · resolver dày 354 dòng (mold 77) · `entityManager.transaction(...)` + 3 private method tạo company/gen slug — đẩy vào 1 service `@modules/bussiness`
   - `src/features/api/core/graphql/mutations/follows/set-follow/set-follow.resolver.ts:81-194` · tự `transaction` + findOne/tạo `UserFollowEntity` + `writeActivity` trong resolver
   - `mutations/profile/pin-course-project|pin-external-project|unpin-project`, `two-factor/confirm-two-factor|disable-two-factor` (5 resolver) · cùng pattern inject `EntityManager`/tự throw
   - (+diện rộng: ~33 resolver tổng inject `EntityManager`, phần lớn là query đọc — rủi ro thấp hơn, cần soát riêng)

4. **[TRUNG/type-safety] `as unknown as` trong production (35 chỗ / 25 file)** — rule ghi "chỉ còn trong `*.spec.ts`" ⇒ SAI thực tế. Nguy nhất ở webhook nhận body untrusted:
   - `src/features/api/core/http/nowpayments/webhook/webhook.handler.ts:90` · §6 · `body as unknown as Record<string, unknown>`
   - `src/features/api/core/http/paypal/webhook/webhook.handler.ts:104` · §6 · `body as unknown as Record<string, unknown>`
   - Cụm JSONB-column cast lặp lại (fix tập trung bằng type-guard/parse helper chung):
     - `queries/flashcard-decks/my-mock-interview-attempt-by-session/*.service.ts:101,112,125` + `my-mock-interview-attempts.service.ts:135,146,159` (6 chỗ)
     - `modules/bussiness/projections/user-mock-interview-course-stats/*-projection.service.ts:255,262,271` (3 chỗ)
     - `mutations/interview/.../grade-mock-interview-session-grading.service.ts:633-639` (3 chỗ)
     - 10 elasticsearch builder `modules/init/synchronizers/elasticsearch-synchronizer/builder/*.service.ts` (`} as unknown as <X>Entity` nhét field `suggest`)
   - Khác: `content.handler.ts:273`, `generate-cv-*step.service.ts:124/138` + `parse-cv-score.ts:82`, `s3-snapshot.service.ts:199` + `s3-read.service.ts:91,164`, `label-resolver.service.ts:236`, `keycloak/guards/abstract.ts:113`, `extract-json-from-md.service.ts:67`
   - **fix:** `satisfies` cho shape-check; type-guard/`instanceof` cho stream/entity; return type tường minh để bỏ cast ở call-site.

5. **[TRUNG/type-safety] `Record<string, any>` MỚI trong `throttler` (8 chỗ)** — ngoài 2 nợ `any` cũ đã ghi trong rule.
   - `src/modules/throttler/types/request-response.ts:7,9,18,20` + `guards/throttler-behind-proxy.guard.ts:30,42,45-48`
   - **fix:** `any`→`unknown` hoặc interface tối thiểu `{ ip?: string; ips?: Array<string> }`.

6. **[TRUNG/exceptions] Nest built-in exception trong `features/api`** (Luật 2) — module `mount-foundations` mới chưa migrate, sẽ ném sai shape qua AbstractException filter.
   - `src/features/api/core/http/mount/foundations/mount-foundations.service.ts:28,37` · `throw new NotFoundException()`
   - `src/features/api/core/http/mount/foundations/mount-foundations.controller.ts:55` · `throw new NotFoundException()` (trong catch)
   - **fix:** 1 domain exception `MountFoundationsFileNotFoundException extends AbstractException` (arg 4 = `HttpStatus.NOT_FOUND`).

7. **[THẤP-TRUNG/config] Hằng số thời lượng hard-code ngoài `envConfig()`** (rule #3) — nổi bật cụm `RESUME_WINDOW_HOURS=24` lặp độc lập 4 nơi.
   - `modules/bussiness/flashcard/flashcard-review-session.service.ts:43`, `flashcard-due-review-session.service.ts:36`, `queries/flashcard/my-in-progress-flashcard-quiz-session/*.service.ts:31`, `queries/flashcard-decks/my-in-progress-mock-interview-session/*.service.ts:30` (=24, gom 1 node)
   - `features/mock/store/session-store.service.ts:26,29` + `file-store/file-store.service.ts:24,27` (TTL/cleanup)
   - `modules/cache/ai-ping-cache.service.ts:35`, `modules/rag/public-rag-playground-cleanup.service.ts:24`, `modules/bussiness/notification/social-digest-cron.service.ts:35`
   - **fix:** node `envConfig()` qua `parseEnvMs`/`parseEnvInt`.

8. **[THẤP/api-surface] 15 resolver method KHÔNG tên `execute`** — vd `challengeSuggestions(...)`, `headhuntingCompany(...)` ở `queries/{challenges/challenge-suggestions, coding/coding-problem-suggestions, contents/content-suggestions, courses/course-suggestions, cv-submissions/user-cv-submission-attempts, flashcard-decks/flashcard-deck-suggestions, foundations/foundation-categories(+-suggestions), headhuntings/consultant-suggestions(+headhunting-companies,-company,-company-suggestions), milestones/milestone-suggestions, modules/module-suggestions, tasks/milestone-task-suggestions}/*.resolver.ts`. **fix:** đổi tên method → `execute` (giữ `@Query({name})`).

9. **[THẤP/api-surface] Swagger `@ApiTags` thiếu/hardcode.**
   - `src/features/api/core/http/minio/webhook/webhook.controller.ts:29` · hardcode `@ApiTags("webhooks")` → dùng `httpConfig().minio().tags`
   - 9 controller thiếu `@ApiTags`: `keycloak/auth`, `mount/foundations`, `nowpayments/webhook`, `payos/{create-payment-link,payment-request,webhook}`, `paypal/webhook`, `sepay/webhook`, `stripe/webhook`

10. **[THẤP/validation] Magic-number length thay named-const** (§2) — `keycloak/auth/dtos/register.request.ts:12-32` + `login.request.ts:9-15`, keycloak `sign-up/init` + sign-in/forgot/exchange/refresh/revoke (≥6 file, DRY), `mutations/profile/update-profile/graphql-types/request.ts:44,57,71,117,130,143,168,181` (đã có comment "cap matches column" nhưng vẫn số trần = case ❌ SAI trong rubric).

11. **[THẤP/validation] Mảng object lồng thiếu `@ValidateNested`/`@Type`/`@ArrayMaxSize`** — `src/features/api/core/http/minio/webhook/dtos/webhook.request.ts:49-56` (nested `Records` không được transform → không validate sâu).

12. **[NHẸ/comments] WHAT-not-WHY + section-divider.**
    - `src/modules/axios/axios.service.ts:37-82` (8 dòng WHAT), `features/api/processors/enroll/enroll.worker.ts:89,91`, `enroll/steps/enroll-step.service.ts:133,169,259,263`
    - 6 file wiring-TODO bọc `// ====` (generate-cv + cv-submissions modules) — chỉ lệch format, giữ nội dung TODO.

### Ghi chú (chờ thầy chốt, KHÔNG tính vi phạm)
- `pg-backup.service.ts:152` spread `...process.env` cho spawn — cùng loại ngoại lệ hợp lệ như `pg.service.ts` nhưng rubric chưa liệt tên ⇒ **thiếu ở rubric-doc**, không phải bug.
- `sentry/instrument.ts:11` đọc `process.env.NODE_ENV` — chạy TRƯỚC bootstrap nên có thể là exception hợp lý như `parse-env.ts`; chốt rule.
- `presigned-url.controller.ts` (mold REST chuẩn) lại KHÔNG có `@RestSuccessMessage` dù rule yêu cầu ⇒ rule/mold có thể đã trôi; chốt rubric trước khi patch `@RestSuccessMessage` hàng loạt (đa số controller còn lại là webhook M2M, ngoại lệ hợp lý).
