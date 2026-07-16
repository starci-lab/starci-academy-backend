# Concept — Elasticsearch sync (Postgres → ES)

> `@modules/elasticsearch` — search + indexing, `mappings/` per-entity (course, content, challenge, coding-problem, flashcard-deck, milestone, user, consultants, headhunting-companies, foundation-category…).

- Đồng bộ chủ yếu qua **Kafka CDC listener** (không phải CQRS projection base): vd `EsSyncUserListener` (`src/modules/bussiness/es-sync/es-sync-user.listener.ts`) tự quản Kafka wiring — Debezium stream `public.users` → topic → listener lấy id → `EsSyncUserService.reindexOne` upsert (live) hoặc delete (soft-deleted/missing). Idempotent, delivery at-least-once nên duplicate vô hại.
- Phân biệt với [[cqrs-projection-and-cdc]]: sync này ghi vào ES (search index), không phải Postgres read-model — lý do KHÔNG extends `AbstractProjectionListener` chung.
- Reindex hàng loạt (bootstrap/reconcile) qua `src/modules/init/synchronizers/elasticsearch-synchronizer/` — chạy lúc startup qua `InitModule`, xem [[init-v2-and-seeders]].
- `elasticsearch-index-reset.service.ts` cho phép reset mapping khi schema đổi.
- Field nhạy cảm (đáp án mẫu, rubric) → builder sync **đừng index** — đồng bộ với luật `@Field` gate ở [[typeorm-entities-and-relations]].
- **Gotcha đọc 2-nguồn (2026-07-08):** khi 1 feature đọc LIST từ Postgres nhưng đọc SINGLE-ITEM (`getById`) từ ES (vd flashcard deck: `flashcardDecksByCourse` = Postgres, `flashcardDeck(id)` = ES), 1 row có ở DB nhưng CHƯA index ES → single-item read 404 "not found" dù item THẬT sự tồn tại. FE gọi single-item cho từng row của LIST (vd build phiên quiz từ N deck) dễ vỡ nếu không tách lỗi-fetch khỏi rỗng-thật, xem [[parallel-fetch-partial-failure-must-not-read-as-empty]] (FE engineering). Khi gặp `*NotFoundException` cho 1 id CÓ THẬT trong DB list → nghi ngờ trước tiên là ES chưa index (reconcile), không phải bug logic.

> Nguồn: `src/modules/elasticsearch/`, `src/modules/bussiness/es-sync/`, `src/modules/init/synchronizers/elasticsearch-synchronizer/`
