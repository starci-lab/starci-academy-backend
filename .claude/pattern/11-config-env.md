# 11 — Config: Env vs App YAML vs Mount Keys

3 nguồn cấu hình, chọn đúng loại (chi tiết: coding-conventions §8, §9).

| Layer | File | Đọc qua | Dùng cho |
|-------|------|---------|----------|
| **Env** | `src/modules/env/config.ts` | `envConfig().X.Y` | Hạ tầng: path, host, port, credential location, threshold, feature flag — khác nhau theo môi trường (dev/staging/prod) |
| **App YAML** | `.mount/config/app.yaml` | `mountFilesystemService.appConfig().X` | Catalog nghiệp vụ/runtime: AI model list, payment provider IDs, threshold ops sửa được không cần deploy |
| **Mount keys** | `.mount/...` (newline-separated) | `MountFilesystemService.{openAi,gemini,claude}ApiKeys()` | Mảng API key — KHÔNG đọc raw `fs` |

## Env (`envConfig()`)
- KHÔNG đọc `process.env` trực tiếp ngoài `config.ts`. KHÔNG hardcode giá trị tunable.
- Thêm key: group theo domain (`mountPath`, `databases`, `s3`, `keycloak`, `ai`, `aiBalancer`, `init`…), parser đúng kiểu: `parseEnvString` / `parseEnvInt` / `parseEnvMs("30m")` / `parseEnvBool`. Tên env `SCREAMING_SNAKE_CASE` prefix domain. Luôn có `defaultValue` chạy được local.
- Decorator (`@Cron`, `@Interval`, `@Throttle`) nhận `envConfig().X.Y` trực tiếp (eval lúc load class).
- ⚠️ Trong file `constants/` cần giá trị env → bọc **getter function**, KHÔNG top-level const (env load order).

## App YAML (`appConfig()`)
1. Thêm field vào `src/modules/filesystem/types/config.ts` (`AppConfig`/nested), export từ `types/`.
2. Sửa `.mount/config/app.yaml` (có comment, dễ đọc).
3. Đọc qua `mountFilesystemService.appConfig().<field>`.
- ⚠️ App-level config là **YAML only** — KHÔNG thêm `.json` config (legacy `app.json` đã migrate).
