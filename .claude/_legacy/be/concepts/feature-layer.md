# Concept — Feature layer (`src/features/`)

> Feature = nơi gắn vào app + lộ endpoint/consumer, gọi xuống [[module-layer-structure]]. Khác module (tái sử dụng thuần).

- Cây: `api/core/{graphql,http}` ([[graphql-resolver-pattern]] · [[rest-controller-pattern]]) · `api/processors/` ([[background-jobs-bullmq]]) · `socketio/core/<namespace>/` ([[realtime-socketio]]) · `video-encoder/` ([[media-dash-ffmpeg]]) · `synchronizer/` ([[elasticsearch-sync]]) · `backup/` · `cli/`.
- **3 tầng layering (STRICT)**: `controller/resolver (features/api)` → **domain service** (`@modules/bussiness`) → `EntityManager` ([[typeorm-entities-and-relations]]). Resolver/controller CHỈ orchestrate (nhận input → gọi domain service → map kết quả), KHÔNG nhét business rule.
- ❌ Anti-pattern: controller/resolver bypass domain layer, đi thẳng TypeORM repo (trừ query đơn giản 1 entity không có rule).
- `ApiModule` gom graphql + http (+ processors khi `register({ useProcessors: true })`). Socket.IO namespace mới → `src/features/socketio/core/<namespace>/`.

> Nguồn: `src/features/api/`, `src/features/socketio/`, `src/modules/bussiness/`
