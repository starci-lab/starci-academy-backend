# 02 — Entry points (`apps/`)

| App | Path | Run command | Vai trò |
|-----|------|-------------|---------|
| `core` | `apps/core/src/main.ts` | `npm start` (default) | HTTP API + GraphQL + WebSocket + processors mặc định |
| `cli` | `apps/cli/src/main.ts` | `npm run cli -- <command>` | nest-commander CLI (seed, migrate, ad-hoc) |
| `backup` | `apps/backup/src/main.ts` | `nest start backup` | PG backup worker |
| `mock` | `apps/mock/src/main.ts` | `nest start mock` | In-memory mock server (Sandpack) |

Mỗi app có riêng `Dockerfile`, `compose.yaml` (dev), `vps-compose.yaml` (prod), `webpack.config.cjs`.

## App.module quan trọng

- **`apps/core/src/app.module.ts`** — root module list, là bản kê khai chính.
- **`apps/cli/src/app.module.ts`** — module list cho CLI (subset của core).

## Nest CLI monorepo

`nest-cli.json` khai báo: `root = apps/core`, các project khác qua `projects.<name>`. `npm start` mặc định chạy core.
