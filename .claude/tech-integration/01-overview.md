# 01 — Tổng quan kiến trúc

Repo là **NestJS 11 monorepo** dùng **Nest CLI** (`nest-cli.json`), webpack build cho từng app.

```
starci-academy-backend/
├── apps/                       # Runnable applications (entry points)
│   ├── core/                   # API server chính (HTTP + GraphQL + Socket.IO)
│   ├── cli/                    # nest-commander CLI
│   ├── backup/                 # Backup runner (pg dump → S3)
│   ├── ffmpeg-proccessor/      # Video encoder worker (BullMQ consumer)
│   ├── ml-sucvat/              # ML side service
│   └── scripts/                # Misc scripts app
├── src/
│   ├── modules/                # Reusable Nest modules (DynamicModule, register({ isGlobal }))
│   └── features/               # Feature modules — gắn vào app, gọi nhiều modules/
├── templates/                  # Pug email templates, etc.
├── scripts/                    # Repo-level shell/node scripts
└── nest-cli.json               # Monorepo + entry mỗi app
```

## Path aliases (`tsconfig.json`)

- `@modules/*` → `src/modules/*`
- `@features/*` → `src/features/*`

## Pattern module cố định

Mỗi module/feature đều có:

- `<name>.module.ts` — class chính
- `<name>.module-definition.ts` — `ConfigurableModuleBuilder<Options>` cho `register({ isGlobal })`
- `index.ts` — re-export public API

→ Khi tạo module mới, follow đúng 3 file này.

## File khai báo trung tâm

`apps/core/src/app.module.ts` = root module list. Khi muốn biết module nào đang on, đọc file này trước.
