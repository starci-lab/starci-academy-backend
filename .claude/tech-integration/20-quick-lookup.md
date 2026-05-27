# 20 — Quick lookup ("muốn X → mở đâu")

| Bạn muốn... | Mở file/folder |
|-------------|----------------|
| Biết module nào đang chạy ở core app | `apps/core/src/app.module.ts` |
| Schema database | `src/modules/databases/postgresql/primary/entities/` |
| Thêm REST endpoint | `src/features/api/core/http/<area>/` |
| Thêm GraphQL query/mutation | `src/features/api/core/graphql/queries\|mutations/` |
| Thêm BullMQ job consumer (nghiệp vụ) | `src/features/api/processors/<name>/` |
| Thêm BullMQ job consumer (sync) | `src/features/synchronizer/processors/<name>/` |
| Thêm Socket.IO namespace | `src/features/socketio/core/<namespace>/` |
| Thêm AI prompt/router | `src/modules/ai/<thing>-router.service.ts` |
| Thêm email template | `templates/<name>.pug` + processor ở `features/api/processors/send-mail/` |
| Thêm S3 bucket/op | `src/modules/s3/s3-*.service.ts` |
| Thêm CLI command | `apps/cli/src/` (nest-commander) |
| Sửa Keycloak login | `src/modules/keycloak/` |
| Webhook PayOS/Sepay | `src/features/api/core/http/payos\|sepay/` |
| Indexing/reindex flow | `src/features/synchronizer/core/elasticsearch-synchronizer/` |
| Video encode pipeline | `src/features/video-encoder/` + `apps/ffmpeg-proccessor/` |
| Cache decorator | `src/modules/cache/cache.decorators.ts` |
| Rate limit | `src/modules/throttler/` |
| NATS event subject | `src/modules/event/enums/` + register ở `apps/core/src/app.module.ts` |
| Custom validator | `src/modules/vaildators/` |
| Domain guard | `src/modules/bussiness/guards/` |
| LangChain model wrapper | `src/modules/langchain/model.service.ts` |
| Vector store (Qdrant) | `src/modules/databases/qdrant/` |
| Sentry instrument | `src/modules/sentry/` |
| Winston/Loki logger | `src/modules/winston/` |
| Cron job | dùng `@Cron(...)` decorator, scan service nào có `@Injectable()` + `ScheduleModule` |
| Bento4 packaging | `src/modules/bento4/` |
| FFmpeg op | `src/modules/ffmpeg/` |
