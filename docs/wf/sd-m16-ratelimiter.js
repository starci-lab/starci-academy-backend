
export const meta = {
  name: 'v2-migrate-sd-m16-ratelimiter',
  description: 'V2 migrate SD M16 Distributed Rate Limiter (slot 15) — roots + 4-lang bodies + submissions + finalize',
  phases: [
    { title: 'Module root' },
    { title: 'L0 bodies' },
    { title: 'L1 bodies' },
    { title: 'L2 bodies' },
    { title: 'Submissions' },
    { title: 'Finalize' },
  ]
}

const MOUNT = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\1-system-design-mastery\\modules\\15-distributed-rate-limiter'
const REPO_GH = 'https://github.com/StarCi-Academy/system-design-mastery-module-16-distributed-rate-limiter'
const REPO_LOCAL = 'C:\\Repositories\\ac\\starci-academy-backend\\.repo\\system-design-mastery-module-16-distributed-rate-limiter'
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
    slug: '0-token-bucket-and-redis-lua-atomicity',
    titleVI: 'Token bucket và tính nguyên tử bằng Redis Lua: rate limit không bị race',
    titleEN: 'Token bucket and Redis Lua atomicity: race-free rate limiting',
    descVI: 'Bài học cài thuật toán token bucket trong Redis và bọc toàn bộ thao tác read-modify-write vào một Lua script EVALSHA để chạy nguyên tử — quan sát vì sao khi 20 request đập đồng thời vào bucket capacity 5 thì đúng 5 request được cấp, không hơn không kém.',
    descEN: 'Implement the token bucket algorithm in Redis and wrap the whole read-modify-write in a single EVALSHA Lua script so it runs atomically — observe why, when 20 requests hit a capacity-5 bucket concurrently, exactly 5 are granted, no more, no fewer.',
    isPremium: false,
    port: 3000,
    service: 'token-bucket-service',
    stack: 'NestJS + Redis (single node); Lua EVALSHA for atomic refill+consume',
    endpointsDesc: 'POST /api/token-bucket/consume {key,capacity,refillPerSec,tokens?} -> {allowed,remaining,retryAfterMs}; GET /api/token-bucket/state?key=; GET /api/token-bucket/burst-demo?key&capacity&refill&n; POST /api/token-bucket/race-demo {key,capacity,refillPerSec,concurrency}',
    keyConcepts: 'token bucket refill model (tokens accrue at refillPerSec, capped at capacity); WHY non-atomic read-modify-write races (lost updates under concurrency); Lua EVALSHA = atomic on the Redis single thread; retryAfterMs computation; key tb:<key> as hash {tokens, ts} with TTL 60s',
    e2eNote: 'TypeScript reference E2E PASS 4/4 (concurrency=20 -> exactly 5 granted, burst then refill) per source repo; Java/C#/Go PENDING maintainer scaffold',
    challenges: [
      '0-token-bucket-and-redis-lua-atomicity-easy',
      '1-token-bucket-and-redis-lua-atomicity-medium',
      '2-token-bucket-with-clock-skew-and-distributed-clock-hard',
      '3-1m-rps-token-bucket-with-redis-cluster-hash-tag-insane',
    ],
  },
  {
    slug: '1-sliding-window-log-vs-counter',
    titleVI: 'Sliding window: log chính xác O(N) so với counter ước lượng O(1)',
    titleEN: 'Sliding window: exact O(N) log versus approximate O(1) counter',
    descVI: 'Bài học cài hai biến thể sliding window — log dùng ZSET đếm chính xác (O(N) bộ nhớ) và counter hai-bucket ước lượng có trọng số (O(1)) — rồi so sánh trực tiếp độ chính xác và chi phí, để hiểu khi nào nên đánh đổi RAM lấy độ chính xác.',
    descEN: 'Implement two sliding-window variants — an exact ZSET log (O(N) memory) and a weighted two-bucket counter approximation (O(1)) — then compare their accuracy and cost head-to-head, to understand when to trade RAM for precision.',
    isPremium: false,
    port: 3000,
    service: 'sliding-window-service',
    stack: 'NestJS + Redis (single node); 2 Lua scripts',
    endpointsDesc: 'POST /api/sliding-window/log/check {key,limit,windowMs} -> exact count via ZSET (O(N)); POST /api/sliding-window/counter/check {key,limit,windowMs} -> weighted 2-bucket estimate (O(1)); GET /api/sliding-window/compare?key&limit&windowMs&n',
    keyConcepts: 'sliding window log: ZREMRANGEBYSCORE (evict old) + ZCARD (count) + ZADD (record) — exact but RAM grows with traffic; sliding window counter: estimate = prev_bucket*(1-elapsed_ratio) + curr_bucket — O(1) memory, ~0.003% error; fixed-window boundary bursts; accuracy vs memory trade-off',
    e2eNote: 'TypeScript reference E2E PASS 3/3 (log exact vs counter estimate within error bound) per source repo; Java/C#/Go PENDING maintainer scaffold',
    challenges: [
      '0-sliding-window-log-vs-counter-easy',
      '1-sliding-window-log-vs-counter-medium',
      '2-sliding-window-with-bloom-filter-memory-optimization-hard',
      '3-multi-tier-sliding-window-with-redis-cluster-100k-rps-insane',
    ],
  },
  {
    slug: '2-hierarchical-multi-tenant-quota',
    titleVI: 'Quota phân tầng đa tenant trên Redis Cluster: chống hàng xóm ồn ào',
    titleEN: 'Hierarchical multi-tenant quota on Redis Cluster: noisy-neighbour protection',
    descVI: 'Bài học dựng quota phân tầng user -> tenant -> global trên Redis Cluster 3 node, dùng hash-tag để gom các key của một tenant về cùng shard cho Lua chạy nguyên tử, kèm bù trừ DECR khi một tầng từ chối — quan sát một tenant ồn ào bị chặn ở tầng tenant mà không ăn hết quota global.',
    descEN: 'Build a user -> tenant -> global hierarchical quota on a 3-node Redis Cluster, using hash-tags to colocate a tenant\\u2019s keys on one shard so a Lua script can run atomically, plus DECR compensation when an upper tier rejects — observe a noisy tenant being throttled at the tenant tier without exhausting the global quota.',
    isPremium: true,
    port: 3000,
    service: 'hierarchical-quota-service',
    stack: 'NestJS + Redis Cluster (3-node); hash-tag colocation; Lua atomic cascade',
    endpointsDesc: 'POST /api/quota/check {tenantId,userId} -> cascade user(5/s) -> tenant(20/s) -> global(50/s), names the blocked layer and applies DECR compensation on reject; POST /api/quota/hot-tenant-demo {tenantId,requests,distinctUsers}; GET /api/quota/cluster-info',
    keyConcepts: 'hierarchical quota cascade (check cheapest/innermost tier first); compensation rollback (DECR the tiers already incremented when a later tier rejects); hash-tag {q:<tenantId>} routes all of a tenant\\u2019s keys to one slot so a multi-key Lua runs atomically on Redis Cluster; CROSSSLOT error without hash-tags; noisy-neighbour isolation',
    e2eNote: 'TypeScript reference E2E PASS 3/3 (hot-tenant 50 req / 5 users -> OK:20 TENANT:30) per source repo; Java/C#/Go PENDING maintainer scaffold',
    challenges: [
      '0-hierarchical-multi-tenant-quota-easy',
      '1-hierarchical-multi-tenant-quota-medium',
      '2-hierarchical-quota-with-cache-stampede-and-singleflight-hard',
      '3-multi-region-tenant-quota-with-global-counter-insane',
    ],
  },
]

const LANGS = [
  { folder: '0-typescript', keyword: 'typescript', lib: 'NestJS + ioredis (Lua EVALSHA)', runtime: 'Node.js 20 + TypeScript 5' },
  { folder: '1-java', keyword: 'java', lib: 'Spring Boot 3 + Lettuce (Lua EVALSHA)', runtime: 'Java 21 + Maven' },
  { folder: '2-csharp', keyword: 'csharp', lib: 'ASP.NET Core 8 + StackExchange.Redis (Lua EVALSHA)', runtime: '.NET 8' },
  { folder: '3-go', keyword: 'go', lib: 'Gin + go-redis (Lua EVALSHA)', runtime: 'Go 1.22' },
]

const LANG_OVERRIDES = {
  '2-hierarchical-multi-tenant-quota': {
    typescript: 'NestJS + ioredis Cluster (hash-tag routing; Lua EVALSHA across cluster)',
    java: 'Spring Boot 3 + Lettuce RedisClusterClient (hash-tag routing; Lua EVALSHA)',
    csharp: 'ASP.NET Core 8 + StackExchange.Redis cluster (hash-tag routing; Lua EVALSHA)',
    go: 'Gin + go-redis ClusterClient (hash-tag routing; Lua EVALSHA)',
  },
}

function getLangLib(lesson, lang) {
  const o = LANG_OVERRIDES[lesson.slug]
  if (o) return o[lang.keyword] || lang.lib
  return lang.lib
}

function bodyPrompt(lesson, lang, locale) {
  const isVI = locale === 'vi'
  const outPath = `${MOUNT}\\contents\\${lesson.slug}\\bodies\\${lang.folder}\\${locale}.md`
  const refPath = isVI ? REF_BODY_VI : REF_BODY_EN
  const isTS = lang.folder === '0-typescript'
  const specificLib = getLangLib(lesson, lang)
  const repoRef = isTS
    ? `${REPO_GH}/tree/main/${lesson.slug}/${lesson.service} (NEEDS-RENAME: ${lesson.service} -> 0-typescript)`
    : `${REPO_GH}/tree/main/${lesson.slug}/${lang.folder} (PENDING scaffold; TypeScript ref at ${lesson.service}/)`

  return `You are writing a complete V2 lesson body file for StarCi Academy System Design Mastery course.

TARGET FILE TO WRITE: ${outPath}

STEP 1 — Read these reference files first (use Read tool):
1. ${RULES} (follow the deliverable structure and body format rules)
2. ${refPath} (completed V2 body — match its structure, section depth, length, separator usage)
3. ${MOUNT}\\contents\\${lesson.slug}\\vi.md (existing V1 content — topic reference for the concepts; read first 120 lines)

STEP 2 — Write the file at: ${outPath}

FILE FORMAT (EXACT header — body section holds the whole lesson):
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
- Language/stack for THIS body: ${specificLib} (${lang.runtime})
- Observable behavior (endpoints, identical JSON shape + HTTP status across ALL 4 languages): ${lesson.endpointsDesc}
- Port: ${lesson.port} (docker compose up)
- Repo: ${repoRef}
- E2E note: ${lesson.e2eNote}

CROSS-LANGUAGE PARITY (CRITICAL — this body is 1 of 4 languages for the same lesson):
- Every endpoint MUST return the SAME HTTP status code AND the SAME JSON value shape as the other languages. Use the contract above verbatim.
- The Lua scripts are byte-for-byte language-agnostic — present the SAME Lua in all 4 bodies; only the host client code differs.
- Numeric outcomes (exactly 5 granted, OK:20 TENANT:30, error %) are identical across TS/Java/C#/Go.

REQUIRED BODY SECTIONS (${isVI ? 'Vietnamese' : 'English'}):
## 1. ${isVI ? 'Lời mở đầu' : 'Opening'} — interview dialog (Senior deep question -> Mid shallow answer -> bridge that names the real mechanism)
## 2. ${isVI ? 'Các khái niệm cốt lõi' : 'Core concepts'} — short practice-first bridge paragraph
### 2.1. ${isVI ? 'Thực hành' : 'Hands-on'}
#### 2.1.1. ${isVI ? 'Chuẩn bị source code và môi trường' : 'Prepare source code and environment'} — git clone + cd .docker${!isTS ? ' (Note: the runnable demo uses the TypeScript Docker compose; the ' + specificLib + ' snippets in 2.1.3 show the equivalent idioms a maintainer would port)' : ''}
#### 2.1.2. ${isVI ? 'Kiến trúc / thành phần' : 'Architecture / components'} — component table + Mermaid flowchart TD (NOT LR) with an italic caption
#### 2.1.3. ${isVI ? 'Giải thích code và bản chất' : 'Code walkthrough and internals'} — 3 ${specificLib} snippets (and the shared Lua) with inline WHY comments (comments in ENGLISH even in the vi.md file)
#### 2.1.4. ${isVI ? 'Chuẩn bị và khởi chạy' : 'Prepare and launch'} — prerequisites + docker compose up
#### 2.1.5. ${isVI ? 'Kiểm thử' : 'Testing'} — one #####-level flow per endpoint group, numbered 2.1.5.1, 2.1.5.2, ... Each flow: PowerShell (Invoke-RestMethod) FIRST then curl, then the expected response labelled (HTTP <status>), then an italic *${isVI ? 'Kết luận:' : 'Conclusion:'} ...* line. Use callout :::muted for step sub-blocks; NEVER "### 1." style step headings.
#### 2.1.6. ${isVI ? 'Dọn dẹp' : 'Cleanup'} — docker compose down -v
#### 2.1.7. ${isVI ? 'Đọc thêm' : 'Further reading'} — 2 authoritative links
### 2.2. ${isVI ? 'Lý thuyết' : 'Theory'} — 3-5 subsections; last subsection = edge cases to watch out for
## 3. ${isVI ? 'Tổng kết' : 'Wrap-up'}
### 3.1. ${isVI ? 'Câu hỏi phỏng vấn thường gặp' : 'Common interview questions'} — 5 questions, each with a "${isVI ? 'Ý interviewer muốn nghe:' : 'What interviewers want to hear:'}" label

CRITICAL RULES:
- Em-dash (—) in prose, NEVER "--"
- ${isVI ? 'Tiếng Việt: đầy đủ dấu, không dịch ép thuật ngữ (giữ token bucket, sliding window, hash-tag, Lua...)' : 'English: professional, precise tone'}
- ALL code comments in ENGLISH (both vi.md and en.md)
- Mermaid: flowchart TD; italic caption required; NO <!-- @starci/seperator --> inside code fences or mermaid blocks
- Every code fence MUST have a language tag (\`\`\`bash, \`\`\`json, \`\`\`lua, \`\`\`${lang.keyword}, \`\`\`mermaid) — never a bare fence
- Body SUBSTANTIAL — hundreds of lines, matching the reference depth

Write the complete file using the Write tool.`
}

function lessonRootPrompt(lesson, locale) {
  const isVI = locale === 'vi'
  const outPath = `${MOUNT}\\contents\\${lesson.slug}\\${locale}.md`
  return `Rewrite the lesson root metadata file (V2 format, body/codeExplaining/codeImplementations EMPTY) for SD M16 ${lesson.slug}.

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
[First authoritative URL — official docs or a well-known engineering blog]
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

Use REAL authoritative URLs (Redis Lua/EVALSHA docs, Stripe/Cloudflare rate-limiting blogs, redis-cell, Figma/GitHub rate-limit engineering posts). NOT example.com. The description must be PLAIN TEXT (no markdown bold/backtick/links).
Write the complete file using the Write tool.`
}

function moduleRootPrompt(locale) {
  const isVI = locale === 'vi'
  const outPath = `${MOUNT}\\${locale}.md`
  return `Rewrite the module root file for SD M16 "Distributed Rate Limiter" (slot 15, 3 lessons).

TARGET FILE: ${outPath}
Read reference: ${REF_MOD}

Write with <!-- @starci/seperator --> separators:

# title
<!-- @starci/seperator -->
${isVI ? 'Distributed Rate Limiter: Token Bucket, Sliding Window và Quota phân tầng' : 'Distributed Rate Limiter: Token Bucket, Sliding Window, and Hierarchical Quota'}
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
${isVI ? 'Module xây dựng rate limiter phân tán: token bucket nguyên tử bằng Redis Lua, so sánh sliding window log và counter, rồi quota phân tầng đa tenant trên Redis Cluster với hash-tag — kiến thức lõi để bảo vệ API ở quy mô lớn mà không bị race và không bị hàng xóm ồn ào.' : 'Build a distributed rate limiter: an atomic token bucket with Redis Lua, a sliding-window log-vs-counter comparison, then a hierarchical multi-tenant quota on Redis Cluster with hash-tags — the core knowledge for protecting APIs at scale without races or noisy neighbours.'}
<!-- @starci/seperator -->
# previewContents
## 0
### text
<!-- @starci/seperator -->
${isVI ? 'Token bucket nguyên tử bằng Lua EVALSHA: 20 request đồng thời, đúng 5 được cấp.' : 'Atomic token bucket via Lua EVALSHA: 20 concurrent requests, exactly 5 granted.'}
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
${isVI ? 'Sliding window: log ZSET chính xác O(N) so với counter ước lượng O(1).' : 'Sliding window: exact O(N) ZSET log versus approximate O(1) counter.'}
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
${isVI ? 'Quota phân tầng user/tenant/global trên Redis Cluster, hash-tag và bù trừ DECR.' : 'Hierarchical user/tenant/global quota on Redis Cluster, hash-tags, and DECR compensation.'}
<!-- @starci/seperator -->

Write the complete file using the Write tool.`
}

function subEN(lessonSlug, challengeSlug) {
  const outPath = `${MOUNT}\\contents\\${lessonSlug}\\challenges\\${challengeSlug}\\submissions\\0\\en.md`
  return `Write the English submission file for SD M16 challenge: ${challengeSlug}.

TARGET FILE: ${outPath}

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
  const outPath = `${MOUNT}\\contents\\${lessonSlug}\\challenges\\${challengeSlug}\\submissions\\0\\vi.md`
  return `Write the Vietnamese submission file for SD M16 challenge: ${challengeSlug}.

TARGET FILE: ${outPath}

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
  const outPath = `${MOUNT}\\contents\\${lesson.slug}\\code-context.md`
  return `Write code-context.md for SD M16 lesson: ${lesson.slug}.

TARGET FILE: ${outPath}

Read the service source + compose to ground the document:
- ${REPO_LOCAL}\\${lesson.slug}\\${lesson.service}\\src
- ${REPO_LOCAL}\\${lesson.slug}\\.docker\\compose.yaml (if present)
Reference format: ${REF_CTX}

Document:
1. Canonical repo: StarCi-Academy/system-design-mastery-module-16-distributed-rate-limiter ; on-disk .repo/system-design-mastery-module-16-distributed-rate-limiter/${lesson.slug}/ ; NEEDS-RENAME: ${lesson.service} -> 0-typescript
2. Stack table (${lesson.stack})
3. Docker services (abridged compose) — note Redis single vs Redis Cluster 3-node for L2
4. API surface table (Method | Path | Status | Response body) — from: ${lesson.endpointsDesc}
5. The Lua script(s) used (these are the language-agnostic heart of the lesson)
6. E2E flows + status: ${lesson.e2eNote}
7. Language scaffold status (TypeScript=reference complete; Java=Lettuce, C#=StackExchange.Redis, Go=go-redis = PENDING maintainer)
8. Known issues if any (e.g. grokzen cluster image announces internal IP on Docker Desktop)

Write using the Write tool.`
}

function auditedPrompt(lesson) {
  const outPath = `${MOUNT}\\contents\\${lesson.slug}\\audited.md`
  const L = lesson.slug.charAt(0)
  return `Write audited.md for SD M16 lesson: ${lesson.slug}. Reference format: ${REF_AUD}

TARGET FILE: ${outPath}

Write a V2 audit log:
1. ## Audit ${TODAY} — SD M16 Distributed Rate Limiter L${L} V2 migration
2. ### Compliance checklist (interview dialog, mermaid TD, dual-platform PowerShell+curl, 5 interview Qs, refs >=2, isPremium=${lesson.isPremium}, verified=${TODAY}, English code comments, :::muted step callouts)
3. ### Bodies (4-language) — TypeScript=Complete; Java/C#/Go=PENDING maintainer scaffold; shared Lua identical across langs
4. ### Cross-lang parity: HTTP status + JSON value + numeric outcomes identical across TS/Java/C#/Go
5. ### Challenges (${lesson.challenges.length} tiers): ${lesson.challenges.join(', ')} — vi+en already authored; submissions/0 backfilled this pass
6. ### E2E checklist — flows: ${lesson.endpointsDesc}. E2E status: ${lesson.e2eNote}. Each flow: Pass criteria + Observed = PENDING maintainer/Gemini verify (Opus does not run E2E)
7. ### Gate result: 0 blocking issues (docs/v2-gate.py)
8. ### Open issues: Java/C#/Go PENDING scaffold; NEEDS-RENAME ${lesson.service}->0-typescript${L === '2' ? '; Redis Cluster grokzen internal-IP limitation on Docker Desktop' : ''}

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
  agent(subEN(lessonSlug, challengeSlug), { label: `sub-en:${challengeSlug}`, model: 'sonnet', phase: 'Submissions' })))
await parallel(allCh.map(({ lessonSlug, challengeSlug }) => () =>
  agent(subVI(lessonSlug, challengeSlug), { label: `sub-vi:${challengeSlug}`, model: 'sonnet', phase: 'Submissions' })))

phase('Finalize')
await parallel(LESSONS.map(lesson => () =>
  agent(codeContextPrompt(lesson), { label: `code-ctx:${lesson.slug}`, model: 'sonnet', phase: 'Finalize' })))
await parallel(LESSONS.map(lesson => () =>
  agent(auditedPrompt(lesson), { label: `audited:${lesson.slug}`, model: 'sonnet', phase: 'Finalize' })))

log('SD M16 Distributed Rate Limiter V2 migration complete.')
return { module: 'SD-M16', lessons: LESSONS.map(l => l.slug), status: 'done' }
