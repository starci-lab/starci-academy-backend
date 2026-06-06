export const meta = {
  name: 'v2-migrate-sd-m17-filestorage',
  description: 'V2 migrate SD M17 Distributed File Storage & CDN (slot 16) — roots + 4-lang bodies + author 2 missing L1 challenges + submissions + finalize',
  phases: [
    { title: 'Module root' },
    { title: 'L0 bodies' },
    { title: 'L1 bodies' },
    { title: 'L2 bodies' },
    { title: 'New challenges' },
    { title: 'Submissions' },
    { title: 'Finalize' },
  ]
}

const MOUNT = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\1-system-design-mastery\\modules\\16-distributed-file-storage-content-delivery-network'
const REPO_GH = 'https://github.com/StarCi-Academy/system-design-mastery-module-17-distributed-file-storage-content-delivery-network'
const REPO_LOCAL = 'C:\\Repositories\\ac\\starci-academy-backend\\.repo\\system-design-mastery-module-17-distributed-file-storage-content-delivery-network'
const RULES = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\rules\\v2-audit-rules.md'
const REF_BODY_VI = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\1-system-design-mastery\\modules\\6-redis-mastery\\contents\\0-redis-data-structures\\bodies\\0-typescript\\vi.md'
const REF_BODY_EN = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\1-system-design-mastery\\modules\\6-redis-mastery\\contents\\0-redis-data-structures\\bodies\\0-typescript\\en.md'
const REF_ROOT = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\1-system-design-mastery\\modules\\6-redis-mastery\\contents\\0-redis-data-structures\\vi.md'
const REF_MOD = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\1-system-design-mastery\\modules\\10-feed-ranking-and-distribution\\vi.md'
const REF_CTX = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\1-system-design-mastery\\modules\\6-redis-mastery\\contents\\0-redis-data-structures\\code-context.md'
const REF_AUD = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\1-system-design-mastery\\modules\\6-redis-mastery\\contents\\0-redis-data-structures\\audited.md'
// existing SD M17 L0 easy challenge = format reference for authoring the 2 new L1 challenges
const REF_CH = `${MOUNT}\\contents\\0-file-chunking-and-metadata-storage\\challenges\\0-file-chunking-and-metadata-storage-easy`
const TODAY = '2026-06-05'

const LESSONS = [
  {
    slug: '0-file-chunking-and-metadata-storage',
    titleVI: 'Chia chunk file và lưu metadata: nền tảng của object storage',
    titleEN: 'File chunking and metadata storage: the foundation of object storage',
    descVI: 'Bài học chia file thành các chunk cố định 1MB, băm SHA256 từng chunk một cách tất định, và lưu metadata chuẩn hóa (bảng files + chunks) trong Postgres — quan sát vì sao cùng một file luôn sinh ra cùng tập chunk và cùng storageObjectKey.',
    descEN: 'Split a file into fixed 1MB chunks, hash each chunk deterministically with SHA256, and store normalized metadata (files + chunks tables) in Postgres — observe why the same file always produces the same chunk set and the same storageObjectKey.',
    isPremium: false,
    port: 3000,
    service: 'metadata-service',
    stack: 'NestJS 10 + TypeORM + Postgres16',
    endpointsDesc: 'POST /api/files/upload {name,mimeType,totalSize,payload?} -> {fileId,chunkCount,chunks:[{chunkIndex,sha256,size,storageObjectKey}]} (HTTP 201); GET /api/files/:fileId -> manifest (HTTP 200, 404 if unknown); GET /api/files/:fileId/chunks (HTTP 200)',
    keyConcepts: 'fixed 1MB chunking (CHUNK_SIZE_BYTES); deterministic per-chunk SHA256; normalized metadata (files 1->N chunks); storageObjectKey = objects/<fileId>/<chunkIndex>-<shaPrefix>; why chunking enables dedup/resumable/parallel transfer downstream',
    e2eNote: 'TypeScript reference E2E PASS 5/5 (deterministic chunking + manifest + 404 unknown) per source repo; Java/C#/Go PENDING maintainer scaffold',
    challenges: [
      '0-file-chunking-and-metadata-storage-easy',
      '1-file-chunking-and-metadata-storage-medium',
      '2-erasure-coding-vs-replication-cost-analysis-hard',
      '3-100tb-cluster-with-rebalancing-and-recovery-insane',
    ],
  },
  {
    slug: '1-data-deduplication-and-resumable-uploads',
    titleVI: 'Khử trùng lặp dữ liệu và upload có thể tiếp tục (resumable)',
    titleEN: 'Data deduplication and resumable uploads',
    descVI: 'Bài học khử trùng lặp theo nội dung (index SHA256 trong bảng chunk_dedup, tái dùng object key) và upload tus-like có thể tiếp tục bằng Upload-Offset trên Redis — quan sát ba lần upload chỉ tạo hai chunk duy nhất, tiết kiệm 33.33%, và offset sai trả về 400.',
    descEN: 'Content-defined deduplication (a SHA256 index in a chunk_dedup table that reuses the object key) and tus-like resumable uploads via an Upload-Offset tracked in Redis — observe three uploads producing only two unique chunks, 33.33% saved, and a wrong offset returning 400.',
    isPremium: false,
    port: 3000,
    service: 'upload-service',
    stack: 'NestJS + ioredis + TypeORM + Postgres16 + Redis7',
    endpointsDesc: 'POST /api/uploads {name,totalSize} -> {sessionId,uploadOffset} (HTTP 201); PATCH /api/uploads/:id {offset,data,sha256} (or header Upload-Offset) -> {deduped,storageObjectKey,bytesWritten,bytesSaved} (HTTP 200; wrong offset -> HTTP 400); GET /api/uploads/:id (HTTP 200); GET /api/dedup/stats -> {uniqueChunks,totalReferences,savingsPercent} (HTTP 200)',
    keyConcepts: 'content-defined dedup (SHA256 index in chunk_dedup; identical chunk reuses the same object key, ref_count++); resumable upload (tus-like; Upload-Offset resume; wrong offset -> 400 conflict); ref_count garbage collection; session in Postgres, live offset in Redis upload:<sessionId>',
    e2eNote: 'TypeScript reference E2E PASS 7/7 (3 uploads -> 2 unique -> 33.33% saved; resume; wrong-offset 400) per source repo; Java/C#/Go PENDING maintainer scaffold',
    challenges: [
      '0-data-deduplication-and-resumable-uploads-easy',
      '1-data-deduplication-and-resumable-uploads-medium',
      '2-content-defined-chunking-rolling-hash-hard',
      '3-distributed-dedup-with-bloom-filter-100tb-insane',
    ],
  },
  {
    slug: '2-global-cdn-distribution',
    titleVI: 'Phân phối CDN toàn cầu: edge cache nginx và origin shielding',
    titleEN: 'Global CDN distribution: nginx edge cache and origin shielding',
    descVI: 'Bài học đặt nginx làm edge cache trước một cdn-api chỉ nội bộ (origin shielding), dùng proxy_cache TTL 60s và ETag từ SHA256 — quan sát request đầu MISS ~162ms rồi HIT ~3ms (nhanh ~50x), và origin không bao giờ lộ cổng ra ngoài.',
    descEN: 'Put nginx as an edge cache in front of an internal-only cdn-api (origin shielding), using proxy_cache with a 60s TTL and an ETag derived from SHA256 — observe the first request MISS at ~162ms then HIT at ~3ms (~50x faster), while the origin never exposes a host port.',
    isPremium: true,
    port: 3000,
    service: 'cdn-api',
    stack: 'NestJS + TypeORM + Postgres16 + nginx edge cache (nginx host 3034; cdn-api internal-only)',
    endpointsDesc: 'GET /cdn/edge/:fileId/:chunkIndex (via nginx) -> body + headers X-Cache:MISS|HIT|BYPASS, ETag, Cache-Control:public,max-age=60 (HTTP 200); GET /api/cdn/origin/:fileId/:chunkIndex (origin bypass) (HTTP 200); GET /api/cdn/list (HTTP 200)',
    keyConcepts: 'origin shielding (cdn-api has NO host port; only nginx reaches it); nginx proxy_cache with 60s TTL; X-Cache MISS vs HIT; ETag from chunk SHA256 (conditional requests); artificial 150ms origin latency to make caching observable; why an edge layer protects and accelerates the origin',
    e2eNote: 'TypeScript reference E2E PASS 6/6 (MISS 162ms -> HIT 3ms ~50x; origin not host-exposed) per source repo; Java/C#/Go PENDING maintainer scaffold',
    challenges: [
      '0-global-cdn-distribution-easy',
      '1-global-cdn-distribution-medium',
      '2-multi-region-cdn-with-origin-shielding-and-purge-hard',
      '3-1m-rps-cdn-with-real-user-monitoring-and-failover-insane',
    ],
  },
]

// The 2 challenges to AUTHOR fresh (L1 was missing easy + medium)
const NEW_CHALLENGES = [
  {
    lessonSlug: '1-data-deduplication-and-resumable-uploads',
    folder: '0-data-deduplication-and-resumable-uploads-easy', difficulty: 'easy',
    purpose: 'Reproduce content-defined dedup: upload the same chunk content twice and confirm via GET /api/dedup/stats that the second upload is deduped (bytesSaved > 0, uniqueChunks unchanged).',
  },
  {
    lessonSlug: '1-data-deduplication-and-resumable-uploads',
    folder: '1-data-deduplication-and-resumable-uploads-medium', difficulty: 'medium',
    purpose: 'Implement a resumable upload: start a session, send a partial chunk, interrupt, then resume from the server-reported Upload-Offset; confirm a wrong offset returns HTTP 400 and the resumed upload completes correctly.',
  },
]

const LANGS = [
  { folder: '0-typescript', keyword: 'typescript', lib: 'NestJS + TypeORM + pg', runtime: 'Node.js 20 + TypeScript 5' },
  { folder: '1-java', keyword: 'java', lib: 'Spring Boot 3 + Spring Data JPA + Postgres', runtime: 'Java 21 + Maven' },
  { folder: '2-csharp', keyword: 'csharp', lib: 'ASP.NET Core 8 + EF Core + Npgsql', runtime: '.NET 8' },
  { folder: '3-go', keyword: 'go', lib: 'Gin + pgx', runtime: 'Go 1.22' },
]

const LANG_OVERRIDES = {
  '1-data-deduplication-and-resumable-uploads': {
    typescript: 'NestJS + TypeORM + pg + ioredis (Upload-Offset in Redis)',
    java: 'Spring Boot 3 + Spring Data JPA + Lettuce (Upload-Offset in Redis)',
    csharp: 'ASP.NET Core 8 + EF Core + StackExchange.Redis (Upload-Offset in Redis)',
    go: 'Gin + pgx + go-redis (Upload-Offset in Redis)',
  },
  '2-global-cdn-distribution': {
    typescript: 'NestJS + TypeORM + pg, behind nginx proxy_cache (origin shielding)',
    java: 'Spring Boot 3 + JPA, behind nginx proxy_cache (origin shielding)',
    csharp: 'ASP.NET Core 8 + EF Core, behind nginx proxy_cache (origin shielding)',
    go: 'Gin + pgx, behind nginx proxy_cache (origin shielding)',
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
3. ${MOUNT}\\contents\\${lesson.slug}\\vi.md (existing V1 content — topic reference; read first 120 lines)

STEP 2 — Write the file at: ${outPath}

FILE FORMAT (EXACT header):
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

CROSS-LANGUAGE PARITY (CRITICAL — 1 of 4 languages for the same lesson):
- Every endpoint MUST return the SAME HTTP status code AND the SAME JSON value shape as the other languages. Use the contract above verbatim (note POST -> 201, GET/PATCH -> 200, wrong offset -> 400).
- SHA256 hashing, the 1MB chunk size, the 33.33% saved figure, and the MISS/HIT behavior are identical across TS/Java/C#/Go.

REQUIRED BODY SECTIONS (${isVI ? 'Vietnamese' : 'English'}):
## 1. ${isVI ? 'Lời mở đầu' : 'Opening'} — interview dialog (Senior deep question -> Mid shallow answer -> bridge naming the real mechanism)
## 2. ${isVI ? 'Các khái niệm cốt lõi' : 'Core concepts'} — short practice-first bridge paragraph
### 2.1. ${isVI ? 'Thực hành' : 'Hands-on'}
#### 2.1.1. ${isVI ? 'Chuẩn bị source code và môi trường' : 'Prepare source code and environment'} — git clone + cd .docker${!isTS ? ' (Note: runnable demo uses the TypeScript Docker compose; the ' + specificLib + ' snippets in 2.1.3 show the equivalent idioms a maintainer would port)' : ''}
#### 2.1.2. ${isVI ? 'Kiến trúc / thành phần' : 'Architecture / components'} — component table + Mermaid flowchart TD (NOT LR) with italic caption
#### 2.1.3. ${isVI ? 'Giải thích code và bản chất' : 'Code walkthrough and internals'} — 3 ${specificLib} snippets with inline WHY comments (comments in ENGLISH even in vi.md)
#### 2.1.4. ${isVI ? 'Chuẩn bị và khởi chạy' : 'Prepare and launch'} — prerequisites + docker compose up
#### 2.1.5. ${isVI ? 'Kiểm thử' : 'Testing'} — one #####-level flow per endpoint group numbered 2.1.5.1, 2.1.5.2, ... Each flow: PowerShell (Invoke-RestMethod) FIRST then curl, then expected response labelled (HTTP <status>), then italic *${isVI ? 'Kết luận:' : 'Conclusion:'} ...*. Use :::muted callouts for step sub-blocks; NEVER "### 1." step headings.
#### 2.1.6. ${isVI ? 'Dọn dẹp' : 'Cleanup'} — docker compose down -v
#### 2.1.7. ${isVI ? 'Đọc thêm' : 'Further reading'} — 2 authoritative links
### 2.2. ${isVI ? 'Lý thuyết' : 'Theory'} — 3-5 subsections; last = edge cases
## 3. ${isVI ? 'Tổng kết' : 'Wrap-up'}
### 3.1. ${isVI ? 'Câu hỏi phỏng vấn thường gặp' : 'Common interview questions'} — 5 questions, each with "${isVI ? 'Ý interviewer muốn nghe:' : 'What interviewers want to hear:'}"

CRITICAL RULES:
- Em-dash (—) in prose, NEVER "--"
- ${isVI ? 'Tiếng Việt: đầy đủ dấu, không dịch ép thuật ngữ (giữ chunk, SHA256, dedup, Upload-Offset, origin shielding, ETag...)' : 'English: professional, precise tone'}
- ALL code comments in ENGLISH (both files)
- Mermaid flowchart TD + italic caption; NO separator inside fences/mermaid; every fence has a language tag (no bare fence)
- Body SUBSTANTIAL — hundreds of lines, matching the reference depth

Write the complete file using the Write tool.`
}

function lessonRootPrompt(lesson, locale) {
  const isVI = locale === 'vi'
  const outPath = `${MOUNT}\\contents\\${lesson.slug}\\${locale}.md`
  return `Rewrite the lesson root metadata file (V2, body/codeExplaining/codeImplementations EMPTY) for SD M17 ${lesson.slug}.

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

Use REAL authoritative URLs (content-addressable storage, tus resumable upload protocol, nginx proxy_cache docs, Dropbox/S3 engineering blogs, erasure coding papers). NOT example.com. Description = PLAIN TEXT (no markdown).
Write the complete file using the Write tool.`
}

function moduleRootPrompt(locale) {
  const isVI = locale === 'vi'
  const outPath = `${MOUNT}\\${locale}.md`
  return `Rewrite the module root file for SD M17 "Distributed File Storage & CDN" (slot 16, 3 lessons).

TARGET FILE: ${outPath}
Read reference: ${REF_MOD}

Write with <!-- @starci/seperator --> separators:

# title
<!-- @starci/seperator -->
${isVI ? 'Distributed File Storage & CDN: Chunking, Dedup và Edge Caching' : 'Distributed File Storage & CDN: Chunking, Dedup, and Edge Caching'}
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
${isVI ? 'Module xây dựng hệ lưu trữ file phân tán: chia chunk và lưu metadata, khử trùng lặp theo nội dung cùng upload resumable, rồi phân phối qua CDN nginx với origin shielding và edge cache — kiến thức lõi để thiết kế object storage và CDN quy mô lớn.' : 'Build a distributed file storage system: chunking and metadata, content-defined deduplication with resumable uploads, then delivery through an nginx CDN with origin shielding and edge caching — the core knowledge for designing large-scale object storage and CDNs.'}
<!-- @starci/seperator -->
# previewContents
## 0
### text
<!-- @starci/seperator -->
${isVI ? 'Chia chunk 1MB + SHA256 tất định + metadata chuẩn hóa trong Postgres.' : 'Fixed 1MB chunking + deterministic SHA256 + normalized metadata in Postgres.'}
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
${isVI ? 'Khử trùng lặp theo nội dung (33.33% saved) và upload resumable kiểu tus.' : 'Content-defined dedup (33.33% saved) and tus-style resumable uploads.'}
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
${isVI ? 'CDN nginx: edge cache 60s, X-Cache MISS/HIT (~50x) và origin shielding.' : 'nginx CDN: 60s edge cache, X-Cache MISS/HIT (~50x), and origin shielding.'}
<!-- @starci/seperator -->

Write the complete file using the Write tool.`
}

function newChallengePrompt(nc) {
  const lessonSlug = nc.lessonSlug
  return `Author a FRESH V2 challenge + submission for SD M17 lesson "${lessonSlug}", tier ${nc.difficulty}, folder "${nc.folder}". This challenge is MISSING and must be authored from scratch (the lesson currently only has hard+insane).

STEP A — read the format from an existing SD M17 challenge: ${REF_CH}\\vi.md, ${REF_CH}\\en.md, ${REF_CH}\\submissions\\0\\vi.md, ${REF_CH}\\submissions\\0\\en.md. Match its section set EXACTLY (# title, # description PLAIN TEXT, # requirements with ## i -> ### purpose/### technicalConstraints/### proTipsHints/### score/### promptText [scores sum 100], optional ### forbidden, # outputs, # prerequisites, # difficulty, # score=100, # verified). Also read the lesson V1 content for grounding: ${MOUNT}\\contents\\${lessonSlug}\\vi.md (first 120 lines).

STEP B — Tier GOAL (${nc.difficulty}): ${nc.purpose}
The solution is a backend service (the lesson stack: NestJS + ioredis + TypeORM + Postgres + Redis; learners may use any of TS/Java/C#/Go). The challenge must observably exercise dedup/resumable behavior via the endpoints: POST /api/uploads, PATCH /api/uploads/:id (Upload-Offset), GET /api/dedup/stats. Difficulty ${nc.difficulty}: easy = reproduce one mechanism end to end; medium = combine resume + a correctness edge (wrong-offset 400).

STEP C — write 4 files (Write tool):
- ${MOUNT}\\contents\\${lessonSlug}\\challenges\\${nc.folder}\\vi.md
- ${MOUNT}\\contents\\${lessonSlug}\\challenges\\${nc.folder}\\en.md
- ${MOUNT}\\contents\\${lessonSlug}\\challenges\\${nc.folder}\\submissions\\0\\vi.md
- ${MOUNT}\\contents\\${lessonSlug}\\challenges\\${nc.folder}\\submissions\\0\\en.md
difficulty=${nc.difficulty}, requirement scores sum 100, submission score=100, type githubUrl, verified=${TODAY}. en.md code comments ENGLISH; vi.md đầy đủ dấu; :::muted callouts (no "### 1." steps).
Return ONLY: {"folder":"${nc.folder}"}.`
}

function subEN(lessonSlug, challengeSlug) {
  const outPath = `${MOUNT}\\contents\\${lessonSlug}\\challenges\\${challengeSlug}\\submissions\\0\\en.md`
  return `Write the English submission file for SD M17 challenge: ${challengeSlug}. (Skip if it already exists with score 100 — overwrite is fine.)

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
  return `Write the Vietnamese submission file for SD M17 challenge: ${challengeSlug}.

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
  return `Write code-context.md for SD M17 lesson: ${lesson.slug}.

TARGET FILE: ${outPath}

Read the service source + compose:
- ${REPO_LOCAL}\\${lesson.slug}\\${lesson.service}\\src
- ${REPO_LOCAL}\\${lesson.slug}\\.docker\\compose.yaml (if present)
- ${REPO_LOCAL}\\${lesson.slug}\\.docker\\nginx.conf (L2 only, if present)
Reference format: ${REF_CTX}

Document:
1. Canonical repo: StarCi-Academy/system-design-mastery-module-17-distributed-file-storage-content-delivery-network ; on-disk .repo/system-design-mastery-module-17-...\\${lesson.slug}/ ; NEEDS-RENAME: ${lesson.service} -> 0-typescript
2. Stack table (${lesson.stack})
3. Docker services (abridged compose) — note nginx edge + internal-only cdn-api for L2
4. API surface table (Method | Path | Status | Response body) — from: ${lesson.endpointsDesc}
5. E2E flows + status: ${lesson.e2eNote}
6. Language scaffold status (TypeScript=reference complete; Java=JPA, C#=EF Core, Go=pgx = PENDING maintainer)
7. Known issues if any

Write using the Write tool.`
}

function auditedPrompt(lesson) {
  const outPath = `${MOUNT}\\contents\\${lesson.slug}\\audited.md`
  const L = lesson.slug.charAt(0)
  const note = L === '1' ? '; L1 easy+medium challenges authored fresh this pass (were missing)' : (L === '2' ? '; L2 duplicate challenge removed pre-flight' : '')
  return `Write audited.md for SD M17 lesson: ${lesson.slug}. Reference format: ${REF_AUD}

TARGET FILE: ${outPath}

Write a V2 audit log:
1. ## Audit ${TODAY} — SD M17 Distributed File Storage L${L} V2 migration
2. ### Compliance checklist (interview dialog, mermaid TD, dual-platform PowerShell+curl, 5 interview Qs, refs >=2, isPremium=${lesson.isPremium}, verified=${TODAY}, English code comments, :::muted step callouts)
3. ### Bodies (4-language) — TypeScript=Complete; Java/C#/Go=PENDING maintainer scaffold
4. ### Cross-lang parity: HTTP status + JSON value identical across TS/Java/C#/Go (POST 201, GET/PATCH 200, wrong-offset 400)
5. ### Challenges (${lesson.challenges.length} tiers): ${lesson.challenges.join(', ')} — vi+en + submissions/0${note}
6. ### E2E checklist — flows: ${lesson.endpointsDesc}. E2E status: ${lesson.e2eNote}. Each flow: Pass criteria + Observed = PENDING maintainer/Gemini verify (Opus does not run E2E)
7. ### Gate result: 0 blocking issues (docs/v2-gate.py)
8. ### Open issues: Java/C#/Go PENDING scaffold; NEEDS-RENAME ${lesson.service}->0-typescript

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

phase('New challenges')
await parallel(NEW_CHALLENGES.map(nc => () =>
  agent(newChallengePrompt(nc), { label: `new-ch:${nc.difficulty}`, phase: 'New challenges' }).catch(() => null)))

phase('Submissions')
const allCh = LESSONS.flatMap(l => l.challenges.map(c => ({ lessonSlug: l.slug, challengeSlug: c })))
await parallel(allCh.map(({ lessonSlug, challengeSlug }) => () =>
  agent(subEN(lessonSlug, challengeSlug), { label: `sub-en:${challengeSlug.slice(-14)}`, model: 'sonnet', phase: 'Submissions' })))
await parallel(allCh.map(({ lessonSlug, challengeSlug }) => () =>
  agent(subVI(lessonSlug, challengeSlug), { label: `sub-vi:${challengeSlug.slice(-14)}`, model: 'sonnet', phase: 'Submissions' })))

phase('Finalize')
await parallel(LESSONS.map(lesson => () =>
  agent(codeContextPrompt(lesson), { label: `code-ctx:${lesson.slug}`, model: 'sonnet', phase: 'Finalize' })))
await parallel(LESSONS.map(lesson => () =>
  agent(auditedPrompt(lesson), { label: `audited:${lesson.slug}`, model: 'sonnet', phase: 'Finalize' })))

log('SD M17 Distributed File Storage V2 migration complete.')
return { module: 'SD-M17', lessons: LESSONS.map(l => l.slug), status: 'done' }
