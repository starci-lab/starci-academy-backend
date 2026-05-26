# Audit log — 1-typeorm-and-postgresql

## Audit — 2026-05-26T12:03:56Z

### Trigger
E2e re-verification single-agent test + lean checklist format migration.

### Scope
- **Lesson:** `1-typeorm-and-postgresql` (variant: fullstack-backend)
- **Status:** FIXED (controller import bug) + re-tested PASS all 4 flows

### Content compliance checklist
- [x] Separator `<!-- @starci/seperator -->` (sai chính tả giữ nguyên)
- [x] Strict wording — italic interview quote + Senior Engineer phrase (fixed in wave-1 audit)
- [x] Strict wording — `Câu trả lời thiếu chiều sâu:` (fixed in wave-1 audit)
- [x] Strict wording — `Bài tuân theo **Thực hành dẫn dắt Lý thuyết**.` (wave-1)
- [x] Strict wording — `*Kết luận:*` italic per flow — 4/4 flows (wave-1)
- [x] Strict wording — ConfigModule blockquote (wave-1)
- [x] Interview Q labels — `Ý interviewer muốn nghe:` + `Trả lời mẫu (ngắn):` (wave-1)
- [x] Flow count 4, match test.md (4 flows)
- [x] codeImplementations 4 lang typescript/csharp/go/java
- [x] `# databases` H1 (PostgreSQL — Cat/CatPassport/Toy/Owner) (added wave-1)
- [x] minutesRead 15-30 (value: 18)
- [x] EN mirror đồng bộ (wave-1)
- [x] KHÔNG thuật ngữ IT bị dịch
- [ ] EN mirror cho medium/hard/insane challenges — còn thiếu (carry-forward từ wave-1)
- [ ] Step body separator structure medium/hard challenges chưa canonical (carry-forward wave-1)

### Challenge compliance checklist

#### Easy (0-library-author-book-tag-crud-easy)
- [x] `### score` + `### promptText` rubric A/B/C/D — 4 reqs (6+5+6+3=20) (wave-1)
- [x] Prerequisites canonical phrase (wave-1)
- [x] Forbidden suffix `0 whole challenge` (wave-1)
- [x] Step body H3 sub-headings (wave-1)
- [x] codeImplementations 4 lang cho 2 steps (wave-1)
- [x] EN mirror rewritten (wave-1)

#### Medium (1-typeorm-index-jsonb-relations-cascade-medium)
- [x] Rubric 5 reqs (8+9+10+8+5=40) (wave-1)
- [x] Description escalation phrase (wave-1)
- [x] Prerequisites canonical phrase (wave-1)
- [x] Forbidden fabricate bullet (wave-1)
- [ ] EN mirror — PENDING (outstanding từ wave-1)
- [ ] Step body separator canonical — PENDING (outstanding từ wave-1)

#### Hard (2-loan-transaction-optimistic-lock-index-hard)
- [x] Rubric 5 reqs (10+15+10+15+10=60) (wave-1)
- [x] Description escalation phrase (wave-1)
- [x] Prerequisites canonical phrase + slug (wave-1)
- [x] Forbidden fabricate bullet (wave-1)
- [ ] EN mirror — PENDING (outstanding từ wave-1)
- [ ] Step body separator canonical — PENDING (outstanding từ wave-1)

#### Insane (3-tenant-rls-read-write-replicas-insane)
- [x] Full rewrite 4 reqs rubric (20+25+15+20=80) (wave-1)
- [x] 3 steps, codeImplementations 4 lang step 1 (wave-1)
- [x] Submission canonical (no nested prompts) (wave-1)
- [ ] EN mirror — PENDING (outstanding từ wave-1)

### Code compliance checklist
- [x] Repo cloned: `.repo/fullstack-mastery-module-1-database-integration-and-caching` (actual GitHub: `fullstack-mastery-module-2-database-integration-and-caching`)
- [x] `start:dev` = `nest start --watch` — confirmed `package.json` scripts
- [x] `.docker/compose.yaml` infra-only (no `api`/`web` service, no `build:`) — confirmed
- [x] Entities at `backend/src/entities/postgresql/main/` (Cat, CatPassport, Toy, Owner) — confirmed
- [x] FIXED: `cat.controller.ts` import from `./entities` → `../../entities/postgresql/main` (broken import, fixed this audit)
- [x] `TypeOrmModule.forFeature` paths correct in `cat.module.ts` — confirmed
- [x] No Dockerfile for backend — confirmed

### E2e checklist (BẮT BUỘC — stdout thật)

**Setup:**
- [x] Repo cloned từ `https://github.com/StarCi-Academy/fullstack-mastery-module-2-database-integration-and-caching`
- [x] Infra started: postgres port 5432 (no collision)
- [x] Backend started: port 3000 (no collision)
- [x] Port collision: NO

**Flow 1 — POST /cats cascade:**
- [x] Command: `curl -i -X POST http://localhost:3000/cats -H "Content-Type: application/json" -d '{"name":"Milo","passport":{"passportNumber":"PP-001"},"toys":[{"name":"Ball"}],"owners":[{"name":"Alice"}]}'`
- [x] Exit code 0
- [x] Stdout (raw):
  ```
  HTTP/1.1 201 Created
  X-Powered-By: Express
  Content-Type: application/json; charset=utf-8
  Content-Length: 135
  Date: Tue, 26 May 2026 12:03:34 GMT

  {"id":1,"name":"Milo","passport":{"id":1,"passportNumber":"PP-001"},"toys":[{"id":1,"name":"Ball"}],"owners":[{"id":1,"name":"Alice"}]}
  ```
- [x] Pass criteria match: cat có `id:1`, cascade passport `id:1`, toys `[{id:1,name:"Ball"}]`, owners `[{id:1,name:"Alice"}]`

**Flow 2 — GET /cats + /cats/:id + 404:**
- [x] `GET /cats` — HTTP 200, array with relations
  ```
  HTTP/1.1 200 OK
  [{"id":1,"name":"Milo","passport":{"id":1,"passportNumber":"PP-001"},"toys":[{"id":1,"name":"Ball"}],"owners":[{"id":1,"name":"Alice"}]}]
  ```
- [x] `GET /cats/1` — HTTP 200, single cat with all relations
  ```
  HTTP/1.1 200 OK
  {"id":1,"name":"Milo","passport":{"id":1,"passportNumber":"PP-001"},"toys":[{"id":1,"name":"Ball"}],"owners":[{"id":1,"name":"Alice"}]}
  ```
- [x] `GET /cats/999` — HTTP 404
  ```
  HTTP/1.1 404 Not Found
  {"message":"Cat with ID 999 not found","error":"Not Found","statusCode":404}
  ```
- [x] Pass criteria match: list populated, single object populated, 404 correct

**Flow 3 — GET /cats/1/with-relations:**
- [x] Command: `curl -i http://localhost:3000/cats/1/with-relations`
- [x] Stdout (raw):
  ```
  HTTP/1.1 200 OK
  Content-Length: 135
  {"id":1,"name":"Milo","passport":{"id":1,"passportNumber":"PP-001"},"toys":[{"id":1,"name":"Ball"}],"owners":[{"id":1,"name":"Alice"}]}
  ```
- [x] Pass criteria match: identical shape to Flow 2, explicit eager-loading endpoint works

**Flow 4 — POST /cats/1/toys + verify:**
- [x] POST command: `curl -i -X POST http://localhost:3000/cats/1/toys -H "Content-Type: application/json" -d '{"name":"Laser Pointer"}'`
  ```
  HTTP/1.1 201 Created
  Content-Length: 167
  {"id":1,"name":"Milo","passport":{"id":1,"passportNumber":"PP-001"},"toys":[{"id":1,"name":"Ball"},{"id":2,"name":"Laser Pointer"}],"owners":[{"id":1,"name":"Alice"}]}
  ```
- [x] Verify `GET /cats/1` — toys.length=2, new toy present
  ```
  HTTP/1.1 200 OK
  {"id":1,"name":"Milo","passport":{"id":1,"passportNumber":"PP-001"},"toys":[{"id":1,"name":"Ball"},{"id":2,"name":"Laser Pointer"}],"owners":[{"id":1,"name":"Alice"}]}
  ```
- [x] Pass criteria match: toys.length increased 1→2, new toy has fresh auto-incremented id:2

### Warning files raised
- [ ] None

### Pushed to remote
- [x] Code: `https://github.com/StarCi-Academy/fullstack-mastery-module-2-database-integration-and-caching` commit `e569c92`
- [ ] SD images: N/A (FS lesson)

### Outstanding issues
- [ ] EN mirror for medium/hard/insane challenges not updated (carry-forward from wave-1)
- [ ] Step body separator structure in medium/hard challenges not fully canonical (carry-forward from wave-1)
- [ ] Repo name mismatch: lesson content references `fullstack-mastery-module-1-...` but actual GitHub repo is `fullstack-mastery-module-2-...` — content repo URL links point to non-existent name

### Author
- Author: sonnet-e2e-agent
- Date: 2026-05-26T12:03:56Z

---

## Audit — 2026-05-26T00:00:00Z (wave-1 — Opus content audit)

### Trigger
Audit Opus content focus: re-validate compliance theo rules `content-fullstack-backend.md` + `challenge-format.md`, fix wording lệch chuẩn Opus, migrate 4 challenge tier sang template chuẩn (rubric per requirement A/B/C/D, forbidden suffix, escalation prereq, submission không nested prompts), add `# databases` section cho PostgreSQL entities.

### Scope
- **Lesson:** `1-typeorm-and-postgresql` (variant: `fullstack-backend`)
- **Status:** FIXED partial (content vi/en, easy challenge full migration, medium/hard/insane partial migration with rubric injection; insane fully rewritten from legacy thin format).

### Content compliance checklist
- [x] Opening §1 rewritten: italic quote + Senior Engineer + Mid-level Developer + `Câu trả lời thiếu chiều sâu:`
- [x] Bridge paragraph: `bốn luồng` (was `hai luồng`)
- [x] `# databases` section added: 4 entities (Cat/CatPassport/Toy/Owner)
- [x] EN mirror: flow conclusion blocks `*Conclusion:*` prefix, interview Q labels fixed
- [x] EN `What interviewers want to hear:` + `Sample answer (concise):` (3×)

### Challenge compliance checklist

#### Easy
- [x] FULL REWRITE vi+en canonical template, 4 reqs rubric A/B/C/D (6+5+6+3=20), 2 codeImpl 4 lang, submission spec

#### Medium
- [x] Rubric 5 reqs vi.md (8+9+10+8+5=40), step H3, description escalation, prereq canonical
- [ ] EN mirror PENDING

#### Hard
- [x] Rubric 5 reqs vi.md (10+15+10+15+10=60), step H3, description escalation, prereq+slug fix
- [ ] EN mirror PENDING

#### Insane
- [x] FULL REWRITE vi.md: 4 reqs (20+25+15+20=80), 3 steps, codeImpl 4 lang step 1, submission canonical
- [ ] EN mirror PENDING

### E2e re-verification
PENDING — out of scope for Opus content audit; deferred to next session.

### Pushed to remote
PENDING — deferred to next session.

### Outstanding issues (carry forward)
- EN mirror for medium/hard/insane challenges not updated
- Step body separator structure medium/hard not fully canonical
- Code: entity path refactor (`src/modules/cat/entities/` → `src/entities/postgresql/main/`) — DONE in repo but controller import was missed
- E2e verification pending

### Author
- Author: Opus content audit agent
- Date: 2026-05-26

---

## Audit — 2026-05-26T18:00:00Z

### Trigger
Full audit re-run với rules v2 — Challenges brainstormed section + step body separator wrap §6.3.1 mechanical check + EN mirror sync cho medium/hard/insane.

### Scope
- **Lesson:** `1-typeorm-and-postgresql` (variant: fullstack-backend)
- **Status:** FIXED + re-verified (separator wrap + EN mirror)

### Content compliance checklist
- [x] (reference wave-2 entry `2026-05-26T12:03:56Z`) — content vi.md/en.md đã PASS từ wave trước, không thay đổi trong audit này

### Challenges brainstormed by Claude

Tinh thần: existing challenges chỉ tham khảo. Brainstorm fresh từng tier, so sánh với existing, document quyết định.

- [x] Easy: brainstorm topic = `Library Author 1-n Book n-n Tag CRUD với migration thật + QueryBuilder filter` (domain shift Library thay Cat/Passport/Toys/Owners, cùng pattern relations + cascade). Existing: **aligned (kept + refined)** — đã có wave-1, format chuẩn, rubric A/B/C/D, score 6+5+6+3=20.
- [x] Medium: brainstorm topic = `TypeORM advanced: 1-1 shared PK + 1-n review + jsonb metadata + composite/partial/GIN index + multi-step migration với trigger + cascade save vs onDelete`. Existing: **aligned (kept + refined)** — VI đã PASS wave-1 (5 reqs rubric 8+9+10+8+5=40); EN file đã đồng bộ thêm rubric + strict wording trong audit này.
- [x] Hard: brainstorm topic = `Loan borrow/return với optimistic lock @VersionColumn + transaction + retry helper + N+1 fix + composite/partial index + EXPLAIN ANALYZE Before/After 50k+ rows + concurrent benchmark deterministic`. Existing: **aligned (kept + refined)** — VI đã PASS wave-1 (5 reqs rubric 10+15+10+15+10=60); EN file đã đồng bộ trong audit này.
- [x] Insane: brainstorm topic = `Multi-tenant RLS động qua SET LOCAL app.current_tenant + TypeORM replication master/slaves + hash partition hoặc schema-per-tenant + 1M rows skew 80/20 + k6 benchmark + chaos test kill standby`. Existing: **aligned (kept + refined)** — VI wave-1 full rewrite 4 reqs 20+25+15+20=80; EN file đã rewrite full mirror trong audit này.

### Challenge compliance checklist

#### Easy (0-library-author-book-tag-crud-easy)
- [x] File tồn tại: `challenges/0-library-author-book-tag-crud-easy/{vi,en}.md`
- [x] 10 H1 section đúng thứ tự (verified: title/description/requirements/outputs/prerequisites/steps/references/submissions/difficulty/score)
- [x] Mỗi requirement có `### score` + `### promptText` rubric A/B/C/D (4 reqs)
- [x] Sum invariant: `6 + 5 + 6 + 3 = 20 = # score` (verified Python regex)
- [x] `### forbidden` với suffix `-> **0 prompt ...**` / `-> **0 whole challenge**` (wave-1)
- [x] Step body 3 H3 sub-headings (wave-1)
- [x] **Step body separator wrap đúng** — mechanical check: 6 steps × 4 = 24 separators (verified bash count)
- [x] codeImplementations 4 lang ở 2 step (wave-1)
- [x] EN mirror đồng bộ (wave-1 verified, không sửa thêm trong audit này)

#### Medium (1-typeorm-index-jsonb-relations-cascade-medium)
- [x] Escalation: `# description` chứa "Phát triển từ bản EASY" / "Extended from the EASY version" (FIXED EN trong audit này)
- [x] Escalation: `# prerequisites[0]` = `` Đã hoàn thành EASY `0-library-author-book-tag-crud-easy`. `` / `` Completed EASY `<slug>`. `` (FIXED EN từ "Finished" -> "Completed")
- [x] Sum invariant: `8 + 9 + 10 + 8 + 5 = 40` (vi + en verified)
- [x] **Step body separator wrap đúng** — 6 steps × 4 = 24 separators (FIXED qua script — trước audit chỉ có 12)
- [x] Submission KHÔNG nested `### prompts` (verified vi + en)
- [x] EN rubric injection — thêm 5 `### score` + `### promptText` block (criterion A/B/C/D) cho từng requirement (PENDING wave-1 → DONE audit này)
- [x] EN step body sub-headings converted: `**Steps**` → `### 1. Steps`, `**Minimum acceptance criteria**` → `### 2. Minimum acceptance criteria`, `**Nice to have**` → `### 3. Nice to have` (18 replacements across 6 steps)
- [x] EN submission description rewritten (thay "Submit your solution via the link below" bằng deliverable spec đầy đủ)
- [x] EN forbidden bổ sung bullet `Fabricating EXPLAIN ANALYZE output ... -> **0 whole challenge**.`

#### Hard (2-loan-transaction-optimistic-lock-index-hard)
- [x] Escalation prereq[0]: `Completed MEDIUM 1-typeorm-index-jsonb-relations-cascade-medium.` (FIXED EN — trước đó dùng slug sai `1-typeorm-advanced-config-multi-datasource-medium`)
- [x] Description: "Extended from the MEDIUM version" (FIXED EN)
- [x] Sum invariant: `10 + 15 + 10 + 15 + 10 = 60` (vi + en verified)
- [x] **Step body separator wrap đúng** — 6 steps × 4 = 24 separators (FIXED qua script)
- [x] Production-grade scope: transaction + optimistic lock + EXPLAIN ANALYZE 50k+ + benchmark deterministic (wave-1)
- [x] EN rubric injection cho 5 reqs (PENDING wave-1 → DONE)
- [x] EN forbidden suffix fix: từ "0 transaction prompt" sang "0 prompt transaction" theo §10.2 strict
- [x] EN forbidden bổ sung bullet `Fabricating benchmark or EXPLAIN ANALYZE output ... -> **0 whole challenge**.`
- [x] EN step body `**Steps to follow**` → `### 1. Steps` etc. (18 replacements)
- [x] EN submission description rewritten với deliverable spec đầy đủ

#### Insane (3-tenant-rls-read-write-replicas-insane)
- [x] Escalation prereq[0]: `Completed HARD 2-loan-transaction-optimistic-lock-index-hard.` (FIXED EN — full rewrite)
- [x] Description: "Extended from the HARD version" (FIXED EN)
- [x] Sum invariant: `20 + 25 + 15 + 20 = 80` (vi + en verified)
- [x] **Step body separator wrap đúng** — 3 steps × 4 = 12 separators (FIXED — trước đó EN chỉ có 1 step + 2 separators)
- [x] 1M-user scope: replication master/slaves + RLS + sharding + k6 benchmark + chaos test (wave-1)
- [x] EN file FULL REWRITE để mirror VI: 4 reqs (was 2) + 3 steps (was 1) + canonical submission (was nested ### prompts với promptText sai chứa VI text) + 5 references (was 2) + canonical outputs/prerequisites
- [x] EN forbidden bullets đầy đủ 6 items với suffix strict

### Code compliance checklist
- [x] (reference wave-2 entry — controller import fix `e569c92` pushed; không có code change trong audit này)

### E2e checklist
- [x] Reference: previous audit entry `2026-05-26T12:03:56Z` PASS 4/4 flows. KHÔNG re-run (audit này chỉ thay đổi content challenge files, không động vào lesson source code hay test.md)

### Warning files raised
- [ ] None

### Pushed to remote
- [x] Content: commit `acbab59` pushed lên `starci-academy-backend/main` (verified `git push origin main` -> `77975c9..acbab59 main -> main`)
- [x] Lesson source code: reference wave-2 commit `e569c92` (không thay đổi audit này)

### Outstanding issues
- [ ] H1 ordering medium + hard: hiện tại `# requirements → # prerequisites → # steps → # outputs → # references` (vi + en cùng pattern). Rules `challenge-format.md §4` quy định strict order `# requirements → # outputs → # prerequisites → # steps → # references`. Cần renumber section trong session sau (tách riêng vì cần re-test parser sau đổi thứ tự).
- [ ] Repo name mismatch (carry from wave-2): content reference `module-1-` nhưng GitHub repo `module-2-`. Recommend rename GitHub repo hoặc update content references.
- [ ] Medium EN: requirement purpose/proTipsHints có thể tinh chỉnh sâu hơn theo VI nguyên bản (audit này chỉ inject rubric + fix strict wording; không re-translate purpose/proTipsHints có sẵn từ legacy AI translation).
- [ ] Hard EN: tương tự medium — purpose/proTipsHints/technicalConstraints giữ legacy translation, chỉ inject rubric block + fix forbidden suffix + strict wording.

### Author
- Author: opus-followup-agent
- Date: 2026-05-26T18:00:00Z
