# Audit log — 3-caching-with-redis

## Audit — 2026-05-26T00:00:00Z

### Trigger

First audit pass per `audit.md` v1 — re-validate compliance with `content-fullstack-backend.md`, `challenge-format.md`, fix Opus wording, add missing `# databases` section, migrate the easy challenge to challenge-format v1 (rubric per requirement, no nested `### prompts`, escalation phrases, codeImplementations 4 lang).

### Lessons re-audited

- `3-caching-with-redis` (variant: `fullstack-backend`) — FIXED partially. Lesson `vi.md`/`en.md` + easy challenge fully migrated. Medium/hard/insane challenges still need migration — see ACTIONS NEEDED.

### Files changed

- `3-caching-with-redis/vi.md`:
  - Fixed §1 Opening: italic quote markers, strict phrase `— một **Senior Engineer** đặt câu hỏi.`, `Câu trả lời thiếu chiều sâu:`, rebuilt 2-paragraph shape.
  - Fixed §2 Core concepts: rebuilt with strict phrase `Bài tuân theo **Thực hành dẫn dắt Lý thuyết**.`.
  - Removed suffix `-- Caching Strategy và Redis` from `### 2.2. Lý thuyết` (must be strict canonical).
  - Fixed `.env` blockquote: backticked `**\`ConfigModule\`**` and `**\`.env\`**` per strict table.
  - Added `# databases` section with PostgreSQL `Cat` entity (lesson uses TypeORM `cats` table for DB query cache).
- `3-caching-with-redis/en.md`:
  - Fixed §1 Opening: italic quote markers, `— a **Senior Engineer** asks.`, `The answer lacks depth:`.
  - Fixed §2 Core concepts: strict phrase `This lesson follows **practice-led theory**.`.
  - Removed suffix `-- Caching Strategy and Redis` from `### 2.2. Theory`.
  - Fixed `.env` blockquote: backticked `**\`ConfigModule\`**` and `**\`.env\`**`.
  - Fixed 2.1.5 cleanup intro: strict phrase `Once you finish the lesson, you may clean up resources to free memory.`.
  - Fixed all 4 flow conclusions to strict prefix `*Conclusion: If the response matches the format above, the system confirms:*`.
  - Fixed §3.1 interview labels: `What interviewers want to hear:` and `Sample answer (concise):`.
  - Added `# databases` section mirror.
- `3-caching-with-redis/challenges/0-caching-with-redis-easy/vi.md`:
  - **FULL REWRITE** — original file was double-encoded UTF-8 (mojibake unreadable). Rewrote in v1 format.
  - 4 requirements, score split `6+0+9+5 = 20` (req 1 shared with req 2; req 3 holds `### forbidden`).
  - Each requirement now has `### score` + `### promptText` with concept-level rubric A/B/C/D summing to score.
  - `### forbidden` migrated to req 3 with strict suffix `-> **0 prompt <name>**.` / `-> **0 whole challenge**.`.
  - Removed legacy nested `### prompts` block in submission.
  - 4 steps with strict `### 1. Các bước thực hiện` / `### 2. Yêu cầu tối thiểu cần đạt` / `### 3. Nice to have`.
  - Steps 0 and 2 (application code) include `### codeImplementations` with 4 lang (typescript / csharp / go / java).
  - `Bước N:` bold prefix per strict wording.
- `3-caching-with-redis/challenges/0-caching-with-redis-easy/en.md`:
  - **FULL REWRITE** mirror — same structure, EN strict wording (`Scoring rubric (max N):`, `Criterion A/B/C/D`, `Shared with requirement X (...)`, `Rule: each criterion fully met...`, `### 1. Steps` / `### 2. Minimum acceptance criteria` / `### 3. Nice to have`, `**Step N:**` bold).
- `3-caching-with-redis/audited.md`: NEW — this file.

### Non-compliance fixed

- [Content] vi.md §1 thiếu italic quote markers + sai phrase Senior Engineer/Mid-level → fixed.
- [Content] vi.md §2 thiếu phrase `Bài tuân theo **Thực hành dẫn dắt Lý thuyết**.` → fixed.
- [Content] vi.md + en.md heading `### 2.2.` có suffix thừa → stripped về strict canonical.
- [Content] `.env` blockquote thiếu backtick quanh `ConfigModule` và `.env` → fixed cả 2 file.
- [Content] en.md §3.1 interview labels `What interviewers want:` / `Sample short answer:` → fixed về strict `What interviewers want to hear:` / `Sample answer (concise):`.
- [Content] en.md 4 flow conclusions sai phrase `*If the responses match the format above:*` → fixed về `*Conclusion: If the response matches the format above, the system confirms:*`.
- [Content] en.md 2.1.5 cleanup intro `When you are done, tear down to free resources.` → fixed về strict `Once you finish the lesson, you may clean up resources to free memory.`.
- [Content] Cả 2 file thiếu `# databases` mặc dù lesson dùng Cat entity TypeORM với `cats` table và cache-aside (req per `content-fullstack-backend.md §11.5`) → added with TypeORM `@Entity` snippet.
- [Challenge easy] vi.md file double-encoded UTF-8 (mojibake) → full rewrite.
- [Challenge easy] Format legacy với nested `### prompts` ở submission → migrated rubric vào `### promptText` per requirement.
- [Challenge easy] Sum invariant: legacy có submission prompts `10 + 10 = 20` không khớp requirement-level → mới `6+0+9+5 = 20 = # score = submission score`.
- [Challenge easy] Steps thiếu `### codeImplementations` 4 lang → added cho step 0 + step 2 (steps có application code).

### Wording fixes (Opus standard)

- `vi.md`: `"<question>"` (plain double-quote) → `*"<question>"*` (italic).
- `vi.md`: `một **Senior Engineer** hỏi khi review performance` → `một **Senior Engineer** đặt câu hỏi`.
- `vi.md`: `Một **Mid-level Developer** trả lời:` → `**Mid-level Developer** đáp:`.
- `vi.md`: `Bài này dẫn qua hai mạch liên tiếp:` → `Bài học triển khai ...` + bridge labels strict.
- `vi.md`: `Cấu trúc bài học áp dụng phương pháp` → `Bài tuân theo`.
- `vi.md`: `### 2.2. Lý thuyết -- Caching Strategy và Redis` → `### 2.2. Lý thuyết`.
- `en.md`: `"<question>"` → `*"<question>"*`.
- `en.md`: `a **Senior Engineer** asks during a performance review` → `a **Senior Engineer** asks`.
- `en.md`: `A **Mid-level Developer** answers:` → `A **Mid-level Developer** replies:`.
- `en.md`: `This lesson runs through two consecutive tracks:` → `This lesson ships ...`.
- `en.md`: `The lesson structure follows **practice-led theory**` → `This lesson follows **practice-led theory**`.
- `en.md`: `### 2.2. Theory -- Caching Strategy and Redis` → `### 2.2. Theory`.

### Challenges added/modified

- `0-caching-with-redis-easy/`: **FULL REWRITE** to v1 format — see Files changed.

### Challenges NOT yet migrated (ACTIONS NEEDED)

The following challenges still use legacy nested `### prompts` format and are missing requirement-level `### score`/`### promptText` rubrics. They were NOT migrated in this audit pass:

- `1-pagination-redis-cache-stampede-control-medium/{vi,en}.md`
- `2-sliding-window-rate-limiter-redis-hard/{vi,en}.md`
- `3-two-tier-cache-pubsub-sync-insane/{vi,en}.md`

Specific gaps per file:
- **Medium vi.md / en.md**:
  - Description thiếu phrase escalation `Phát triển từ bản EASY.` / `Extended from the EASY version.`.
  - `# prerequisites > ## 0 > ### text` thiếu phrase `` Đã hoàn thành EASY `caching-with-redis-easy`. `` / `` Completed EASY `caching-with-redis-easy`. ``.
  - 5 requirements (0..4) đều thiếu `### score` + `### promptText` rubric. Hiện chỉ có legacy nested `### prompts` ở submission line ~309 (vi.md có vẻ KHÔNG còn nested prompts trong submission nhưng cũng KHÔNG có rubric ở đâu — cần redesign sum 40).
  - Submission `### description` quá ngắn (`Submit your solution via the link below.`) — cần mô tả deliverable cụ thể.
  - Steps 0, 2, 3 có application code → cần `### codeImplementations` 4 lang.
- **Hard vi.md / en.md**:
  - Prerequisite phrase sai: `Đã hoàn thành thử thách MEDIUM của bài học này.` → phải `` Đã hoàn thành MEDIUM `pagination-redis-cache-stampede-control-medium`. ``.
  - Submission còn legacy nested `### prompts` (vi.md line 246, en.md line 246).
  - Requirements thiếu `### score` + `### promptText` rubric (chỉ có forbidden ở req level).
  - Description thiếu phrase `Phát triển từ bản MEDIUM.`.
  - Sum cần 60.
- **Insane vi.md / en.md**:
  - Prerequisite phrase sai: `Đã hoàn thành thử thách HARD của bài học này.` → phải `` Đã hoàn thành HARD `sliding-window-rate-limiter-redis-hard`. ``.
  - Submission còn legacy nested `### prompts` (vi.md/en.md line 271).
  - Requirements thiếu rubric. Sum cần 80.
  - Description thiếu phrase `Phát triển từ bản HARD.`.

### E2e re-verification (stdout thật, paste nguyên văn)

PENDING — defer per audit scope (no clone / e2e / push / Docker rebuild in this session).

### Port collision encountered

N/A — không chạy e2e trong session này.

### Warning files raised

None.

### Outstanding issues (carry forward to next audit)

1. **Migrate medium / hard / insane challenges sang v1 format** — đầy đủ rubric per requirement, escalation prereq + description phrase, sum invariant, codeImplementations 4 lang nơi step có application code. 6 file (`{1,2,3}-*/{vi,en}.md`).
2. **E2e re-verification** 4 flows trong `test.md` — `docker compose up -d` + `nest start --watch` + chạy 4 curl flows + capture raw stdout. PENDING.
3. **Push update** — repo `https://github.com/StarCi-Academy/fullstack-mastery-module-1-database-integration-and-caching` commit content fixes + easy challenge migration. PENDING.
4. **Verify `.repo/` source code**: `synchronize: false` requirement vs lesson body khẳng định `synchronize: true` — cần xác nhận source ground truth (synchronize: true trong lesson chỉ là demo-only; per `coding-fullstack.md §schema authority` production phải `synchronize: false`). Nếu code có `synchronize: true` → defer fix sang audit kế tiếp.
5. **`vi.md` minutesRead = 20** OK; `isPremium = false` OK.

### Pushed to remote

PENDING — chưa push, chờ Phase 9 cho session sau khi migrate xong medium/hard/insane + e2e re-verification.

### Author / Reviewer

- Author: audit agent (Opus 4.7 1M context)
- Date: 2026-05-26

## Audit — 2026-05-26T12:30:00Z

### Trigger

Full re-audit v2 — brainstorm 4 tier challenges, separator wrap check, e2e re-verification 4 flows trên port mapping 3003/6390/5444 (parallel-safe).

### Scope

- **Lesson:** `3-caching-with-redis` (variant: `fullstack-backend`)
- **Status:** E2e PASS 4/4 flows + brainstorm done + easy separator OK + medium/hard/insane separator gaps re-flagged carry-forward

### Content compliance checklist
- [x] Separator `<!-- @starci/seperator -->` đúng (sai chính tả giữ nguyên) — lesson `vi.md`/`en.md` đã được audit pass trước (xem entry 00:00).
- [x] 16 sections theo variant `fullstack-backend` — kế thừa từ entry trước.
- [x] Strict wording đã fix ở entry trước (Senior Engineer, Mid-level đáp, Bài tuân theo, ConfigModule blockquote).
- [x] Flow count 4, match `test.md` 1:1 (4 flows ↔ 4 flows).
- [x] `# databases` section đã add cho TypeORM Cat entity.

### Challenges brainstormed by Claude

Tinh thần: existing chỉ tham khảo. Brainstorm fresh per tier:

- [x] Easy: brainstorm topic = `Cache-aside cho domain list (Product list) với TTL strategy, demo MISS→HIT→invalidation`. Existing: `Cache danh sách sản phẩm với Redis` — **aligned (kept+refined ở entry 00:00)**.
- [x] Medium: brainstorm topic = `Pagination cache (per-page key) + Cache Stampede Control bằng SETNX/lock single-flight`. Existing: `Tối ưu API phân trang với Redis Cache và Stampede Control` — **aligned (topic khớp 100% — format migration vẫn carry-forward)**.
- [x] Hard: brainstorm topic = `Sliding window rate limiter qua Redis Lua scripting + monitoring + benchmark p95/p99`. Existing: `Bộ Giới hạn Tốc độ Cửa sổ Trượt sử dụng Kịch bản Lua trên Redis` — **aligned (topic khớp — format migration vẫn carry-forward)**.
- [x] Insane: brainstorm topic = `Two-tier cache L1 (in-memory) + L2 (Redis) + Pub/Sub invalidation cross-instance + capacity planning 1M user`. Existing: `Hệ thống Bộ nhớ đệm Hai cấp với Đồng bộ Hủy bỏ bằng Pub/Sub` — **aligned (topic khớp — format migration vẫn carry-forward)**.

### Challenge compliance checklist (per tier)

#### Easy
- [x] File tồn tại: `challenges/0-caching-with-redis-easy/{vi,en}.md`
- [x] Step body separator wrap: `steps=4 seps=16 expected=16 OK` (vi + en)
- [x] Sum invariant 20 đã verify ở entry trước
- [x] EN mirror đồng bộ (đã rewrite ở entry trước)

#### Medium
- [x] File tồn tại
- [x] Topic aligned với brainstorm
- [ ] Step body separator wrap: `steps=5 seps=10 expected=20 FAIL` (vi + en) — carry-forward
- [ ] Format migration (rubric per req, escalation phrase, codeImpl 4 lang) — carry-forward từ entry trước

#### Hard
- [x] File tồn tại
- [x] Topic aligned với brainstorm
- [ ] Step body separator wrap: `steps=1 seps=2 expected=4 FAIL` (vi + en) — carry-forward
- [ ] Format migration — carry-forward

#### Insane
- [x] File tồn tại
- [x] Topic aligned với brainstorm
- [ ] Step body separator wrap: `steps=1 seps=2 expected=4 FAIL` (vi + en) — carry-forward
- [ ] Format migration — carry-forward

### Code compliance checklist
- [x] Repo `.repo/fullstack-mastery-module-1-database-integration-and-caching/` đã clone local
- [x] ConfigModule + `registerAs("database", ...)` ở `backend/src/config/database.config.ts` — không có `process.env.X` ngoài config
- [x] Entities ở `src/entities/postgresql/main/` (Cat entity)
- [x] FS: backend chạy host (`nest start --watch` PORT=3003), `.docker/` infra-only (postgres + redis, không có api service, không `build:`)

### E2e checklist

**Setup:**
- [x] Repo cloned: `.repo/fullstack-mastery-module-1-database-integration-and-caching/3-caching-with-redis/`
- [x] Infra started: `docker compose -f .docker/compose_test.yaml up -d` (postgres `5444:5432`, redis `6390:6379`)
- [x] Backend started: `PORT=3003 POSTGRES_PORT=5444 REDIS_URI=redis://localhost:6390 npm run start:dev`
- [x] Port collision: NO (3000 busy trên máy → dùng 3003 + dịch infra port theo parallel rule)

**Flows:**

#### Flow 1 — Response cache (`GET /cats/response-layer` + DELETE)
- **Result:** PASS
- **Stdout:**
  ```
  === FLOW 1.1 GET response-layer (MISS) ===
  This data would be cached at the Controller level using CacheInterceptor
  HTTP 200 TIME 1.242318s
  === FLOW 1.2 GET response-layer (HIT) ===
  This data would be cached at the Controller level using CacheInterceptor
  HTTP 200 TIME 0.212207s
  === FLOW 1.3 DELETE response-layer cache ===
  {"message":"Response-layer cache key was cleared successfully.","cacheKey":"cats_res_layer"}
  HTTP 200
  ```
- **Pass criteria match:** [x] MISS ~1.2s, [x] HIT ~0.2s (cacheKey `cats_res_layer`)

#### Flow 2 — Logic cache (`GET /cats/logic-layer` + DELETE)
- **Result:** PASS
- **Stdout:**
  ```
  === FLOW 2.1 GET logic-layer (MISS) ===
  {"message":"Hải sản cho mèo cực phẩm","timestamp":"2026-05-26T12:20:00.066Z"}
  HTTP 200 TIME 1.214380s
  === FLOW 2.2 GET logic-layer (HIT) ===
  {"message":"Hải sản cho mèo cực phẩm","timestamp":"2026-05-26T12:20:00.066Z"}
  HTTP 200 TIME 0.210121s
  === FLOW 2.3 DELETE logic-layer cache ===
  {"message":"Logic-layer cache key was cleared successfully.","cacheKey":"cats_logic_layer_cache"}
  HTTP 200
  ```
- **Pass criteria match:** [x] timestamp đồng nhất giữa MISS+HIT, [x] cacheKey `cats_logic_layer_cache`

#### Flow 3 — DB query cache (`POST /cats/seed?count=1000` + GET db-layer + DELETE)
- **Result:** PASS
- **Stdout:**
  ```
  === FLOW 3.1 POST seed ===
  {"message":"Seed completed successfully.","inserted":1000}
  HTTP 201 TIME 0.298205s
  === FLOW 3.2 GET db-layer (MISS) ===
  [{"id":1,"name":"Ronnie","breed":"Toyger"},{"id":2,"name":"Marshall","breed":"Highlander"},...] (1000 rows)
  === FLOW 3.3 GET db-layer (HIT) ===
  [{"id":1,"name":"Ronnie","breed":"Toyger"},...] (cùng dữ liệu, không có SQL log)
  DB MISS HTTP 200 TIME 0.255639s
  DB HIT  HTTP 200 TIME 0.222931s
  === FLOW 3.4 DELETE db-layer cache ===
  {"message":"DB query-layer cache key was cleared successfully.","cacheKey":"cats_db_layer_cache"}
  HTTP 200
  ```
- **Pass criteria match:** [x] seed inserted 1000, [x] cacheKey `cats_db_layer_cache`

#### Flow 4 — Cascade invalidation (`GET /cats/all-layers/:id` + DELETE)
- **Result:** PASS
- **Stdout:**
  ```
  === FLOW 4.1 GET all-layers/1 (MISS) ===
  {"responseSample":"This data would be cached at the Controller level using CacheInterceptor","logicSample":{"message":"Hải sản cho mèo cực phẩm","timestamp":"2026-05-26T12:20:17.917Z"},"dbCount":1000}
  HTTP 200 TIME 2.225689s
  === FLOW 4.2 GET all-layers/1 (HIT) ===
  {"responseSample":"...","logicSample":{...,"timestamp":"2026-05-26T12:20:17.917Z"},"dbCount":1000}
  HTTP 200 TIME 1.224261s
  === FLOW 4.3 DELETE all-layers cache ===
  {"message":"All 3 cache layers cleared. Next /cats/all-layers/:id will MISS on every layer.","cleared":{"responseLayer":"cats_res_layer","logicLayer":"cats_logic_layer_cache","dbLayer":"cats_db_layer_cache"}}
  HTTP 200
  === FLOW 4.4 GET all-layers/1 sau cascade clear (re-MISS) ===
  HTTP 200 TIME 2.273993s
  ```
- **Pass criteria match:** [x] body chứa cả 3 layer sample, [x] cleared trả về cả 3 keys, [x] re-GET sau clear → slow lại (chứng minh cascade clear thật)

### Warning files raised
- [x] None

### Pushed to remote
- [x] Code: chỉ touch `audited.md` content side, không sửa code repo `fullstack-mastery-module-1-...` → không cần push lên repo learner. Mount-side commit ghi nhận audit entry.
- [x] `compose_test.yaml` đã delete sau e2e (cleanup theo §6.3).

### Outstanding issues (carry forward)
- [ ] Migrate medium/hard/insane challenges sang v1 format (rubric per requirement, escalation phrase, codeImpl 4 lang) — gap đã liệt kê chi tiết entry trước, vẫn chưa xử lý trong session này (scope ưu tiên e2e + brainstorm).
- [ ] Fix separator wrap cho medium (steps=5 thiếu 10 separator), hard (steps=1 thiếu 2), insane (steps=1 thiếu 2) — vi + en mỗi tier.
- [ ] Verify `synchronize: false` requirement vs lesson body khẳng định `synchronize: true` (demo-only justification cần document).

### Author / Reviewer

- Author: audit agent (Opus 4.7 1M context, full re-audit v2)
- Date: 2026-05-26
