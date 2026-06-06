export const meta = {
  name: 'v2-migrate-fs-m17-observability',
  description: 'V2 migrate FS M17 Observability (slot 16) — roots + 4-lang bodies + submissions backfill + finalize',
  phases: [
    { title: 'Module root' },
    { title: 'L0 bodies' },
    { title: 'L1 bodies' },
    { title: 'L2 bodies' },
    { title: 'L3 bodies' },
    { title: 'Submissions' },
    { title: 'Finalize' },
  ]
}

const MOUNT = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\0-fullstack-mastery\\modules\\16-observability-logs-tracing-errors'
const REPO_GH = 'https://github.com/StarCi-Academy/fullstack-mastery-module-17-observability-logs-tracing-errors'
const REPO_LOCAL = 'C:\\Repositories\\ac\\starci-academy-backend\\.repo\\fullstack-mastery-module-17-observability-logs-tracing-errors'
const RULES = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\rules\\v2-audit-rules.md'
const REF_BODY_VI = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\1-system-design-mastery\\modules\\6-redis-mastery\\contents\\0-redis-data-structures\\bodies\\0-typescript\\vi.md'
const REF_BODY_EN = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\1-system-design-mastery\\modules\\6-redis-mastery\\contents\\0-redis-data-structures\\bodies\\0-typescript\\en.md'
const REF_ROOT = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\1-system-design-mastery\\modules\\6-redis-mastery\\contents\\0-redis-data-structures\\vi.md'
const REF_MOD = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\1-system-design-mastery\\modules\\10-feed-ranking-and-distribution\\vi.md'
const REF_CTX = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\1-system-design-mastery\\modules\\6-redis-mastery\\contents\\0-redis-data-structures\\code-context.md'
const REF_AUD = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\1-system-design-mastery\\modules\\6-redis-mastery\\contents\\0-redis-data-structures\\audited.md'
const TODAY = '2026-06-05'

const LESSONS = [
  {
    slug: '0-pino-and-correlation-ids',
    titleVI: 'Pino và correlation ID: structured logging gắn ID xuyên suốt request',
    titleEN: 'Pino and correlation IDs: structured logging that threads an ID through a request',
    descVI: 'Bài học dựng structured logging với Pino và gắn một correlation ID (x-request-id) vào AsyncLocalStorage để mọi log trong cùng một request đều mang ID đó — quan sát ID tự sinh, honor ID do client gửi, và 404 vẫn giữ nguyên ID.',
    descEN: 'Set up structured logging with Pino and attach a correlation ID (x-request-id) into AsyncLocalStorage so every log line within one request carries that ID — observe an auto-generated ID, a client-supplied ID being honored, and a 404 preserving the ID.',
    isPremium: false, port: 3000, service: 'backend', docker: 'none',
    stack: 'NestJS + nestjs-pino + AsyncLocalStorage',
    endpointsDesc: 'GET /orders/:id -> 200 + response header x-request-id (auto if absent, honored if client sends one); logs for that request all carry the same x-request-id; GET /orders/error -> 404 still carries the x-request-id',
    keyConcepts: 'structured (JSON) logging vs string logs; correlation ID propagated via AsyncLocalStorage (NOT req.locals / not passed as an argument); honoring an inbound x-request-id; log redaction of secrets; one ID per request across async boundaries',
    e2eNote: 'TypeScript reference E2E PASS (auto-ID, honored ID, 404 keeps ID) per source repo; Java/C#/Go PENDING maintainer scaffold',
    challenges: ['0-pino-structured-logging-easy','1-pino-correlation-ids-medium','2-pino-correlation-ids-hard','3-pino-correlation-ids-insane'],
  },
  {
    slug: '1-opentelemetry-distributed-tracing',
    titleVI: 'OpenTelemetry: distributed tracing với spans và Jaeger',
    titleEN: 'OpenTelemetry: distributed tracing with spans and Jaeger',
    descVI: 'Bài học khởi tạo OpenTelemetry SDK (init TRƯỚC mọi import khác), auto-instrument HTTP, và tạo manual span cho nghiệp vụ, xuất sang Jaeger qua OTLP — quan sát span orders.charge hiện trong Jaeger UI, và request fail- sinh span ERROR kèm recordException.',
    descEN: 'Initialize the OpenTelemetry SDK (BEFORE any other import), auto-instrument HTTP, and create a manual business span exported to Jaeger over OTLP — observe the orders.charge span appear in the Jaeger UI, and a fail- request producing an ERROR span with recordException.',
    isPremium: false, port: 3000, service: 'backend', docker: 'Jaeger (OTLP 4318, UI 16686)',
    stack: 'NestJS + OpenTelemetry NodeSDK + auto-instrumentation + Jaeger',
    endpointsDesc: 'POST /api/v1/orders/:id/charge -> 200 and a span "orders.charge" visible in Jaeger (parent HTTP span + child manual span); an id with the "fail-" prefix -> span status ERROR + recordException recorded; trace context propagated via traceparent header',
    keyConcepts: 'spans + traces (parent/child); the SDK MUST be initialized before app code (tracing.ts imported first); auto-instrumentation vs manual spans (tracer.startActiveSpan); OTLP exporter to Jaeger; span status + recordException on error; W3C traceparent propagation',
    e2eNote: 'TypeScript reference E2E PASS (span in Jaeger; fail- -> ERROR span) per source repo; Java/C#/Go PENDING maintainer scaffold',
    challenges: ['0-otel-jaeger-integration-easy','1-otel-distributed-tracing-medium','2-opentelemetry-custom-spans-hard','3-opentelemetry-custom-spans-insane'],
  },
  {
    slug: '2-sentry-fe-and-be-integration',
    titleVI: 'Sentry FE và BE: bắt lỗi production và nối trace frontend-backend',
    titleEN: 'Sentry FE and BE: capturing production errors and stitching frontend-backend traces',
    descVI: 'Bài học tích hợp Sentry ở cả backend (NestJS exception filter, chỉ gửi 5xx) và frontend Next.js (global-error boundary, session replay), với init trong instrument trước bootstrap, beforeSend gột PII và release theo GIT_SHA — quan sát lỗi 500 lên Sentry còn 200/4xx thì không, và lỗi FE nối được với request BE.',
    descEN: 'Integrate Sentry on both the backend (a NestJS exception filter that reports only 5xx) and the Next.js frontend (a global-error boundary, session replay), with init in instrument before bootstrap, beforeSend scrubbing PII, and release tagged by GIT_SHA — observe a 500 reaching Sentry while 200/4xx do not, and a frontend error stitched to its backend request.',
    isPremium: true, port: 3000, service: 'backend', docker: 'none (Sentry SaaS/self-host)',
    stack: 'NestJS (@sentry/nestjs + SentryExceptionFilter) + Next.js frontend (@sentry/nextjs + replay)',
    endpointsDesc: 'POST /api/v1/orders {forceError?} -> 200 happy path (NOT sent to Sentry); forceError -> 500 captured in Sentry (only 5xx are reported); FE global-error.tsx boundary captures client errors; the sentry-trace / baggage headers stitch a FE error to its BE transaction',
    keyConcepts: 'init Sentry in instrument.ts BEFORE bootstrap; report only 5xx (filter out 4xx/expected); beforeSend PII scrubbing; release = GIT_SHA + source maps for readable stack traces; FE<->BE trace stitching via sentry-trace/baggage; session replay on the frontend',
    e2eNote: 'TypeScript reference E2E PASS (500 captured, 200/4xx not, FE-BE stitched) per source repo; Java/C#/Go PENDING maintainer scaffold (FE stays the shared Next.js app)',
    challenges: ['0-sentry-error-tracking-easy','1-sentry-trace-stitching-medium','2-sentry-source-maps-hard','3-sentry-source-maps-insane'],
  },
  {
    slug: '3-health-readiness-liveness-probes',
    titleVI: 'Health, readiness và liveness probe: ba loại probe cho Kubernetes',
    titleEN: 'Health, readiness, and liveness probes: the three Kubernetes probe types',
    descVI: 'Bài học dựng các endpoint health với @nestjs/terminus và một RedisHealthIndicator tự viết (Promise.race timeout 2s), phân biệt liveness (chỉ DB) với readiness (DB + Redis) — quan sát 200 khi phụ thuộc khỏe và 503 khi một phụ thuộc chết, đúng ngữ nghĩa ba probe của k8s.',
    descEN: 'Build health endpoints with @nestjs/terminus and a custom RedisHealthIndicator (Promise.race with a 2s timeout), separating liveness (DB only) from readiness (DB + Redis) — observe 200 when dependencies are healthy and 503 when one is down, matching the three Kubernetes probe semantics.',
    isPremium: true, port: 3000, service: 'backend', docker: 'Postgres + Redis',
    stack: 'NestJS + @nestjs/terminus + custom RedisHealthIndicator + Postgres + Redis',
    endpointsDesc: 'GET /health/live (DB only) -> 200 up / 503 down; GET /health/ready (DB + Redis) -> 200 up / 503 down; GET /health/startup -> 200 once warmed; each indicator wrapped in Promise.race with a 2s timeout so a hung dependency fails fast',
    keyConcepts: 'k8s 3 probe types (liveness = restart, readiness = take out of LB, startup = grace window); liveness checks only what a restart can fix (NOT downstream deps); readiness checks all deps; custom indicator + graceful timeout (Promise.race 2s) so a hung check returns 503 instead of hanging',
    e2eNote: 'TypeScript reference E2E PASS (200 healthy, 503 when a dep down) per source repo; Java/C#/Go PENDING maintainer scaffold',
    challenges: ['0-terminus-health-checks-easy','1-readiness-liveness-probes-medium','2-terminus-healthcheck-hard','3-terminus-healthcheck-insane'],
  },
]

const LANGS = [
  { folder: '0-typescript', keyword: 'typescript', runtime: 'Node.js 20 + TypeScript 5' },
  { folder: '1-java', keyword: 'java', runtime: 'Java 21 + Spring Boot 3' },
  { folder: '2-csharp', keyword: 'csharp', runtime: '.NET 8 + ASP.NET Core' },
  { folder: '3-go', keyword: 'go', runtime: 'Go 1.22 + Gin' },
]

const LANG_LIB = {
  '0-pino-and-correlation-ids': { typescript: 'nestjs-pino + AsyncLocalStorage', java: 'Logback/SLF4J + MDC (correlation via MDC + a servlet filter)', csharp: 'Serilog + AsyncLocal (enricher + middleware)', go: 'zap + context.Context (request-scoped logger in context)' },
  '1-opentelemetry-distributed-tracing': { typescript: 'OpenTelemetry NodeSDK + auto-instrumentations + OTLP exporter', java: 'OpenTelemetry Java agent (-javaagent) + manual spans (OpenTelemetry API)', csharp: 'System.Diagnostics.Activity + OpenTelemetry .NET SDK + OTLP', go: 'go.opentelemetry.io/otel SDK + otelgin + OTLP exporter' },
  '2-sentry-fe-and-be-integration': { typescript: '@sentry/nestjs + SentryExceptionFilter (+ @sentry/nextjs on the FE)', java: 'sentry-spring-boot-starter (5xx filter) — FE stays the shared Next.js @sentry/nextjs app', csharp: 'Sentry NuGet + Sentry.AspNetCore (5xx filter) — FE stays the shared Next.js app', go: 'sentry-go + sentrygin (5xx filter) — FE stays the shared Next.js app' },
  '3-health-readiness-liveness-probes': { typescript: '@nestjs/terminus + custom RedisHealthIndicator (Promise.race 2s)', java: 'Spring Boot Actuator (custom HealthIndicator + liveness/readiness groups)', csharp: 'AspNetCore.HealthChecks (AddHealthChecks + tagged liveness/readiness)', go: 'custom net/http handlers (per-dependency checks + context timeout)' },
}

function libFor(lesson, lang) { return (LANG_LIB[lesson.slug] || {})[lang.keyword] || lesson.stack }

function bodyPrompt(lesson, lang, locale) {
  const isVI = locale === 'vi'
  const outPath = `${MOUNT}\\contents\\${lesson.slug}\\bodies\\${lang.folder}\\${locale}.md`
  const refPath = isVI ? REF_BODY_VI : REF_BODY_EN
  const isTS = lang.folder === '0-typescript'
  const specificLib = libFor(lesson, lang)
  const repoRef = isTS
    ? `${REPO_GH}/tree/main/${lesson.slug}/${lesson.service} (NEEDS-RENAME: ${lesson.service} -> 0-typescript)`
    : `${REPO_GH}/tree/main/${lesson.slug}/${lang.folder} (PENDING scaffold; TypeScript ref at ${lesson.service}/)`
  return `You are writing a complete V2 lesson body file for StarCi Academy Fullstack Mastery course (Tier 5 backend observability).

TARGET FILE TO WRITE: ${outPath}

STEP 1 — Read references (Read tool):
1. ${RULES} (deliverable structure + body format rules)
2. ${refPath} (completed V2 4-language body — match structure, section depth, length, separators)
3. ${MOUNT}\\contents\\${lesson.slug}\\vi.md (existing V1 content — topic reference; first 120 lines)

STEP 2 — Write the file at: ${outPath}

FILE FORMAT:
# lang
<!-- @starci/seperator -->
${lang.keyword}
<!-- @starci/seperator -->
# body
<!-- @starci/seperator -->
[FULL LESSON BODY IN ${isVI ? 'VIETNAMESE (đầy đủ dấu)' : 'ENGLISH'}]
<!-- @starci/seperator -->

LESSON CONTRACT:
- Lesson: "${isVI ? lesson.titleVI : lesson.titleEN}"
- Key concepts: ${lesson.keyConcepts}
- Stack for THIS body: ${specificLib} (${lang.runtime})
- Observable behavior (endpoints, identical HTTP status + JSON across ALL 4 languages): ${lesson.endpointsDesc}
- Docker dependencies: ${lesson.docker}. Port: ${lesson.port}.
- Repo: ${repoRef}
- E2E note: ${lesson.e2eNote}

CROSS-LANGUAGE PARITY (CRITICAL — 1 of 4 languages for the same lesson):
- Same HTTP status + same JSON value shape across TS/Java/C#/Go. The observability OUTCOME is identical (the x-request-id threads through; the span appears; only 5xx reach Sentry; 200 vs 503 health) — only the library idiom differs per language (${specificLib}).
${lesson.slug === '2-sentry-fe-and-be-integration' ? '- The FRONTEND is the shared Next.js @sentry/nextjs app for all languages; only the BACKEND Sentry integration changes per language. FE<->BE stitching uses the sentry-trace/baggage HTTP headers (protocol-level, language-agnostic).' : ''}

REQUIRED BODY SECTIONS (${isVI ? 'Vietnamese' : 'English'}):
## 1. ${isVI ? 'Lời mở đầu' : 'Opening'} — interview dialog (Senior deep question -> Mid shallow -> bridge naming the real mechanism)
## 2. ${isVI ? 'Các khái niệm cốt lõi' : 'Core concepts'} — short practice-first bridge
### 2.1. ${isVI ? 'Thực hành' : 'Hands-on'}
#### 2.1.1. ${isVI ? 'Chuẩn bị source code và môi trường' : 'Prepare source code and environment'} — git clone${lesson.docker === 'none' ? ' + npm install (no Docker for this lesson)' : ' + cd .docker (docker compose for ' + lesson.docker + ')'}${!isTS ? ' (Note: the runnable demo uses the TypeScript implementation; the ' + specificLib + ' snippets in 2.1.3 show the equivalent idioms a maintainer would port)' : ''}
#### 2.1.2. ${isVI ? 'Kiến trúc / thành phần' : 'Architecture / components'} — component table + Mermaid flowchart TD with italic caption
#### 2.1.3. ${isVI ? 'Giải thích code và bản chất' : 'Code walkthrough and internals'} — 3 ${specificLib} snippets with inline WHY comments (comments ENGLISH even in vi.md)
#### 2.1.4. ${isVI ? 'Chuẩn bị và khởi chạy' : 'Prepare and launch'} — prerequisites + run
#### 2.1.5. ${isVI ? 'Kiểm thử' : 'Testing'} — one #####-level flow per behavior numbered 2.1.5.1, 2.1.5.2, ... Each flow: PowerShell (Invoke-RestMethod) FIRST then curl, then expected response/headers labelled (HTTP <status>), then italic *${isVI ? 'Kết luận:' : 'Conclusion:'} ...*. Use :::muted callouts; NEVER "### 1." step headings.
#### 2.1.6. ${isVI ? 'Dọn dẹp' : 'Cleanup'}
#### 2.1.7. ${isVI ? 'Đọc thêm' : 'Further reading'} — 2 authoritative links
### 2.2. ${isVI ? 'Lý thuyết' : 'Theory'} — 3-5 subsections; last = edge cases
## 3. ${isVI ? 'Tổng kết' : 'Wrap-up'}
### 3.1. ${isVI ? 'Câu hỏi phỏng vấn thường gặp' : 'Common interview questions'} — 5 questions, each with "${isVI ? 'Ý interviewer muốn nghe:' : 'What interviewers want to hear:'}"

CRITICAL RULES:
- Em-dash (—) in prose, NEVER "--"
- ${isVI ? 'Tiếng Việt: đầy đủ dấu, không dịch ép thuật ngữ (giữ correlation ID, span, trace, readiness, liveness, recordException...)' : 'English: professional, precise tone'}
- ALL code comments in ENGLISH (both files)
- Mermaid flowchart TD + italic caption; NO separator inside fences/mermaid; every fence has a language tag (no bare fence)
- Body SUBSTANTIAL — hundreds of lines, matching the reference depth

Write the complete file using the Write tool.`
}

function lessonRootPrompt(lesson, locale) {
  const isVI = locale === 'vi'
  const outPath = `${MOUNT}\\contents\\${lesson.slug}\\${locale}.md`
  return `Rewrite the lesson root metadata file (V2, body/codeExplaining/codeImplementations EMPTY) for FS M17 ${lesson.slug}.

TARGET FILE: ${outPath}
Read the reference first: ${REF_ROOT}

Write EXACTLY (empty section = two consecutive separators):

# title
<!-- @starci/seperator -->
${isVI ? lesson.titleVI : lesson.titleEN}
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
${isVI ? lesson.descVI : lesson.descEN}
<!-- @starci/seperator -->
# body
<!-- @starci/seperator -->
<!-- @starci/seperator -->
# codeExplaining
<!-- @starci/seperator -->
<!-- @starci/seperator -->
# codeImplementations
<!-- @starci/seperator -->
<!-- @starci/seperator -->
# references
## 0
### alias
<!-- @starci/seperator -->
[First reference title relevant to: ${lesson.titleEN}]
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
[First authoritative URL — official docs or well-known engineering blog]
<!-- @starci/seperator -->

## 1
### alias
<!-- @starci/seperator -->
[Second reference title]
<!-- @starci/seperator -->
### url
<!-- @starci/seperator -->
[Second authoritative URL]
<!-- @starci/seperator -->

# minutesRead
<!-- @starci/seperator -->
20
<!-- @starci/seperator -->
# isPremium
<!-- @starci/seperator -->
${lesson.isPremium}
<!-- @starci/seperator -->
# verified
<!-- @starci/seperator -->
${TODAY}
<!-- @starci/seperator -->

Use REAL authoritative URLs (Pino docs, OpenTelemetry docs, Jaeger, Sentry docs, nestjs/terminus, Kubernetes probes docs). NOT example.com. Description = PLAIN TEXT (no markdown).
Write the complete file using the Write tool.`
}

function moduleRootPrompt(locale) {
  const isVI = locale === 'vi'
  const outPath = `${MOUNT}\\${locale}.md`
  return `Rewrite the module root file for FS M17 "Observability: Logs, Tracing, Errors" (slot 16, 4 lessons).

TARGET FILE: ${outPath}
Read reference: ${REF_MOD}

Write with <!-- @starci/seperator --> separators:

# title
<!-- @starci/seperator -->
${isVI ? 'Observability: Logs, Tracing và Errors' : 'Observability: Logs, Tracing, and Errors'}
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
${isVI ? 'Module dạy ba trụ cột observability cho backend: structured logging với Pino và correlation ID, distributed tracing với OpenTelemetry và Jaeger, bắt lỗi production với Sentry (FE + BE), và health/readiness/liveness probe cho Kubernetes — kèm mapping sang Java, C# và Go.' : 'The three pillars of backend observability: structured logging with Pino and correlation IDs, distributed tracing with OpenTelemetry and Jaeger, production error tracking with Sentry (FE + BE), and Kubernetes health/readiness/liveness probes — with mappings to Java, C#, and Go.'}
<!-- @starci/seperator -->
# previewContents
## 0
### text
<!-- @starci/seperator -->
${isVI ? 'Pino structured logging + correlation ID xuyên request qua AsyncLocalStorage.' : 'Pino structured logging + a correlation ID threaded through a request via AsyncLocalStorage.'}
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
${isVI ? 'OpenTelemetry distributed tracing: spans, OTLP và Jaeger UI.' : 'OpenTelemetry distributed tracing: spans, OTLP, and the Jaeger UI.'}
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
${isVI ? 'Sentry FE + BE: chỉ bắt 5xx, gột PII, nối trace frontend-backend.' : 'Sentry FE + BE: capture only 5xx, scrub PII, stitch frontend-backend traces.'}
<!-- @starci/seperator -->
## 3
### text
<!-- @starci/seperator -->
${isVI ? 'Terminus health/readiness/liveness probe + timeout duyên dáng cho Kubernetes.' : 'Terminus health/readiness/liveness probes + graceful timeouts for Kubernetes.'}
<!-- @starci/seperator -->

Write the complete file using the Write tool.`
}

function subEN(lessonSlug, challengeSlug) {
  return `Write the English submission file for FS M17 challenge: ${challengeSlug}.

TARGET FILE: ${MOUNT}\\contents\\${lessonSlug}\\challenges\\${challengeSlug}\\submissions\\0\\en.md

# type
<!-- @starci/seperator -->
githubUrl
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
GitHub Repository Link
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
A public repository containing your solution to the "${challengeSlug}" challenge — with a README describing how to run it and evidence (screenshots or logs) for each requirement met.
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
100
<!-- @starci/seperator -->

Write the complete file using the Write tool.`
}

function subVI(lessonSlug, challengeSlug) {
  return `Write the Vietnamese submission file for FS M17 challenge: ${challengeSlug}.

TARGET FILE: ${MOUNT}\\contents\\${lessonSlug}\\challenges\\${challengeSlug}\\submissions\\0\\vi.md

# type
<!-- @starci/seperator -->
githubUrl
<!-- @starci/seperator -->
# title
<!-- @starci/seperator -->
Link Repository GitHub
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
Một repo công khai chứa lời giải cho thử thách "${challengeSlug}", kèm README mô tả cách chạy và bằng chứng thật (ảnh màn hình hoặc log) cho từng yêu cầu đã đạt.
<!-- @starci/seperator -->
# score
<!-- @starci/seperator -->
100
<!-- @starci/seperator -->

Write the complete file using the Write tool.`
}

function codeContextPrompt(lesson) {
  return `Write code-context.md for FS M17 lesson: ${lesson.slug}.

TARGET FILE: ${MOUNT}\\contents\\${lesson.slug}\\code-context.md

Read the source:
- ${REPO_LOCAL}\\${lesson.slug}\\backend\\src
${lesson.slug === '2-sentry-fe-and-be-integration' ? '- ' + REPO_LOCAL + '\\\\' + lesson.slug + '\\\\frontend\\\\src (the Next.js Sentry FE)\n' : ''}- ${REPO_LOCAL}\\${lesson.slug}\\.docker (compose, if present)
Reference format: ${REF_CTX}

Document:
1. Canonical repo: StarCi-Academy/fullstack-mastery-module-17-observability-logs-tracing-errors ; on-disk .repo/fullstack-mastery-module-17-...\\${lesson.slug}/ ; NEEDS-RENAME: backend -> 0-typescript
2. Stack table (${lesson.stack}); Docker deps: ${lesson.docker}; port ${lesson.port}
3. API surface table (Method | Path | Status | Behavior) — from: ${lesson.endpointsDesc}
4. E2E flows + status: ${lesson.e2eNote}
5. Language scaffold status (TypeScript=reference complete; Java/C#/Go=PENDING maintainer, with the per-lang mapping: ${Object.entries(LANG_LIB[lesson.slug]).map(([k,v])=>k+'='+v).join('; ')})
6. Known issues if any

Write using the Write tool.`
}

function auditedPrompt(lesson) {
  const L = lesson.slug.charAt(0)
  return `Write audited.md for FS M17 lesson: ${lesson.slug}. Reference format: ${REF_AUD}

TARGET FILE: ${MOUNT}\\contents\\${lesson.slug}\\audited.md

Write a V2 audit log:
1. ## Audit ${TODAY} — FS M17 Observability L${L} V2 migration
2. ### Compliance checklist (interview dialog, mermaid TD, dual-platform PowerShell+curl, 5 interview Qs, refs >=2, isPremium=${lesson.isPremium}, verified=${TODAY}, English code comments, :::muted step callouts)
3. ### Bodies (4-language) — TypeScript=Complete; Java/C#/Go=PENDING maintainer scaffold
4. ### Cross-lang parity: HTTP status + JSON + observability outcome identical across TS/Java/C#/Go
5. ### Challenges (${lesson.challenges.length} tiers): ${lesson.challenges.join(', ')} — vi+en already authored; submissions/0 backfilled this pass
6. ### E2E checklist — flows: ${lesson.endpointsDesc}. E2E status: ${lesson.e2eNote}. Each flow: Pass criteria + Observed = PENDING maintainer/Gemini verify (Opus does not run E2E)
7. ### Gate result: 0 blocking issues (docs/v2-gate.py)
8. ### Open issues: Java/C#/Go PENDING scaffold; NEEDS-RENAME backend->0-typescript

Write using the Write tool.`
}

// ===== EXECUTE =====

phase('Module root')
await parallel([
  () => agent(moduleRootPrompt('vi'), { label: 'mod-root:vi', model: 'sonnet', phase: 'Module root' }),
  () => agent(moduleRootPrompt('en'), { label: 'mod-root:en', model: 'sonnet', phase: 'Module root' }),
])

for (let i = 0; i < LESSONS.length; i++) {
  const ph = `L${i} bodies`
  phase(ph)
  await parallel([
    () => agent(lessonRootPrompt(LESSONS[i], 'vi'), { label: `L${i}-root:vi`, model: 'sonnet', phase: ph }),
    () => agent(lessonRootPrompt(LESSONS[i], 'en'), { label: `L${i}-root:en`, model: 'sonnet', phase: ph }),
  ])
  await parallel(LANGS.map(lang => () => agent(bodyPrompt(LESSONS[i], lang, 'vi'), { label: `L${i}:${lang.folder}:vi`, phase: ph })))
  await parallel(LANGS.map(lang => () => agent(bodyPrompt(LESSONS[i], lang, 'en'), { label: `L${i}:${lang.folder}:en`, phase: ph })))
}

phase('Submissions')
const allCh = LESSONS.flatMap(l => l.challenges.map(c => ({ lessonSlug: l.slug, challengeSlug: c })))
await parallel(allCh.map(({ lessonSlug, challengeSlug }) => () =>
  agent(subEN(lessonSlug, challengeSlug), { label: `sub-en:${challengeSlug.slice(-12)}`, model: 'sonnet', phase: 'Submissions' })))
await parallel(allCh.map(({ lessonSlug, challengeSlug }) => () =>
  agent(subVI(lessonSlug, challengeSlug), { label: `sub-vi:${challengeSlug.slice(-12)}`, model: 'sonnet', phase: 'Submissions' })))

phase('Finalize')
await parallel(LESSONS.map(lesson => () =>
  agent(codeContextPrompt(lesson), { label: `code-ctx:${lesson.slug}`, model: 'sonnet', phase: 'Finalize' })))
await parallel(LESSONS.map(lesson => () =>
  agent(auditedPrompt(lesson), { label: `audited:${lesson.slug}`, model: 'sonnet', phase: 'Finalize' })))

log('FS M17 Observability V2 migration complete.')
return { module: 'FS-M17', lessons: LESSONS.map(l => l.slug), status: 'done' }
