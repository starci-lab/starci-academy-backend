# 16 — Init & Seeders

Path: `src/modules/init/`

| File / Folder | Purpose |
|---------------|---------|
| `init.service.ts` | Run lúc app startup — orchestrate plugin |
| `seeders/` | Plugin-based seeders |
| `synchronizers/` | Startup sync plugins |
| `utils/`, `types/` | Helpers |

## Cách dùng

- `InitModule.register({ isGlobal: true })` trong `apps/core/src/app.module.ts`.
- PostgreSQL seeder gated bởi: `PrimaryPostgreSQLModule.register({ withSeeders: { manualSeed: true } })`.
- Seeders chạy 1 lần khi DB rỗng hoặc khi gọi qua CLI.

## Thứ tự init

1. EnvModule load env.
2. Logger (Winston) sẵn sàng.
3. Database connect.
4. InitModule chạy seeders (nếu cần) + startup synchronizers.
5. App bind HTTP/GraphQL/Socket → ready.

## Thêm seeder mới

1. Tạo file ở `src/modules/init/seeders/<name>.seeder.ts`.
2. Export class implement interface seeder (xem mẫu file có sẵn).
3. Đăng ký vào aggregator của `seeders/`.
