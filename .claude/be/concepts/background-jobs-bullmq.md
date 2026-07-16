# Concept — Background jobs (BullMQ processors)

> Hai loại processor, khác chỗ đặt: **nghiệp vụ** → `src/features/api/processors/<name>/`; **sync** → `src/features/synchronizer/processors/sync-<name>/`.

- Cây 1 processor: `<name>.processor.ts` (`@Processor(BullMQQueue.X) extends WorkerHost`, override `process(job)`) + `<name>.service.ts` (logic chính) + `dto/` (typing payload) + `index.ts`.
- Đăng ký: thêm provider vào `processors.module.ts` — core bật bằng `ApiModule.register({ useProcessors: true })`.
- Processor nghiệp vụ có sẵn: `enroll`, `process-git-submission`, `process-google-docs-submission`, `resolve-github`, `review-cv-submission`, `review-milestone-task`, `send-mail`.
- Enqueue qua service wrapper trong `@modules/bussiness` (vd `EnqueueSendMailJobService.enqueue(payload)`), thường publish từ [[cqrs-commands-events]] handler — decoupled event → enqueue job, không gọi trực tiếp.
- Video encode chạy **trong app `core`** (không phải app riêng): `src/features/video-encoder/processors/video-encoder/`, xem [[media-dash-ffmpeg]].
- Cron/interval: `@Cron(envConfig().X.cron)` cho lịch cố định; job poll external theo nhịp ưu tiên `setTimeout(random jitter)` → `setInterval` trong `OnModuleInit` (tránh thundering herd), luôn qua `envConfig()` (xem [[config-and-env]]) — không hardcode interval.

> Nguồn: `src/features/api/processors/`, `src/features/synchronizer/processors/`, `src/modules/bullmq/`
