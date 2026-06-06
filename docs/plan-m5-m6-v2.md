# Plan — V2 migration M5 + M6 (cả 2 khóa)

> **Mục đích:** giao agent migrate 4 module sang V2, **mỗi module 1 session riêng** (workflow không bị giết giữa chừng).
> **Đọc trước khi chạy:** memory `session-brief-2026-06-03-v2-migration` (pipeline + conventions) + `v2-audit-rules.md` (§4.3 lang, §9 tier, §4.2c premium, §4.2b plain-text, §4.6 EN-comment).
> **Numbering = 0-based mount slot.** "M5" = slot 5, "M6" = slot 6.

## Trạng thái nguồn (V1 → cần migrate V2)
| Module | Slot | Content path (V1 hiện có) | Source repo (contract) |
|--------|------|---------------------------|------------------------|
| FS M5 form-mastery | `0-fullstack-mastery/modules/5-form-mastery-rhf-zod` | 4 lesson | `.repo/fullstack-mastery-module-6-form-mastery-rhf-zod/` |
| FS M6 client-state | `0-fullstack-mastery/modules/6-client-state-zustand-jotai` | 4 lesson | `.repo/fullstack-mastery-module-7-client-state-zustand-jotai/` |
| SD M5 rabbitmq-queues | `1-system-design-mastery/modules/5-rabbitmq-and-job-queues` | 3 lesson | `.repo/system-design-mastery-module-6-rabbitmq-and-job-queues/` |
| SD M6 redis-mastery | `1-system-design-mastery/modules/6-redis-mastery` | 3 lesson | `.repo/system-design-mastery-module-7-redis-mastery/` |

V2 delta mỗi lesson: thêm `bodies/<N>-<lang>/{en,vi}.md` + `challenges/.../submissions/0/{en,vi}.md` + `code-context.md` + `audited.md` + `# verified=2026-06-03`. Gate `docs/v2-gate.py` = 0 blocking.

## Quy ước chung 4 module
- **Opus CHỈ VIẾT** content + `code-context.md` + `audited.md`(expected, E2E = `PENDING chủ nhiệm verify`) + chạy gate. **KHÔNG dựng code, KHÔNG E2E** (chủ nhiệm/Gemini làm từ code-context.md).
- Spec/Explore/finalize agent → `model: 'sonnet'` (rẻ). Body-writing agent → Opus (mặc định, đừng set model).
- `description` PLAIN TEXT (cấm `**`/backtick/link). Comment trong code-block = ENGLISH cả vi+en.
- Step/req sub-block = callout `:::muted` (cấm `### 1./2./3.`). Không dịch ép thuật ngữ.
- Repo URL canonical `<course>-mastery-module-<slot0based>-<slug>`; repo thật còn tên cũ → ghi `NEEDS-RENAME` trong `code-context.md`.

---

## ① FS M5 — Form Mastery (RHF + Zod)
- **Lang:** single-track `0-agnostic` (FE React/Next/TS, renderer ẩn tab). **FE-only → KHÔNG codeImplementations.**
- **Lessons: 4** (giữ nguyên — KHÔNG thêm L4 type-safe e2e; đã bỏ). Vẫn áp §2.2.1 deep từ `docs/proposal-m5-form-mastery-upgrade.md` cho L0-L3 (dạy cơ chế, không API-usage):
  - L0 `0-useform-and-zod-resolver` — uncontrolled + schema-as-SSoT (§2.2.1: re-render cost, resolver pipeline)
  - L1 `1-async-validation-with-debounce` — race/cancellation/AbortController
  - L2 `2-multi-step-wizard-form` — FormProvider, partial schema, persist/resume
  - L3 `3-dynamic-fields-with-usefieldarray` — useFieldArray, nested, perf/virtualization
- **Tiers:** 4 per lesson (easy/medium/hard/insane) — FE giữ hard/insane để không nông; hard/insane = concept-sâu (schema-driven, race-proof, optimistic, state-machine wizard), KHÔNG "build excel". Bảng tier chi tiết: xem proposal (bỏ qua phần L4).
- **Premium:** L2, L3 (2 lesson cuối). L0-L1 free.
- **Code-context:** cả 4 lesson từ repo nguồn (NEEDS-RENAME module-6→5).
- Sau migrate: cập nhật module overview (4 lesson) + memory `fs-module-06-form-mastery-rhf-zod`.

## ② FS M6 — Client State (Zustand + Jotai)
- **Lang:** single-track `0-agnostic`. **FE-only → KHÔNG codeImplementations.**
- **Lessons: 4** (giữ nguyên):
  - L0 `0-zustand-store-and-selectors` — store, selector subscription, stable action ref, render-count proof
  - L1 `1-persist-and-cross-tab-sync` — persist middleware + localStorage/BroadcastChannel adapter
  - L2 `2-slices-pattern-for-large-stores` — StateCreator slice composition (intersection type)
  - L3 `3-jotai-atoms-for-derived-state` — primitive + derived + async atom + Suspense
- **Tiers:** 4 per merit (slot 6). hard/insane = cross-tab race, slice perf, async-atom Suspense depth.
- **Premium:** L2, L3.
- **Code-context:** từ repo nguồn (NEEDS-RENAME module-7→6). FE-only, no backend/Docker.

## ③ SD M5 — RabbitMQ & Job Queues
- **Lang:** BE 4-lang `0-typescript/1-java/2-csharp/3-go`.
- **Lessons: 3:**
  - L0 `0-rabbitmq-fundamentals` — exchange types (direct/fanout/topic). 4-lang: TS=amqplib, Java=amqp-client, C#=RabbitMQ.Client, Go=amqp091-go. **HTTP/JSON parity bắt buộc** (status + body value khớp 4 lang).
  - L1 `1-bullmq-job-queues` — ⚠️ **REFRAME → "Redis-backed Job Queue" portable 4-lang** (BullMQ là Node-only, không ép). Title đổi thành job-queue tổng quát nền Redis; mỗi lang 1 lib tương đương: **TS=BullMQ · Java=Spring Batch/Quartz · C#=Hangfire · Go=asynq**. Concept chung: enqueue/worker, priority, delayed, retries, DLQ. (Giữ folder slug `1-bullmq-job-queues` để khỏi vỡ path; flag optional-rename cho chủ nhiệm trong code-context.) Repo nguồn chỉ có TS → code-context.md mô tả equivalent Hangfire/asynq/Quartz cho 3 lang còn lại.
  - L2 `2-rate-limiting-with-queues` — token bucket Lua trong Redis (portable 4-lang), throttled worker.
- **Tiers:** 4 per merit (slot 5, SD distributed giữ hard/insane). Tham khảo legacy challenge: L0 headers-exchange / work-queue LB / DLX+confirms; L1 worker-concurrency / idempotent-jobId / DLQ-replayer; L2 per-endpoint / sliding-window / tier-aware multi-queue.
- **Premium:** L2 (cuối).
- **Repo:** NEEDS-RENAME `module-6` → `module-5`.

## ④ SD M6 — Redis Mastery
- **Lang:** BE 4-lang. (Redis client đủ 4 lang: ioredis/Jedis-Lettuce/StackExchange.Redis/go-redis.)
- **Lessons: 3:**
  - L0 `0-redis-data-structures` — string/hash/list/set/zset/stream, 6 endpoint group.
  - L1 `1-lua-scripting-and-geo` — atomic transfer via Lua (EVAL) + GEOADD/GEOSEARCH. Lua = language-agnostic → parity dễ.
  - L2 `2-redis-cluster` — CRC16 slot calc + hash-tag co-location. (⚠️ grokzen image announce internal IP → live MOVED/ASK khó trên Docker Desktop; deep-dive ở M20. Opus KHÔNG E2E nên chỉ ghi limitation vào code-context/audited.)
- **Tiers:** 4 per merit (slot 6, SD distributed).
- **Premium:** L2 (cuối).
- **Repo:** NEEDS-RENAME `module-7` → `module-6`.

---

## Pipeline mỗi session (đã chạy mượt M1-M4)
1. **Pre-clean:** kiểm challenge index không trùng; áp policy tier (slot≥4 → giữ hard/insane per-merit). FS M5: tạo skeleton folder L4.
2. **Extract contract** (Explore agent, sonnet): đọc `.repo/<source-repo>/<lesson>` → endpoints / JSON shape / flows / infra. (FS M5 L4 + SD M5 L1 ba-lang mới: không có code → mô tả target từ proposal/equivalent lib.)
3. **Workflow background** (body agent = Opus): roots metadata + `bodies/<N>-<lang>` (lesson×lang) + challenges + submissions. Embed vào prompt: contract + lang-model (agnostic / 4-lang) + premium flag + plain-text desc + cross-lang parity (HTTP status + JSON value).
4. **Gate rẻ:** `python3 docs/v2-gate.py <contents-path>` → fix mọi `!!` deterministic (KHÔNG LLM re-review). Lỗi hay gặp: HTTP-status lệch giữa lang, thiếu separator, body lạc repo, thiếu submission.
5. **Finalize** (sonnet): set `# verified=2026-06-03` (script) + viết `code-context.md` (repo canonical + NEEDS-RENAME + target build cho code mới) + `audited.md` (expected, E2E = PENDING chủ nhiệm).
6. **Update memory** + module overview.

## ⚠️ Vận hành (bắt buộc nhắc user)
- **Background workflow BỊ GIẾT nếu user nhắn main-loop giữa chừng** → ĐỪNG NHẮN ~20-30 phút/module; theo dõi read-only qua `/workflows`. Chết thì relaunch `{scriptPath, resumeFromRunId}`.
- Agent không set model = Opus (đắt) → chỉ body-writing dùng Opus; explore/finalize set `sonnet`.

## Kết quả mong đợi (Definition of Done / module)
- Đủ `bodies/<N>-<lang>` (4 lesson×1 agnostic=4 cho FS M5; 4 cho FS M6; 3 lesson×4 lang=12 cho SD M5/M6) + challenges 4-tier per-merit + submissions criteria.
- `code-context.md` + `audited.md` + `# verified` mỗi lesson.
- `docs/v2-gate.py` BLOCKING = 0.
- Memory + overview cập nhật.

---

## Prompt paste-sẵn cho 4 session mới

> Mỗi prompt = mở session mới trong repo backend rồi dán. Để agent tự đọc plan này + handoff memory.

### Session 1 — FS M5 (form-mastery)
```
Migrate FS M5 (slot 5 form-mastery-rhf-zod) sang V2. Đọc docs/plan-m5-m6-v2.md mục ① + memory session-brief-2026-06-03-v2-migration + docs/proposal-m5-form-mastery-upgrade.md (CHỈ lấy phần §2.2.1 deep cho L0-L3; BỎ L4 type-safe e2e — module giữ 4 lesson). Single-track agnostic, FE-only (no codeImpl), tier 4/lesson, premium L2+L3. Chạy đúng pipeline 6 bước trong plan. Workflow body = Opus, explore/finalize = sonnet. Tao SẼ KHÔNG nhắn ~25 phút khi workflow chạy — báo tao khi xong.
```

### Session 2 — FS M6 (client-state)
```
Migrate FS M6 (slot 6 client-state-zustand-jotai) sang V2. Đọc docs/plan-m5-m6-v2.md mục ② + memory session-brief-2026-06-03-v2-migration + fs-module-07-client-state-zustand-jotai. Single-track agnostic, FE-only (no codeImpl), 4 lesson, tier 4/lesson per-merit, premium L2+L3. Source repo .repo/fullstack-mastery-module-7-client-state-zustand-jotai (NEEDS-RENAME module-7→6). Pipeline 6 bước. Body=Opus, explore/finalize=sonnet. Tao không nhắn ~25 phút.
```

### Session 3 — SD M5 (rabbitmq-queues)
```
Migrate SD M5 (slot 5 rabbitmq-and-job-queues) sang V2. Đọc docs/plan-m5-m6-v2.md mục ③ + memory session-brief-2026-06-03-v2-migration + sd-module-06-rabbitmq-and-job-queues. BE 4-lang. L1 REFRAME thành "Redis-backed Job Queue" 4-lang (TS=BullMQ, Java=Spring Batch/Quartz, C#=Hangfire, Go=asynq) — code-context mô tả equivalent cho 3 lang mới. Cross-lang parity HTTP-status+JSON. Tier 4/merit, premium L2. Source .repo/system-design-mastery-module-6-rabbitmq-and-job-queues (NEEDS-RENAME module-6→5). Pipeline 6 bước. Body=Opus, explore/finalize=sonnet. Tao không nhắn ~25 phút.
```

### Session 4 — SD M6 (redis-mastery)
```
Migrate SD M6 (slot 6 redis-mastery) sang V2. Đọc docs/plan-m5-m6-v2.md mục ④ + memory session-brief-2026-06-03-v2-migration + sd-module-07-redis-mastery. BE 4-lang (ioredis/Lettuce/StackExchange.Redis/go-redis). 3 lesson, Lua parity dễ, L2 cluster ghi limitation grokzen vào code-context (no E2E). Tier 4/merit, premium L2. Source .repo/system-design-mastery-module-7-redis-mastery (NEEDS-RENAME module-7→6). Pipeline 6 bước. Body=Opus, explore/finalize=sonnet. Tao không nhắn ~25 phút.
```
