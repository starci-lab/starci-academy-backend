# Config & Env — code-style

Phạm vi: cách BE đọc cấu hình/biến môi trường — ai được chạm `process.env`, consumer đọc config kiểu gì, secret sống ở đâu. Ground 100% từ `src/modules/env/**` và các consumer thật.

---

## 1. `process.env[...]` CHỈ được chạm trong `src/modules/env/utils/parse-env.ts`

Toàn bộ việc đọc `process.env` gom vào bộ helper `parseEnv*`. Không service/handler/provider nào đọc `process.env` trực tiếp — đọc rải rác = mất typing, mất default, không grep được một chỗ.

✅ ĐÚNG — helper là nơi DUY NHẤT đụng `process.env` (`src/modules/env/utils/parse-env.ts`):
```ts
export const parseEnvInt = ({ key, defaultValue }: ParseEnvIntParams): number => {
    return parseInt(process.env[key] ?? defaultValue.toString(), 10)
}
```

❌ SAI — consumer tự bốc env:
```ts
const maxDevices = parseInt(process.env.SESSION_MAX_DEVICES ?? "2", 10) // đọc rải, không typed
```

Ngoại lệ HỢP LỆ (biên hệ thống, không phải business logic), chỉ 3 chỗ:
- `src/modules/sentry/instrument.ts` — Sentry init CHẠY TRƯỚC Nest boot nên chưa có config: `environment: process.env.NODE_ENV`.
- `src/modules/filesystem/mount.service.ts` / `src/features/backup/pg/pg.service.ts` — truyền `...process.env` xuống child process (`spawn`), không phải đọc để dùng.

Ngoài 3 dạng trên, `process.env` mới = sai.

---

## 2. Consumer đọc config qua `envConfig().x.y`, import từ `@modules/env`

Mọi giá trị cấu hình lấy bằng cách GỌI `envConfig()` rồi truy field lồng nhau. Import từ barrel `@modules/env` (không import sâu vào `config.ts`).

✅ ĐÚNG (`src/modules/session/session.service.ts`, `src/modules/csrf/csrf.service.ts`):
```ts
import { envConfig } from "@modules/env"
// ...
const max = envConfig().session.maxDevices
if (envConfig().cookie.domain) { /* ... */ }
```

✅ ĐÚNG — nội suy trực tiếp trong template (`src/modules/ai/balancer/use-api.service.ts`):
```ts
url: `${envConfig().ai.openrouter.baseUrl}/chat/completions`,
```

❌ SAI — import sâu vào file config:
```ts
import { envConfig } from "@modules/env/config" // dùng barrel @modules/env
```

---

## 3. Mỗi node config = một `parseEnv*({ key, defaultValue })` trong `envConfig()`

`envConfig` (`src/modules/env/config.ts`) là cây object; mỗi lá đi qua đúng một helper theo kiểu dữ liệu, LUÔN có `defaultValue`. Chọn helper theo kiểu: `parseEnvString` / `parseEnvInt` / `parseEnvFloat` / `parseEnvBoolean` / `parseEnvMs` (duration → ms) / `parseEnvSecond` / `parseEnvJson<T>`.

✅ ĐÚNG (`src/modules/env/config.ts`):
```ts
maxDevices: parseEnvInt({ key: "SESSION_MAX_DEVICES", defaultValue: 2 }),
ttlMs: parseEnvMs({ key: "SESSION_TTL", defaultValue: "30d" }),
teamSlugsByCourseSlug: parseEnvJson<Record<string, string>>({
    key: "GITHUB_TEAM_SLUGS_BY_COURSE_SLUG",
    defaultValue: JSON.stringify({ "fullstack-mastery": "fullstack-mastery" }),
}),
```

❌ SAI — hard-code hằng số trong service thay vì để thành node config có key + default:
```ts
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // phải là parseEnvMs trong envConfig()
```

Quy ước: mọi thời lượng dùng `parseEnvMs` với chuỗi `ms` (`"30s"`, `"1m"`, `"1h"`, `"100years"`) — KHÔNG viết số mili-giây thô.

---

## 4. Shaping giá trị nằm TRONG `envConfig()`, không đẩy xuống consumer

Cần split/filter/so sánh/dựng list → làm ngay tại lá config để consumer nhận đúng kiểu đã sạch.

✅ ĐÚNG (`src/modules/env/config.ts`):
```ts
isProduction: parseEnvString({ key: "NODE_ENV", defaultValue: "development" }) === "production",

contactPoints: parseEnvString({ key: "SCYLLADB_CONTACT_POINTS", defaultValue: "localhost" })
    .split(",").map((host) => host.trim()).filter((host) => host !== ""),

// list env đánh số CORS_ORIGIN_1..10, rỗng thì loại
origins: Array.from({ length: 10 }, (_, i) =>
    parseEnvString({ key: `CORS_ORIGIN_${i + 1}`, defaultValue: "http://localhost:3000" }),
).filter((url) => url !== ""),
```

❌ SAI — trả chuỗi thô rồi bắt consumer tự `.split(",")` mỗi nơi.

---

## 5. Secret KHÔNG phải env var — đọc on-demand từ file mount

Khóa/API-secret không nằm trong `process.env`. `envConfig().mountPath.*` chỉ giữ ĐƯỜNG DẪN file (có thể override qua env); GIÁ TRỊ secret đọc bằng `readFileSync` trong `src/modules/filesystem/utils/mount-secrets.ts`. Mục tiêu: tránh rò secret qua log/APM (xem chú thích `src/modules/filesystem/mount.service.ts`: "Avoid using process.env for sensitive secrets").

✅ ĐÚNG (`src/modules/filesystem/utils/mount-secrets.ts`):
```ts
export const getS3SecretAccessKey = (): string =>
    readFileSync(envConfig().mountPath.terraform.s3SecretAccessKey, "utf8")
```

✅ ĐÚNG — config.ts chỉ khai path + ghi rõ secret không phải env (`src/modules/env/config.ts`):
```ts
stripe: {
    // Secrets (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) are NOT env vars —
    // they live in mount-terraform files read via MountFilesystemService.
    currency: parseEnvString({ key: "STRIPE_CURRENCY", defaultValue: "usd" }),
},
```

❌ SAI — nhét secret vào env rồi đọc thẳng:
```ts
const key = process.env.STRIPE_SECRET_KEY // secret phải đọc từ file mount, không qua env
```
