# Concept — Config: env vs app YAML vs mount keys

> 3 nguồn cấu hình, chọn đúng loại theo bản chất giá trị (không trộn).

- **Env** (`src/modules/env/config.ts`, đọc qua `envConfig().X.Y`) — hạ tầng: path, host, port, credential location, threshold, feature flag khác nhau theo môi trường (dev/staging/prod). KHÔNG đọc `process.env` trực tiếp ngoài `config.ts`, KHÔNG hardcode giá trị tunable. Parser đúng kiểu: `parseEnvString`/`parseEnvInt`/`parseEnvMs("30m")`/`parseEnvBool`, tên `SCREAMING_SNAKE_CASE` prefix domain, luôn có `defaultValue` chạy local được.
- **App YAML** (`.mount/config/app.yaml`, đọc qua `mountFilesystemService.appConfig().X`) — catalog nghiệp vụ/runtime ops sửa được không cần deploy: AI model list, payment provider IDs, threshold. Thêm field → `src/modules/filesystem/types/config.ts` trước, rồi sửa YAML. ⚠️ App-level config là YAML ONLY — không thêm `.json` (legacy `app.json` đã migrate).
- **Mount keys** (`.mount/...`, newline-separated) — mảng API key qua `MountFilesystemService.{openAi,gemini,claude}ApiKeys()`, KHÔNG đọc raw `fs`.
- ⚠️ Trong file `constants/` cần giá trị env → bọc **getter function**, KHÔNG top-level const (env load order — module load trước khi env sẵn sàng sẽ đọc giá trị rỗng).
- Decorator (`@Cron`, `@Interval`, `@Throttle`) nhận `envConfig().X.Y` trực tiếp (eval lúc load class, không lazy).

> Nguồn: `src/modules/env/`, `src/modules/filesystem/`
