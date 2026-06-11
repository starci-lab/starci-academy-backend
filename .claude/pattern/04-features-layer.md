# 04 — Features Layer (`src/features/`)

Feature = nơi **gắn vào app + lộ endpoint / consumer**, gọi xuống `modules/`. Khác `modules/` (tái sử dụng thuần).

```
src/features/
├─ api/
│  ├─ core/
│  │  ├─ graphql/   queries/ mutations/   → xem 05
│  │  ├─ http/      admin/ github/ keycloak/ minio/ mount/ payos/ sepay/  → xem 06
│  │  └─ types/
│  └─ processors/   enroll/ process-git-submission/ process-google-docs-submission/
│                   resolve-github/ review-cv-submission/ review-milestone-task/ send-mail/  → xem 10
├─ socketio/        core/<namespace>/ (autocomplete, job-notifications)
├─ video-encoder/   processors/video-encoder/   (chạy trong app core)
├─ backup/          pg/
└─ cli/             utils/subs/
```

## Aggregation
- `ApiModule` (`src/features/api/...`) gom graphql + http (+ processors khi `register({ useProcessors: true })`).
- GraphQL/HTTP gom theo cây module con (xem 05). Processor gom ở `processors.module.ts`.
- Synchronizer điều phối qua `src/features/synchronizer/core/sync-orchestrator.service.ts`.

## Quy tắc
- Resolver/controller chỉ orchestrate: nhận input → gọi **domain service** (`@modules/bussiness`) hoặc module service → map kết quả. KHÔNG nhét business rule vào resolver.
- Socket.IO namespace mới → `src/features/socketio/core/<namespace>/`; trạng thái job realtime đẩy qua slice tương ứng phía FE.

## Thêm gì → ở đâu
| Loại | Vị trí |
|------|--------|
| GraphQL query/mutation | `api/core/graphql/queries\|mutations/<name>/` (xem 05) |
| REST / webhook | `api/core/http/<area>/` (xem 06) |
| BullMQ job nghiệp vụ | `api/processors/<name>/` (xem 10) |
| BullMQ job sync | `synchronizer/processors/sync-<name>/` (xem 10) |
| Socket.IO namespace | `socketio/core/<namespace>/` |
