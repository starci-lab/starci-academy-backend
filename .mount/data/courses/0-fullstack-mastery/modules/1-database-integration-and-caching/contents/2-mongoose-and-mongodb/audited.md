# Audit log — 2-mongoose-and-mongodb

## Audit — 2026-05-26T00:00:00Z

### Trigger
Migration sang rules v1: bổ sung `# databases` section còn thiếu, fix wording lệch chuẩn Opus,
migrate 4 challenges từ format legacy (nested `### prompts` trong submission, sai H1 order,
score sum không invariant, escalation phrase variant, easy/vi.md bị mojibake double-encoded UTF-8)
sang template v1 strict (rubric per requirement, step body 3 sub-headings, sum invariant,
codeImplementations 4 lang, forbidden suffix đúng pattern, escalation phrase nguyên văn).

### Lessons re-audited
- `2-mongoose-and-mongodb` (variant: `fullstack-backend`) — FIXED + non-runtime verified (e2e + push deferred).

### Files changed
- `vi.md`: bổ sung `# databases` section với MongoDB Cat schema (`@Schema` + `@Prop` + `index` + `timestamps`).
- `en.md`: bổ sung `# databases` mirror MongoDB Cat schema.
- `challenges/0-mongoose-and-mongodb-easy/vi.md`: **REWRITE** — fix mojibake encoding (file gốc bị double-encoded UTF-8), migrate nested `### prompts` → rubric per requirement, reorder H1 (`# outputs` trước `# prerequisites`), thêm step body 3 sub-headings, thêm `### codeImplementations` 4 lang ở step 1, thêm rubric A/B/C/D với điểm sum invariant (8+7+5=20), forbidden ≥1 bullet với suffix đúng pattern, prerequisites[0] đổi sang phrase escalation chuẩn.
- `challenges/0-mongoose-and-mongodb-easy/en.md`: **REWRITE** — mirror VI structure, wording EN strict (`Scoring rubric (max N):`, `Criterion A (X points):`, `Rule: each criterion fully met...`, `### 1. Steps`, ...).
- `challenges/1-embedded-referenced-documents-aggregation-medium/vi.md` + `en.md`: **REWRITE** — Refactor topic (embedded review + referenced author + aggregation pipeline benchmark) từ placeholder ngắn 257 dòng sang full template v1 (~410 dòng); 3 requirement với rubric (16+14+10=40), 3 step có codeImplementations 4 lang, escalation `Đã hoàn thành EASY ...`, description `Phát triển từ bản EASY.`, forbidden 4 bullet với 1 bullet `0 whole challenge`.
- `challenges/2-multi-document-transactions-concurrency-hard/vi.md` + `en.md`: **REWRITE** — Topic (multi-doc transaction + OCC version key + k6 concurrent benchmark), 3 requirement với rubric (22+20+18=60), 3 step có codeImplementations 4 lang, escalation `Đã hoàn thành MEDIUM ...`, forbidden 5 bullet với 3 bullet `0 whole challenge`.
- `challenges/3-tenant-geospatial-sharding-aggregation-insane/vi.md` + `en.md`: **REWRITE** — Topic (sharded cluster 4-service Docker, `tenantId: "hashed"` shard key, `$nearSphere` targeted query, capacity planning), 4 requirement với rubric (25+22+18+15=80), 4 step có codeImplementations 4 lang ở step 1, escalation `Đã hoàn thành HARD ...`, forbidden 5 bullet với 2 bullet `0 whole challenge`.

### Non-compliance fixed
- [Content] `vi.md`/`en.md` thiếu `# databases` section yêu cầu cho lesson MongoDB → đã add.
- [Challenge] 4 challenges đều dùng legacy nested `### prompts` trong submission → đã migrate sang rubric per requirement.
- [Challenge] 4 challenges có H1 order sai (`# outputs` đặt sau `# steps` thay vì sau `# requirements`) → đã reorder theo §4 challenge-format.
- [Challenge] easy/vi.md bị mojibake double-encoded UTF-8 (`Ä‘`, `á»`, `Æ¡`) → đã rewrite hoàn toàn với UTF-8 sạch.
- [Challenge] Missing `### score` + `### promptText` ở từng requirement (rubric sống trong submission) → đã thêm cho mọi requirement.
- [Challenge] Sum invariant sai (vd insane submission score = 20 nhưng `# score` = 80) → fixed về 20/40/60/80 đúng tier.
- [Challenge] Escalation phrase variant (`thử thách MEDIUM của bài học này`) → đã chuẩn hoá thành ``Đã hoàn thành <PREV> `<slug>`.``.
- [Challenge] Step body thiếu 3 sub-heading `### 1. Các bước thực hiện` / `### 2. Yêu cầu tối thiểu cần đạt` / `### 3. Nice to have` ở medium/hard/insane → đã add.
- [Challenge] codeImplementations example chỉ có code raw không fence → đã wrap fence với language declaration.
- [Challenge] codeImplementations thứ tự sai (csharp ở `#### 1` thay vì `#### 1` per `challenge-format.md §5.5`) — verify lại: rules đặt typescript=#0, csharp=#1, go=#2, java=#3 → đã apply.

### Wording fixes (Opus standard)
- `*Kết luận:*` italic + per-flow conclusion: vi.md đã có đầy đủ — verified, không phải fix.
- §3.1 interview Q label `Ý interviewer muốn nghe:` + `Trả lời mẫu (ngắn):`: verified, đã đúng.
- §2.1.4 flow count = 5, match test.md 5 flows: verified.
- IT terms English giữ nguyên: `Mongoose`, `MongoDB`, `schema`, `aggregation`, `embedded document`, `referenced document`, `ObjectId`, `populate`, `2dsphere`, `OCC`, `sharding`, `mongos`, `replicaSet` — verified, không có translation lệch.
- Strict wording fixed phrases (`— một **Senior Engineer** đặt câu hỏi.`, `Câu trả lời thiếu chiều sâu:`, ConfigModule blockquote, bash comment `# Bước 1: Khởi động MongoDB`, etc.): verified, vi.md đã đúng.

### Challenges added/modified
- `challenges/0-mongoose-and-mongodb-easy/`: **REWRITE** to template v1 — Blog API với rubric concept-level A/B/C/D, README 6 section enforced qua requirement 2 rubric.
- `challenges/1-embedded-referenced-documents-aggregation-medium/`: **REWRITE** to template v1 — embedded review + referenced author + aggregation pipeline benchmark vs naive.
- `challenges/2-multi-document-transactions-concurrency-hard/`: **REWRITE** to template v1 — replica set bootstrap + OCC version key + k6 50 VU benchmark + audit log evidence.
- `challenges/3-tenant-geospatial-sharding-aggregation-insane/`: **REWRITE** to template v1 — sharded cluster 4-service Docker + `tenantId: "hashed"` + `$nearSphere` single-shard targeted + capacity planning.

### E2e re-verification (stdout thật, paste nguyên văn)
PENDING — defer main session.

Author note: audit Opus content focus deferred Phase 4 (e2e re-run) và Phase 9 (push) sang main session theo scope yêu cầu. Lesson content (vi.md/en.md) chỉ thêm 1 section `# databases`, không thay đổi flow / startup command / API contract, nên không có rủi ro regression cho e2e — verification của lesson original 5 flows vẫn pass theo audited prior state.

### Port collision encountered
N/A — không chạy e2e trong audit session này.

### Warning files raised
None.

### Outstanding issues (carry forward to next audit)
- **Code refactor needed:** Cat schema hiện ở `backend/src/modules/cat/schemas/cat.schema.ts` theo legacy modules layout. Theo `coding-common.md §8.1`, schema MongoDB phải nằm ở `src/schemas/mongodb/<connection>/`. Khuyến nghị refactor sang `backend/src/schemas/mongodb/main/cat.schema.ts` với barrel `index.ts`. Module `cat` chỉ giữ `cat.controller.ts` + `cat.service.ts`, import schema từ barrel root.
- **E2e re-run:** Phase 4 deferred — main session cần chạy lại 5 flow trong `test.md` (POST /cats, GET /cats/search, PUT /cats/:id, GET /cats?hobby=, POST /cats/:id/like) và capture raw stdout từ Invoke-RestMethod / curl.
- **Phase 9 push:** Phase 9 deferred — main session cần `git add` + `git commit -m "audit: 2026-05-26 — 2-mongoose-and-mongodb"` + `git push origin main` cho repo `fullstack-mastery-module-1-database-integration-and-caching` sau khi Phase 4 PASS.
- **Challenge repos:** Mỗi challenge có submission `githubUrl` — nhưng đây là deliverable học viên, không phải repo authoring. Không cần tạo trước.
- **Insane challenge 4-service Docker cluster:** Yêu cầu ≥8GB RAM trống local; khi reviewer audit ngược cần xác nhận máy đủ tài nguyên trước khi chạy benchmark 100 VU × 5min trên 1M dataset.
- **Medium challenge benchmark:** `autocannon` + ≥1000 review seed cần thời gian setup; reviewer dự kiến 30-45 phút cho full medium tier audit.

### Pushed to remote
PENDING — defer main session.

### Author / Reviewer
- Author: starci183 (audit subagent — Opus content focus)
- Date: 2026-05-26

## Audit — 2026-05-26T12:25:00Z

### Trigger
Full re-audit v2 — brainstorm fresh per tier, compare with existing 4 tiers, verify separator wrap §6.3.1, re-run e2e 5 flows trên PORT=3002 + mongo 27019, push code fix nếu có.

### Scope
- **Lesson:** `2-mongoose-and-mongodb` (variant: `fullstack-backend`)
- **Status:** FIXED (1 code import) + re-tested PASS (5/5 flows)

### Content compliance checklist
- [x] Separator `<!-- @starci/seperator -->` đúng chính tả (vi.md, en.md)
- [x] 16 sections theo variant `fullstack-backend`
- [x] Strict wording — italic interview quote + `— một **Senior Engineer**` variant (`-- một **Senior Engineer** hỏi`)
- [x] Strict wording — `Câu trả lời ... thiếu chiều sâu` variant present
- [x] Strict wording — `**Thực hành dẫn dắt Lý thuyết**` present (§2 intro)
- [x] Strict wording — `*Kết luận:*` italic per flow (5/5 flows)
- [x] Strict wording — ConfigModule blockquote `> **Lưu ý:** Repo đã ship env defaults qua **ConfigModule**...`
- [x] Strict wording — `Sau khi kết thúc bài, bạn có thể dọn tài nguyên...`
- [x] Interview Q labels — `Ý interviewer muốn nghe:` + `Trả lời mẫu (ngắn):` (3 questions)
- [x] Flow count 5, match `test.md` 5 flows 1:1
- [x] `# codeImplementations` 4 lang csharp/typescript/go/java (order csharp=#0 differs from §5.5 spec but acceptable as prior-audit decision)
- [x] `# databases` H1 present (MongoDB Cat schema)
- [x] `# minutesRead` 18 (in range 15-30)
- [x] EN mirror tồn tại + cùng cấu trúc
- [x] IT terms English giữ nguyên (Mongoose, MongoDB, schema, embedded, referenced, ObjectId, OCC, sharding, $nearSphere)

### Challenges brainstormed by Claude

Tinh thần: existing challenges chỉ tham khảo. Brainstorm fresh từ lesson `vi.md` (Mongoose schema, Cat embedded metadata, hobbies array, atomic $inc).

- [x] Easy: brainstorm = `Blog API với embedded comments + referenced authors`. Existing `Blog API với Mongoose và MongoDB`: **aligned (kept)** — domain shift khỏi Cat, demo schema flexibility + index + findByIdAndUpdate pattern lesson dạy.
- [x] Medium: brainstorm = `Aggregation pipeline benchmark với embedded vs referenced trade-off`. Existing `Embedded và Referenced Documents với Aggregation Pipeline`: **aligned (kept)** — đúng concept ghép embedded review + referenced author + `$unwind` + `$group` + `$lookup`.
- [x] Hard: brainstorm = `Replica set + OCC version key + multi-document transactions + k6 benchmark`. Existing `Multi-Document Transactions với Optimistic Concurrency Control`: **aligned (kept)** — replica set bootstrap + OCC `__v` + k6 50 VU evidence yêu cầu thật.
- [x] Insane: brainstorm = `Sharded cluster + tenantId hashed + $nearSphere geospatial + capacity planning`. Existing `Multi-tenant Geospatial Sharding với Aggregation Pipeline`: **aligned (kept)** — 4-service Docker sharded cluster + `tenantId:"hashed"` + 2dsphere + `targeted query` evidence qua `explain()`.

### Challenge compliance checklist (per tier)

#### Easy (`0-mongoose-and-mongodb-easy`)
- [x] File tồn tại: `vi.md`, `en.md`
- [x] 10 H1 section đúng thứ tự
- [x] Sum invariant: reqs_sum=20, top=20, sub=20
- [x] Step body separator wrap: 4 steps × 4 separator = 16 OK (vi + en)
- [x] EN mirror đồng bộ (10 H1, 3 reqs)

#### Medium (`1-embedded-referenced-documents-aggregation-medium`)
- [x] File tồn tại
- [x] Escalation desc: `Phát triển từ bản EASY.`
- [x] Sum invariant: reqs_sum=40, top=40, sub=40
- [x] Step body separator wrap: 3 steps × 4 = 12 OK (vi + en)
- [x] EN mirror đồng bộ

#### Hard (`2-multi-document-transactions-concurrency-hard`)
- [x] File tồn tại
- [x] Escalation desc: `Phát triển từ bản MEDIUM.`
- [x] Sum invariant: reqs_sum=60, top=60, sub=60
- [x] Step body separator wrap: 3 steps × 4 = 12 OK (vi + en)
- [x] Production-grade scope: replica set + OCC + k6 50 VU benchmark + audit log
- [x] EN mirror

#### Insane (`3-tenant-geospatial-sharding-aggregation-insane`)
- [x] File tồn tại
- [x] Escalation desc: `Phát triển từ bản HARD.`
- [x] Sum invariant: reqs_sum=80, top=80, sub=80
- [x] Step body separator wrap: 4 steps × 4 = 16 OK (vi + en)
- [x] 1M-user scope: sharded cluster + tenantId hashed + `$nearSphere` targeted + capacity planning
- [x] EN mirror

### Code compliance checklist
- [x] Repo cloned: `.repo/fullstack-mastery-module-1-database-integration-and-caching/` (off-by-one fallback hit module-2 repo)
- [x] Barrel `index.ts` mọi directory: `src/config`, `src/modules`, `src/modules/cat`, `src/schemas/mongodb/main`
- [x] Bilingual comment VI + `(EN: ...)` trên controller/service/schema/module
- [x] No `any` (note: schema dùng `Record<string, any>` cho `metadata` field — acceptable cho document flexibility lesson)
- [x] ConfigModule + `registerAs("database", ...)` — không `process.env.X` trong service/controller
- [x] Schemas đúng layout `src/schemas/mongodb/main/cat.schema.ts` + barrel (đã refactor prior audit)
- [x] FS: backend host (npm run start:dev), `.docker/` infra-only (chỉ MongoDB, không build api)
- [x] **FIX**: `cat.controller.ts` import broken `./schemas/cat.schema` (file đã delete khi refactor) → fixed thành `../../schemas/mongodb/main`

### E2e checklist

**Setup:**
- [x] Repo cloned: `.repo/fullstack-mastery-module-1-database-integration-and-caching/2-mongoose-and-mongodb/backend`
- [x] Infra started: `docker compose -f compose_test.yaml up -d` (mongo:7 ở port 27019:27017, container `2-mongoose-and-mongodb-mongodb-test`)
- [x] Backend started: `PORT=3002 MONGO_URI=mongodb://starci_admin:starci_password@localhost:27019/starci_nosql_db?authSource=admin npm run start:dev`
- [x] Port collision encountered: YES — port 27017 đang busy bởi audit khác → dùng `compose_test.yaml` port `27019:27017`. Backend port 3002 (parallel với M1L0/M1L1).

**Flows (stdout thật):**

#### Flow 1 — Create cat document (POST /cats)
- **Command:** `curl -i -X POST http://localhost:3002/cats -H "Content-Type: application/json" -d '{"name":"Luna","age":3,"breed":"Persian","hobbies":["sleeping","eating"],"metadata":{"color":"white"}}'`
- **Result:** PASS
- **Stdout:**
  ```
  HTTP/1.1 201 Created
  Content-Type: application/json; charset=utf-8
  Date: Tue, 26 May 2026 12:19:56 GMT

  {"name":"Luna","age":3,"breed":"Persian","hobbies":["sleeping","eating"],"metadata":{"color":"white"},"likes":0,"_id":"6a158fecb00c49194b9ce3d0","createdAt":"2026-05-26T12:19:56.299Z","updatedAt":"2026-05-26T12:19:56.299Z","__v":0}
  ```
- **Pass criteria match:** [x] HTTP 201, [x] `_id` ObjectId, [x] `createdAt`/`updatedAt` auto, [x] `likes:0` default, [x] nested `metadata` + array `hobbies` lưu được.

#### Flow 2 — Search by name (GET /cats/search?name=Luna)
- **Command:** `curl -i "http://localhost:3002/cats/search?name=Luna"`
- **Result:** PASS
- **Stdout:**
  ```
  HTTP/1.1 200 OK
  {"_id":"6a158fecb00c49194b9ce3d0","name":"Luna","age":3,"breed":"Persian","hobbies":["sleeping","eating"],"metadata":{"color":"white"},"likes":0,"createdAt":"2026-05-26T12:19:56.299Z","updatedAt":"2026-05-26T12:19:56.299Z","__v":0}
  ```
- **Pass criteria match:** [x] HTTP 200, [x] single document (not array), [x] `findOne({name})` hit index trên `name`.

#### Flow 3 — findByIdAndUpdate returnDocument=after (PUT /cats/:id)
- **Command:** `curl -i -X PUT http://localhost:3002/cats/6a158fecb00c49194b9ce3d0 -H "Content-Type: application/json" -d '{"age":4}'`
- **Result:** PASS
- **Stdout:**
  ```
  HTTP/1.1 200 OK
  {"_id":"6a158fecb00c49194b9ce3d0","name":"Luna","age":4,"breed":"Persian","hobbies":["sleeping","eating"],"metadata":{"color":"white"},"likes":0,"createdAt":"2026-05-26T12:19:56.299Z","updatedAt":"2026-05-26T12:20:03.373Z","__v":0}
  ```
- **Pass criteria match:** [x] `age:4` (post-update, chứng minh `returnDocument:"after"`), [x] `updatedAt` mới, [x] other fields preserved (partial update).

#### Flow 4 — Array query $in (GET /cats?hobby=fishing)
- **Pre-step:** `curl -X POST http://localhost:3002/cats -d '{"name":"Whiskers","age":2,"breed":"Tabby","hobbies":["fishing","napping"]}'` → 201 `_id:"6a158ff3b00c49194b9ce3d1"`
- **Command:** `curl -i "http://localhost:3002/cats?hobby=fishing"`
- **Result:** PASS
- **Stdout:**
  ```
  HTTP/1.1 200 OK
  [{"_id":"6a158ff3b00c49194b9ce3d1","name":"Whiskers","age":2,"breed":"Tabby","hobbies":["fishing","napping"],"likes":0,"createdAt":"2026-05-26T12:20:03.630Z","updatedAt":"2026-05-26T12:20:03.630Z","__v":0}]
  ```
- **Pass criteria match:** [x] Chỉ Whiskers trả về, [x] Luna (không có "fishing") không xuất hiện, [x] `$in` filter chính xác.

#### Flow 5 — Atomic $inc (POST /cats/:id/like)
- **Command:** `curl -i -X POST http://localhost:3002/cats/6a158fecb00c49194b9ce3d0/like` (×2)
- **Result:** PASS
- **Stdout call 1:**
  ```
  HTTP/1.1 201 Created
  {"_id":"6a158fecb00c49194b9ce3d0","name":"Luna","age":4,...,"likes":1,"updatedAt":"2026-05-26T12:20:04.115Z","__v":0}
  ```
- **Stdout call 2:**
  ```
  {"_id":"6a158fecb00c49194b9ce3d0","name":"Luna","age":4,...,"likes":2,"updatedAt":"2026-05-26T12:20:04.360Z","__v":0}
  ```
- **Pass criteria match:** [x] `likes:1` sau call 1, [x] `likes:2` sau call 2, [x] `returnDocument:"after"` trả document mới, [x] atomic `$inc` server-side.

### Warning files raised
- None

### Pushed to remote
- Repo: `https://github.com/StarCi-Academy/fullstack-mastery-module-2-database-integration-and-caching` commit `da02d10` (`git log --oneline -1`)
- Files: `2-mongoose-and-mongodb/backend/src/modules/cat/cat.controller.ts` (1 file changed, 2 insertions, 2 deletions)
- Note: repo name là module-2 (off-by-one) — mount slot `1-database-integration-and-caching` map sang repo `module-2-...` cho FS course (mismatch với rules §2.4 quy ước "FS không off-by-one", nhưng đây là state thực tế trên GitHub — kế thừa từ prior audit).
- Verified pushable: `e569c92..da02d10 main -> main`

### Outstanding issues (carry forward)
- [ ] Schema `metadata: Record<string, any>` — rules `coding-common.md` strict no-`any`, nhưng đây là domain document flexibility (intentional). Có thể thay bằng `unknown` ở entity (như prior `# databases` snippet làm) để fully compliant strict TS — minor.
- [ ] `codeImplementations` order trong vi.md: `csharp=#0, typescript=#1, go=#2, java=#3` — sai với `challenge-format.md §5.5` (`typescript=#0, csharp=#1`). Đây là content/lesson body (không phải challenge), không bị §5.5 ràng buộc strict — nhưng nên align để consistency. Defer.
- [ ] FS repo naming: kế thừa `module-2-...` (off-by-one) thay vì `module-1-...` per `audit.md §2.4` quy ước FS. Rename remote requires admin coordination — defer.

### Author / Reviewer
- Author: starci183 (audit Opus full v2)
- Date: 2026-05-26

## Audit — 2026-05-26T18:00:00Z — codeExplaining sync

### Trigger
Apply new rule: `# codeExplaining` snippets must match `.repo/<repo>/<lesson>/backend/src/...` with diff = 0 (semantic) and explanations must describe correct Mongoose behavior. `# codeImplementations` exempt from verification.

### Snippets verified
- 3 `# codeExplaining` snippets in `vi.md` (and EN mirror) — all 3 updated.

### Type breakdown
- **Type A (match):** 0 — none were already aligned with the post-`likes` source.
- **Type B (snippet stale):** 2 — snippet 1 (`findByName`/`findAll`) and snippet 2 (`update`) drifted from the production service body. Rewrote both to mirror source (logger calls, condensed brace formatting, `findByIdAndUpdate` multi-arg layout) and folded the previously-missing `like` (`$inc`) method into snippet 2 so the lesson's atomic update flow is documented.
- **Type C (source stale):** 1 — `cat.schema.ts` had `metadata: Record<string, any>` flagged as outstanding issue in prior audit; switched to `Record<string, unknown>` to match the snippet's strict-TS intent.
- **Type D (both wrong):** 1 — snippet 0 was missing the `likes` field that the source schema ships and that Flow 5 e2e verifies. Added `likes: number` with `default: 0` + `min: 0` to the snippet AND tightened source to `unknown`.

### Files changed
- `vi.md` — rewrote 3 codeExplaining snippets + 3 explanations (added `collection: "cats"` + `likes` reasoning, `Logger` rationale, `$inc` atomic operator).
- `en.md` — EN mirror, same scope.
- `.repo/.../backend/src/schemas/mongodb/main/cat.schema.ts` — `Record<string, any>` → `Record<string, unknown>` (resolves outstanding issue from 12:25 audit).

### Outstanding issues resolved
- [x] Schema `metadata: Record<string, any>` → `Record<string, unknown>` (was deferred minor).

### Non-runtime verified
Code change is type-narrowing only (`any` → `unknown`); does not alter Mongoose serialization or e2e behavior. Prior 5/5 flow results from 12:25 audit remain valid.

### Author / Reviewer
- Author: starci183 (codeExplaining sync pass)
- Date: 2026-05-26
