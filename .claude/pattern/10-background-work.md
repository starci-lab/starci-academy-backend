# 10 — Background Work (BullMQ, Synchronizers, Cron, Seeders)

## BullMQ processors
Hai loại, khác chỗ đặt:
- **Nghiệp vụ** → `src/features/api/processors/<name>/`
- **Sync (reindex/CDN…)** → `src/features/synchronizer/processors/sync-<name>/`

Cây 1 processor:
```
<name>/
├─ <name>.processor.ts   # @Processor(BullMQQueue.X) extends WorkerHost
├─ <name>.service.ts     # logic chính
├─ dto/                  # typing payload job
└─ index.ts
```
- Class `@Processor(BullMQQueue.X) extends WorkerHost` → override `process(job)`. Inject domain/module service cần thiết.
- Đăng ký: thêm provider vào `processors.module.ts` (hoặc `synchronizer/processors.module.ts`). Core bật bằng `ApiModule.register({ useProcessors: true })`.
- Processor nghiệp vụ có sẵn: `enroll`, `process-git-submission`, `process-google-docs-submission`, `resolve-github`, `review-cv-submission`, `review-milestone-task`, `send-mail`.
- Enqueue: dùng service wrapper trong `@modules/bussiness` (vd `EnqueueSendMailJobService.enqueue(payload)`), thường được publish từ CQRS handler (xem 09).

## Synchronizers (`src/features/synchronizer/`)
- `core/<x>-synchronizer/` = orchestrator, `processors/sync-<x>/` = consumer.
- Có: CDN, Elasticsearch (reindex PG→ES), Indexer (autocomplete), Bloom filters (email dedup).
- `core/sync-orchestrator.service.ts` điều phối, trigger qua schedule hoặc manual API. State mỗi run lưu ở `sync-state.entity.ts` + `sync-state.service.ts`.

## Video encode
`src/features/video-encoder/processors/video-encoder/` (cặp với app `apps/ffmpeg-proccessor/`). Dùng `@modules/ffmpeg` + `@modules/bento4` (DASH/HLS packaging).

## Cron / Interval (xem coding-conventions §9)
- "Chạy lúc 03:00…" → `@Cron(envConfig().X.cron, { name })`.
- "Ping mỗi N ms" → `@Interval("name", envConfig().X.intervalMs)`.
- **Job poll external theo nhịp/per-instance** → ưu tiên `setTimeout(random jitter)` → `setInterval` trong `OnModuleInit`, cleanup ở `OnModuleDestroy` (tránh thundering herd + Jest leak). KHÔNG hardcode interval — luôn `envConfig()`.

## Init & Seeders (`src/modules/init/`)
- `InitModule.register({ isGlobal: true })` chạy lúc startup: seeders + startup synchronizers.
- ⚠️ Seeder **manual**: `PrimaryPostgreSQLModule.register({ withSeeders: { manualSeed: true } })` → KHÔNG tự chạy lúc boot, trigger qua CLI/init flow. Đừng giả định DB đã seed.
- Thêm seeder: `src/modules/init/seeders/<name>.seeder.ts` → implement interface seeder → đăng ký vào aggregator `seeders/`.
