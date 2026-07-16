# Audit: BE code-style — Config & Env

Rubric: `d/Repositories/starci-claude-canon/patterns/be/config-and-env.md`
Scope quét: `src/**` (grep `process\.env`, `envConfig` import path, hard-coded duration constants đối chiếu `envConfig()` trong `src/modules/env/config.ts`).

## Findings

| file:line | rule vi phạm | trích | fix |
|---|---|---|---|
| `src/features/mock/store/session-store.service.ts:26,29` | #3 — hằng số thời lượng hard-code thay vì `parseEnvMs` trong `envConfig()` | `const SESSION_TTL_MS = 30 * 60 * 1000` / `const CLEANUP_INTERVAL_MS = 5 * 60 * 1000` (không import `@modules/env`) | thêm node `envConfig().services.mock.sessionTtlMs` / `cleanupIntervalMs` qua `parseEnvMs`, consumer đọc từ đó |
| `src/features/mock/file-store/file-store.service.ts:24,27` | #3 — same pattern | `const ENTRY_TTL_MS = 30 * 60 * 1000` / `const CLEANUP_INTERVAL_MS = 5 * 60 * 1000` (không import `@modules/env`) | same — node config `parseEnvMs` |
| `src/modules/bussiness/flashcard/flashcard-review-session.service.ts:43` | #3 — hard-code, **trùng lặp 4 nơi** | `const RESUME_WINDOW_HOURS = 24` | gom về 1 node `envConfig().flashcard.resumeWindowHours` (`parseEnvInt`/`parseEnvMs`) |
| `src/modules/bussiness/flashcard/flashcard-due-review-session.service.ts:36` | #3 — hard-code, trùng lặp | `const RESUME_WINDOW_HOURS = 24` | dùng chung node config trên |
| `src/features/api/core/graphql/queries/flashcard/my-in-progress-flashcard-quiz-session/my-in-progress-flashcard-quiz-session.service.ts:31` | #3 — hard-code, trùng lặp | `const RESUME_WINDOW_HOURS = 24` | dùng chung node config trên |
| `src/features/api/core/graphql/queries/flashcard-decks/my-in-progress-mock-interview-session/my-in-progress-mock-interview-session.service.ts:30` | #3 — hard-code, trùng lặp | `const RESUME_WINDOW_HOURS = 24` | dùng chung node config trên |
| `src/modules/cache/ai-ping-cache.service.ts:35` | #3 — hard-code, không qua `envConfig()` | `private static readonly DISABLED_COOLDOWN_MS = 24 * 60 * 60 * 1000` | node config `parseEnvMs` |
| `src/modules/rag/public-rag-playground-cleanup.service.ts:24` | #3 — hard-code, không qua `envConfig()` | `const IDLE_TTL_MS = 2 * 60 * 60_000` | node config `parseEnvMs` |
| `src/modules/bussiness/notification/social-digest-cron.service.ts:35` | #3 — hard-code, không qua `envConfig()` | `const DIGEST_WINDOW_MS = 24 * 60 * 60 * 1000` | node config `parseEnvMs` |
| `src/features/tools/pg-backup/pg-backup.service.ts:152` | #1 (borderline) — `...process.env` spread cho child-process `env`, **không nằm trong 3 ngoại lệ nêu tên trong rubric** (rubric chỉ liệt `mount.service.ts` + `features/backup/pg/pg.service.ts`) | `env: { ...process.env, BACKUP_ENCRYPT_PASSWORD: encryptPassword }` | cùng dạng exec-spawn hợp lệ như `pg.service.ts` — cập nhật rubric thêm file này vào danh sách ngoại lệ (không phải bug code, là rubric-doc thiếu) |

## Tổng

**9 vi phạm thật** (rule #3 — hằng số thời lượng cấu hình bị hard-code ngoài `envConfig()`, một cụm `RESUME_WINDOW_HOURS=24` lặp lại độc lập ở 4 file) + **1 ghi chú rubric-doc thiếu** (pg-backup.service.ts spread `process.env` cho spawn, cùng loại ngoại lệ hợp lệ như pg.service.ts nhưng chưa được liệt tên). Rule #1 (process.env chỉ trong parse-env.ts), #2 (import qua barrel `@modules/env`), #4 (shaping trong envConfig), #5 (secret không qua env) — **sạch**, không tìm thấy vi phạm nào ngoài case borderline trên. Mức nghiêm trọng: THẤP-TRUNG BÌNH (nợ code-style, không phải bug runtime; đáng chú ý nhất là 4-way duplication của `RESUME_WINDOW_HOURS`).
