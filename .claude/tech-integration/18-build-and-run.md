# 18 — Build & Run

## npm scripts (xem `package.json`)

```bash
# Dev — core app, watch mode
npm run start:dev

# Run CLI
npm run cli -- <command>

# Run specific app (Nest CLI monorepo)
nest start <app-name>          # backup | cli | core | ffmpeg-service

# Production build
npm run build
npm run start:prod              # node dist/apps/starci-academy-backend/main

# Tests
npm test                        # jest unit
npm run test:watch
npm run test:cov
npm run test:e2e                # apps/starci-academy-backend/test/jest-e2e.json

# Lint / format
npm run lint
npm run format
```

## Docker

Mỗi app có:

- `apps/<name>/Dockerfile`
- `apps/<name>/compose.yaml` — dev
- `apps/<name>/vps-compose.yaml` — production VPS

## Webpack

Mỗi app có `webpack.config.cjs` riêng (core, cli, ffmpeg-proccessor). NestJS dùng webpack để bundle thay vì tsc.

## Build output

- `dist/apps/<name>/main.js` — entry production.
- Webpack copy `package.json` generated (qua `generate-package-json-webpack-plugin`) để build Docker image gọn.
