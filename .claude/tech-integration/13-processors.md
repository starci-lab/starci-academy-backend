# 13 — BullMQ Processors (`src/features/api/processors/`)

| Processor | Path | Purpose |
|-----------|------|---------|
| `enroll/` | `src/features/api/processors/enroll/` | Enroll user vào course (async pipeline) |
| `process-git-submission/` | `…/process-git-submission/` | Chấm challenge submit qua Git/PR |
| `process-google-docs-submission/` | `…/process-google-docs-submission/` | Chấm submission là Google Docs |
| `resolve-github/` | `…/resolve-github/` | Resolve GitHub repo metadata |
| `review-cv-submission/` | `…/review-cv-submission/` | LLM review CV |
| `review-milestone-task/` | `…/review-milestone-task/` | LLM grade milestone task |
| `send-mail/` | `…/send-mail/` | Send email via mailer |

## Pattern processor

Mỗi folder thường có:

```
<name>/
├── <name>.processor.ts        # @Processor(QueueName) class
├── <name>.service.ts          # Logic chính
├── dto/                       # Job payload typings
└── index.ts
```

## Đăng ký vào feature module

`src/features/api/processors/processors.module.ts` + `processors.module-definition.ts` aggregate tất cả processor con. App.module bật bằng `ApiModule.register({ useProcessors: true })`.

## Khi thêm processor mới

1. Tạo folder `src/features/api/processors/<name>/`.
2. Tạo class `@Processor(BullMQQueue.X)` extend `WorkerHost` (BullMQ pattern).
3. Inject service business cần thiết.
4. Export trong `index.ts`.
5. Add provider vào `processors.module.ts`.
