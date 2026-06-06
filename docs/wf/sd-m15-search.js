
export const meta = {
  name: 'v2-migrate-sd-m15-search',
  description: 'V2 migrate SD M15 Distributed Search & Autocomplete (slot 14) — roots + 4-lang bodies + submissions + finalize',
  phases: [
    { title: 'Module root' },
    { title: 'L0 bodies' },
    { title: 'L1 bodies' },
    { title: 'L2 bodies' },
    { title: 'Submissions' },
    { title: 'Finalize' },
  ]
}

const MOUNT = 'C:\\Repositories\\ac\\starci-academy-backend\\.mount\\data\\courses\\1-system-design-mastery\\modules\\14-distributed-search-autocomplete-system'
const REPO_GH = 'https://github.com/StarCi-Academy/system-design-mastery-module-15-distributed-search-autocomplete-system'
const REPO_LOCAL = 'C:\\Repositories\\ac\\starci-academy-backend\\.repo\\system-design-mastery-module-15-distributed-search-autocomplete-system'
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
    slug: '0-inverted-index-and-bm25-from-scratch',
    titleVI: 'Inverted index và BM25 từ đầu: xếp hạng văn bản không cần thư viện search',
    titleEN: 'Inverted index and BM25 from scratch: ranking text without a search library',
    descVI: 'Bài học tự xây inverted index (term → posting list) và công thức xếp hạng BM25 (TF-IDF + chuẩn hóa độ dài, k1=1.2 b=0.75) trong NestJS, persist snapshot xuống Redis — quan sát vì sao cùng một truy vấn đa từ luôn cho thứ hạng giống nhau và bền qua restart.',
    descEN: 'Build an inverted index (term to posting list) and the BM25 ranking formula (TF-IDF plus length normalization, k1=1.2 b=0.75) from scratch in NestJS, persisting a snapshot to Redis — observe why the same multi-term query always yields the same ranking and survives a restart.',
    isPremium: false,
    port: 3000,
    service: 'bm25-search-service',
    stack: 'NestJS + Redis (JSON snapshot persist, AOF)',
    endpointsDesc: 'GET /api/search?q=&limit= -> {query,hits:[{id,score,content}]} (BM25 k1=1.2 b=0.75); GET /api/search/stats -> {numDocs,vocabSize,avgdl}; POST /api/search/index {id,content}; DELETE /api/search/index/:id; POST /api/search/reset',
    keyConcepts: 'inverted index (term -> posting list); BM25 = IDF * (tf*(k1+1)) / (tf + k1*(1-b+b*dl/avgdl)); TF-IDF intuition; document length normalization (avgdl); tokenization + lowercasing; Redis JSON snapshot persistence (rebuild index on boot)',
    e2eNote: 'TypeScript reference E2E PASS 5/5 (multi-term IDF ranking, persist across restart, delete cleanup) per source repo; Java/C#/Go PENDING maintainer scaffold',
    challenges: [
      '0-inverted-index-and-bm25-from-scratch-easy',
      '1-inverted-index-and-bm25-from-scratch-medium',
      '2-bm25-sharded-with-parallel-merge-hard',
      '3-100m-doc-bm25-low-latency-insane',
    ],
  },
  {
    slug: '1-vector-search-with-embeddings',
    titleVI: 'Vector search với embeddings: tìm theo ngữ nghĩa bằng pgvector và HNSW',
    titleEN: 'Vector search with embeddings: semantic retrieval with pgvector and HNSW',
    descVI: 'Bài học sinh embedding 384 chiều (all-MiniLM-L6-v2) cho tài liệu và truy vấn, lưu vào Postgres + pgvector với index HNSW, rồi tìm theo khoảng cách cosine — quan sát hai câu không trùng một từ nào vẫn match được vì gần nhau trong không gian vector.',
    descEN: 'Generate 384-dimensional embeddings (all-MiniLM-L6-v2) for documents and queries, store them in Postgres + pgvector with an HNSW index, and retrieve by cosine distance — observe how two sentences sharing zero tokens still match because they sit close in vector space.',
    isPremium: false,
    port: 3000,
    service: 'vector-search-service',
    stack: 'NestJS + Postgres16 + pgvector + HNSW + embedding model (all-MiniLM-L6-v2, 384-dim)',
    endpointsDesc: 'GET /api/search?q=&limit= -> {query,hits:[{id,content,similarity}]} (cosine distance <=>); GET /api/search/stats; POST /api/search/index {id,content}; DELETE /api/search/index/:id; POST /api/search/reset',
    keyConcepts: 'dense embeddings (384-dim, L2-normalized); cosine distance vs euclidean; pgvector <=> operator; HNSW approximate-nearest-neighbour index (graph layers, ef_search recall/latency trade-off); deterministic/reproducible embeddings; semantic match without token overlap',
    e2eNote: 'TypeScript reference E2E PASS 4/4 (zero-token-overlap semantic match, persist across restart) per source repo; Java/C#/Go PENDING maintainer scaffold',
    challenges: [
      '0-vector-search-with-embeddings-easy',
      '1-vector-search-with-embeddings-medium',
      '2-vector-index-hnsw-tuning-recall-vs-latency-hard',
      '3-1b-vector-multi-shard-hybrid-filter-insane',
    ],
  },
  {
    slug: '2-hybrid-search-with-rrf-reranking',
    titleVI: 'Hybrid search với RRF: hợp nhất BM25 và vector bằng Reciprocal Rank Fusion',
    titleEN: 'Hybrid search with RRF: fusing BM25 and vector results via Reciprocal Rank Fusion',
    descVI: 'Bài học dựng orchestrator fan-out song song tới service BM25 và service vector, rồi hợp nhất hai bảng xếp hạng bằng Reciprocal Rank Fusion (RRF, k=60) — quan sát vì sao tài liệu được cả hai phía đồng thuận leo lên đầu, và hệ thống vẫn trả kết quả khi một nhánh upstream lỗi.',
    descEN: 'Build an orchestrator that fans out in parallel to the BM25 service and the vector service, then fuses the two rankings with Reciprocal Rank Fusion (RRF, k=60) — observe why documents both sides agree on rise to the top, and how the system still returns results when one upstream branch fails.',
    isPremium: true,
    port: 3000,
    service: 'hybrid-search-service',
    stack: 'NestJS orchestrator fan-out to BM25 (L0) + vector (L1) over Docker DNS; RRF k=60',
    endpointsDesc: 'GET /api/search?q=&limit= -> {mode:"hybrid_rrf",hits:[{id,content,rrfScore,sources:{bm25Rank,vectorRank}}]}; GET /api/search/bm25 (passthrough); GET /api/search/vector (passthrough)',
    keyConcepts: 'Reciprocal Rank Fusion (Cormack 2009): rrfScore = sum over lists of 1/(k+rank_i), k=60; rank-based fusion (no score normalization needed); cross-list agreement boosts consensus docs; parallel fan-out (Promise.all equivalent); failure isolation (.catch upstream -> degrade not crash)',
    e2eNote: 'TypeScript reference E2E PASS 3/3 (RRF consensus ranking, upstream-failure degradation) per source repo; Java/C#/Go PENDING maintainer scaffold',
    challenges: [
      '0-hybrid-search-with-rrf-reranking-easy',
      '1-hybrid-search-with-rrf-reranking-medium',
      '2-rrf-with-reranker-llm-quality-eval-hard',
      '3-multi-modal-search-text-vector-image-1m-rps-insane',
    ],
  },
]

const LANGS = [
  { folder: '0-typescript', keyword: 'typescript', lib: 'NestJS + ioredis', runtime: 'Node.js 20 + TypeScript 5' },
  { folder: '1-java', keyword: 'java', lib: 'Spring Boot 3 + Jedis', runtime: 'Java 21 + Maven' },
  { folder: '2-csharp', keyword: 'csharp', lib: 'ASP.NET Core 8 + StackExchange.Redis', runtime: '.NET 8' },
  { folder: '3-go', keyword: 'go', lib: 'Gin + go-redis', runtime: 'Go 1.22' },
]

const LANG_OVERRIDES = {
  '0-inverted-index-and-bm25-from-scratch': {
    typescript: 'NestJS + ioredis (inverted index + BM25 computed in-process; Redis holds the JSON snapshot)',
    java: 'Spring Boot 3 + Jedis (inverted index + BM25 in-process; Redis snapshot)',
    csharp: 'ASP.NET Core 8 + StackExchange.Redis (inverted index + BM25 in-process; Redis snapshot)',
    go: 'Gin + go-redis (inverted index + BM25 in-process; Redis snapshot)',
  },
  '1-vector-search-with-embeddings': {
    typescript: 'NestJS + pg + pgvector + @xenova/transformers (all-MiniLM-L6-v2, 384-dim)',
    java: 'Spring Boot 3 + JDBC + pgvector + DJL/ONNX Runtime (all-MiniLM-L6-v2, 384-dim)',
    csharp: 'ASP.NET Core 8 + Npgsql + Pgvector + ONNX Runtime (all-MiniLM-L6-v2, 384-dim)',
    go: 'Gin + pgx + pgvector-go + onnxruntime-go (all-MiniLM-L6-v2, 384-dim)',
  },
  '2-hybrid-search-with-rrf-reranking': {
    typescript: 'NestJS orchestrator + fetch fan-out (RRF k=60 in-process)',
    java: 'Spring Boot 3 + WebClient parallel fan-out (RRF k=60 in-process)',
    csharp: 'ASP.NET Core 8 + HttpClient parallel fan-out (RRF k=60 in-process)',
    go: 'Gin + net/http parallel fan-out (RRF k=60 in-process)',
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
- Code snippets show ${specificLib} idioms, but the OBSERVABLE behavior (status codes, JSON body in 2.1.5.N flows) is identical across TS/Java/C#/Go.
- The BM25 formula / cosine distance / RRF formula are language-agnostic maths — present the SAME numbers.

REQUIRED BODY SECTIONS (${isVI ? 'Vietnamese' : 'English'}):
## 1. ${isVI ? 'Lời mở đầu' : 'Opening'} — interview dialog (Senior deep question -> Mid shallow answer -> bridge that names the real mechanism)
## 2. ${isVI ? 'Các khái niệm cốt lõi' : 'Core concepts'} — short practice-first bridge paragraph
### 2.1. ${isVI ? 'Thực hành' : 'Hands-on'}
#### 2.1.1. ${isVI ? 'Chuẩn bị source code và môi trường' : 'Prepare source code and environment'} — git clone + cd .docker${!isTS ? ' (Note: the runnable demo uses the TypeScript Docker compose; the ' + specificLib + ' snippets in 2.1.3 show the equivalent idioms a maintainer would port)' : ''}
#### 2.1.2. ${isVI ? 'Kiến trúc / thành phần' : 'Architecture / components'} — component table + Mermaid flowchart TD (NOT LR) with an italic caption
#### 2.1.3. ${isVI ? 'Giải thích code và bản chất' : 'Code walkthrough and internals'} — 3 ${specificLib} snippets with inline WHY comments (comments in ENGLISH even in the vi.md file)
#### 2.1.4. ${isVI ? 'Chuẩn bị và khởi chạy' : 'Prepare and launch'} — prerequisites + docker compose up
#### 2.1.5. ${isVI ? 'Kiểm thử' : 'Testing'} — one #####-level flow per endpoint group, numbered 2.1.5.1, 2.1.5.2, ... Each flow: PowerShell (Invoke-RestMethod) FIRST then curl, then the expected response labelled (HTTP <status>), then an italic *${isVI ? 'Kết luận:' : 'Conclusion:'} ...* line. Use callout :::muted for step sub-blocks; NEVER "### 1." style step headings.
#### 2.1.6. ${isVI ? 'Dọn dẹp' : 'Cleanup'} — docker compose down -v
#### 2.1.7. ${isVI ? 'Đọc thêm' : 'Further reading'} — 2 authoritative links
### 2.2. ${isVI ? 'Lý thuyết' : 'Theory'} — 3-5 subsections; last subsection = edge cases to watch out for
## 3. ${isVI ? 'Tổng kết' : 'Wrap-up'}
### 3.1. ${isVI ? 'Câu hỏi phỏng vấn thường gặp' : 'Common interview questions'} — 5 questions, each with a "${isVI ? 'Ý interviewer muốn nghe:' : 'What interviewers want to hear:'}" label

CRITICAL RULES:
- Em-dash (—) in prose, NEVER "--"
- ${isVI ? 'Tiếng Việt: đầy đủ dấu, không dịch ép thuật ngữ (giữ inverted index, embedding, cosine, RRF...)' : 'English: professional, precise tone'}
- ALL code comments in ENGLISH (both vi.md and en.md)
- Mermaid: flowchart TD; italic caption required; NO <!-- @starci/seperator --> inside code fences or mermaid blocks
- Every code fence MUST have a language tag (\`\`\`bash, \`\`\`json, \`\`\`${lang.keyword}, \`\`\`mermaid) — never a bare fence
- Body SUBSTANTIAL — hundreds of lines, matching the reference depth

Write the complete file using the Write tool.`
}

function lessonRootPrompt(lesson, locale) {
  const isVI = locale === 'vi'
  const outPath = `${MOUNT}\\contents\\${lesson.slug}\\${locale}.md`
  return `Rewrite the lesson root metadata file (V2 format, body/codeExplaining/codeImplementations EMPTY) for SD M15 ${lesson.slug}.

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

Use REAL authoritative URLs (BM25/Okapi paper, pgvector docs, HNSW paper, RRF Cormack 2009, Elastic blog). NOT example.com. The description must be PLAIN TEXT (no markdown bold/backtick/links).
Write the complete file using the Write tool.`
}

function moduleRootPrompt(locale) {
  const isVI = locale === 'vi'
  const outPath = `${MOUNT}\\${locale}.md`
  return `Rewrite the module root file for SD M15 "Distributed Search & Autocomplete" (slot 14, 3 lessons).

TARGET FILE: ${outPath}
Read reference: ${REF_MOD}

Write with <!-- @starci/seperator --> separators:

# title
<!-- @starci/seperator -->
${isVI ? 'Distributed Search & Autocomplete: BM25, Vector Search và Hybrid RRF' : 'Distributed Search & Autocomplete: BM25, Vector Search, and Hybrid RRF'}
<!-- @starci/seperator -->
# description
<!-- @starci/seperator -->
${isVI ? 'Module xây dựng công cụ tìm kiếm từ nền tảng: tự cài inverted index và BM25, thêm vector search ngữ nghĩa bằng pgvector/HNSW, rồi hợp nhất cả hai bằng Reciprocal Rank Fusion — kiến thức lõi để thiết kế hệ thống search và autocomplete quy mô lớn.' : 'Build a search engine from the ground up: implement an inverted index and BM25 by hand, add semantic vector search with pgvector/HNSW, then fuse both with Reciprocal Rank Fusion — the core knowledge for designing large-scale search and autocomplete systems.'}
<!-- @starci/seperator -->
# previewContents
## 0
### text
<!-- @starci/seperator -->
${isVI ? 'Inverted index + BM25 từ đầu, persist snapshot xuống Redis.' : 'Inverted index + BM25 from scratch, snapshot persisted to Redis.'}
<!-- @starci/seperator -->
## 1
### text
<!-- @starci/seperator -->
${isVI ? 'Vector search ngữ nghĩa với embeddings 384-dim, pgvector và index HNSW.' : 'Semantic vector search with 384-dim embeddings, pgvector, and an HNSW index.'}
<!-- @starci/seperator -->
## 2
### text
<!-- @starci/seperator -->
${isVI ? 'Hybrid search: fan-out BM25 + vector và hợp nhất bằng RRF (k=60).' : 'Hybrid search: fan out to BM25 + vector and fuse with RRF (k=60).'}
<!-- @starci/seperator -->

Write the complete file using the Write tool.`
}

function subEN(lessonSlug, challengeSlug) {
  const outPath = `${MOUNT}\\contents\\${lessonSlug}\\challenges\\${challengeSlug}\\submissions\\0\\en.md`
  return `Write the English submission file for SD M15 challenge: ${challengeSlug}.

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
  return `Write the Vietnamese submission file for SD M15 challenge: ${challengeSlug}.

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
  return `Write code-context.md for SD M15 lesson: ${lesson.slug}.

TARGET FILE: ${outPath}

Read the service source + compose to ground the document:
- ${REPO_LOCAL}\\${lesson.slug}\\${lesson.service}\\src
- ${REPO_LOCAL}\\${lesson.slug}\\.docker\\compose.yaml (if present)
- ${REPO_LOCAL}\\${lesson.slug}\\.sql\\seed.sql (if present)
Reference format: ${REF_CTX}

Document:
1. Canonical repo: StarCi-Academy/system-design-mastery-module-15-distributed-search-autocomplete-system ; on-disk .repo/system-design-mastery-module-15-distributed-search-autocomplete-system/${lesson.slug}/ ; NEEDS-RENAME: ${lesson.service} -> 0-typescript
2. Stack table (${lesson.stack})
3. Docker services (abridged compose)
4. API surface table (Method | Path | Status | Response body) — from: ${lesson.endpointsDesc}
5. E2E flows + status: ${lesson.e2eNote}
6. Language scaffold status (TypeScript=reference complete; Java/C#/Go=PENDING maintainer, with the per-lang lib mapping: Java=Jedis/JDBC, C#=StackExchange.Redis/Npgsql, Go=go-redis/pgx)
7. Known issues if any

Write using the Write tool.`
}

function auditedPrompt(lesson) {
  const outPath = `${MOUNT}\\contents\\${lesson.slug}\\audited.md`
  const L = lesson.slug.charAt(0)
  return `Write audited.md for SD M15 lesson: ${lesson.slug}. Reference format: ${REF_AUD}

TARGET FILE: ${outPath}

Write a V2 audit log:
1. ## Audit ${TODAY} — SD M15 Distributed Search L${L} V2 migration
2. ### Compliance checklist (interview dialog, mermaid TD, dual-platform PowerShell+curl, 5 interview Qs, refs >=2, isPremium=${lesson.isPremium}, verified=${TODAY}, English code comments, :::muted step callouts)
3. ### Bodies (4-language) — TypeScript=Complete; Java/C#/Go=PENDING maintainer scaffold
4. ### Cross-lang parity: HTTP status + JSON value identical across TS/Java/C#/Go for every flow
5. ### Challenges (${lesson.challenges.length} tiers): ${lesson.challenges.join(', ')} — vi+en already authored; submissions/0 backfilled this pass
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

log('SD M15 Distributed Search V2 migration complete.')
return { module: 'SD-M15', lessons: LESSONS.map(l => l.slug), status: 'done' }
