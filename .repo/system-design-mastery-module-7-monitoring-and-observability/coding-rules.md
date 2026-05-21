# Quy tắc viết mã nguồn — Lab/Demo StarCi Academy (strict)

Mọi lesson repo trong khóa **System Design Mastery** bắt buộc tuân theo đúng cấu trúc dưới đây. Không được tự ý thay đổi bố cục thư mục, đổi tên compose, hay bỏ comment song ngữ.

---

## 1. Cấu trúc thư mục lesson (bắt buộc)

```
<lesson-folder>/
├── .docker/
│   └── compose.yaml          ← BẮT BUỘC tên `compose.yaml`, KHÔNG `backend.yaml` / `docker-compose.yaml`
│   └── <config-files>         ← prometheus.yml, grafana/, etc.
├── <service-name>/            ← NestJS app (ví dụ: metrics-api, tracing-api, consul-api)
│   ├── Dockerfile
│   ├── package.json
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   └── src/
│       ├── main.ts            ← Entry: chỉ import + gọi bootstrap()
│       ├── bootstrap.ts       ← NestFactory.create + ValidationPipe + listen
│       ├── app.module.ts      ← Root module
│       │                      ← KHÔNG đặt index.ts ở src/ root
│       └── <feature>/         ← Module theo feature (cats/, checkout/, metrics/)
│           ├── index.ts       ← Barrel
│           ├── <feature>.module.ts
│           ├── <feature>.controller.ts
│           ├── <feature>.service.ts
│           ├── dto/
│           │   └── index.ts
│           └── entities/
│               └── index.ts
└── .gitignore
```

**Quy tắc:**
- **Tên compose file:** luôn là `compose.yaml` trong thư mục `.docker/`. Cấm dùng `backend.yaml`, `docker-compose.yaml`, `docker-compose.yml`.
- **Mỗi lesson** có đúng 1 thư mục `.docker/` chứa compose + config files.
- **Mỗi NestJS service** nằm trong thư mục riêng cạnh `.docker/` (không lồng nhau).
- **Barrel pattern:** mọi thư mục con bên trong `src/` (feature, dto, entities, schemas, common, modules, …) **BẮT BUỘC** có `index.ts` re-export toàn bộ. **KHÔNG** đặt `index.ts` tại `src/` root.

---

## 2. Docker Compose (`compose.yaml`)

### 2.1. Naming

```yaml
# Tiền tố project Compose (tên stack / tiền tố container).
# (EN: Compose project prefix (stack / container name prefix).)
name: <lesson-folder-name>
```

- `name` = tên thư mục lesson (ví dụ: `0-monitoring-and-observability`, `1-circuit-breaker-pattern`).
- Network tên trùng lesson: `networks: { "<lesson-name>": { name: "<lesson-name>" } }`.
- **Không** dùng `external: true` cho network — Compose tự tạo/xóa.

### 2.2. Comment song ngữ (bắt buộc)

Mỗi block/service trong `compose.yaml` có comment giải thích:

```yaml
# Postgres — persistence cho `/cats` (TypeORM trong metrics-api).
# (EN: Postgres — persistence for `/cats` (TypeORM in metrics-api).)
postgres:
  image: postgres:16-alpine
```

**Format:** dòng VI trước, dòng `(EN: ...)` ngay sau.

### 2.3. Header block

Mở đầu file phải có comment block giải thích:
- Mô tả stack
- Thư mục làm việc
- Lệnh `docker compose up -d --build`
- Lệnh xem log
- Lệnh `docker compose down -v`

### 2.4. Image naming (Docker Hub)

```
starciacademy/<lesson-slug>-<service-name>:latest
```

Ví dụ: `starciacademy/monitoring-and-observability-metrics-api:latest`

### 2.5. Port mapping

Comment trên mỗi port mapping:

```yaml
ports:
  # Ánh xạ cổng host 3000 → container 3000 (HTTP API).
  # (EN: Map host port 3000 → container 3000 (HTTP API).)
  - "3000:3000"
```

---

## 3. TypeScript / NestJS

### 3.1. Entry point (`main.ts` + `bootstrap.ts`)

**`main.ts`** — entry node, chỉ import + gọi bootstrap:

```typescript
/**
 * Entry Node (`nest build` → dist/main.js) — chỉ gọi bootstrap đã export.
 * (EN: Node entry (`nest build` → dist/main.js) — invokes exported bootstrap only.)
 */
import { bootstrap } from "./bootstrap"

void bootstrap()
```

**`bootstrap.ts`** — khởi tạo Nest app:

```typescript
/**
 * Khởi tạo Nest app — ValidationPipe toàn cục và lắng nghe cổng.
 * (EN: Bootstrap Nest app — global ValidationPipe and listen on port.)
 */
export async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule)
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidUnknownValues: false,
    }))
    const port = Number(process.env.PORT) || 3000
    // Cổng: biến môi trường PORT hoặc 3000.
    // (EN: Port from env PORT or default 3000.)
    await app.listen(port, "0.0.0.0")
}
```

**Bắt buộc:** `listen("0.0.0.0")` để Docker port mapping hoạt động.

### 3.2. TypeScript Path Alias

Trong `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@<lesson-folder-name>": ["src/index.ts"],
      "@<lesson-folder-name>/*": ["src/*"]
    }
  }
}
```

- Alias = `@<lesson-folder-name>` (ví dụ: `@0-monitoring-and-observability`).
- **Cấm** viết `export * from "@<alias>"` trong chính `src/index.ts` — gây import vòng.
- Barrel chỉ dùng `export * from "./<relative-path>"`.

### 3.3. Build script

```json
{
  "scripts": {
    "build": "nest build && tsc-alias -p tsconfig.build.json"
  }
}
```

`tsc-alias` cần thiết vì `tsc` không tự đổi alias thành đường tương đối trong `dist/`.

### 3.4. Import formatting

Mỗi import trên dòng riêng, dùng destructuring object:

```typescript
import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    InjectRepository,
} from "@nestjs/typeorm"
```

**Không** gộp nhiều import trên cùng dòng. Trailing comma bắt buộc.

---

## 4. Comment song ngữ trong mã TypeScript (bắt buộc)

### 4.1. JSDoc chuẩn

- **Dòng tiếng Việt** trước (không cần tiền tố `VI:`).
- **Dòng `(EN: …)`** ngay sau — bản lược tiếng Anh.

```typescript
/**
 * Module gốc — Postgres + cats module + middleware metric HTTP.
 * (EN: Root module — Postgres + cats module + HTTP metrics middleware.)
 */
```

### 4.2. Hai tầng comment: Logic vs Code

Dùng khi một đoạn vừa mang **ý nghĩa nghiệp vụ** vừa gọi **API framework**.

```typescript
/**
 * Logic — khi DB mới/trống, lab vẫn có ít nhất một bản ghi.
 * Code — hook `OnModuleInit`: `await count()`; nhánh `0` gọi `create` + `save`.
 * (EN Logic: Fresh empty DB still yields one row so metrics are meaningful.)
 * (EN Code: `OnModuleInit` hook: `await count()`; branch `0` runs `create` + `save`.)
 */
```

**Format:**
- JSDoc: `Logic — <VI>` / `Code — <VI>` / `(EN Logic: <EN>)` / `(EN Code: <EN>)`
- Inline: `// Logic — <VI>` / `// Code — <VI>` / `// (EN Logic: …)` / `// (EN Code: …)`

### 4.3. Phạm vi bắt buộc

| Vị trí | Yêu cầu |
|--------|---------|
| Đầu file (`main.ts`, module, middleware, …) | JSDoc tóm tắt chức năng (VI + `(EN:)`) |
| `export class` / `@Controller` / `@Module` | JSDoc ngay phía trên khai báo |
| Method handler công khai (`@Get`, `@Post`, service method) | JSDoc riêng |
| Logic không đọc được từ tên biến | Comment inline `// … (EN: …)` |

**Không** comment mọi dòng import/return hiển nhiên — tránh nhiễu.

### 4.4. Inline comment

```typescript
const port = Number(process.env.PORT) || 3000
// Cổng lắng nghe: env PORT hoặc mặc định 3000.
// (EN: Listen port from env PORT or default 3000.)
```

---

## 5. Dockerfile

Multi-stage build, pattern cố định:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**Quy tắc:**
- Base image: `node:20-alpine` (hoặc phiên bản mới hơn, giữ `-alpine`).
- Stage 1 (`builder`): install all deps + build.
- Stage 2: install prod deps only + copy dist.
- `EXPOSE` port phải khớp với port trong `bootstrap.ts`.

---

## 6. ConfigModule & Environment

### 6.1. Config pattern

```typescript
// config/database.config.ts
import { registerAs } from "@nestjs/config"

export interface DatabaseConfig {
    host: string
    port: number
    username: string
    password: string
    database: string
}

export const databaseConfig = registerAs("database", (): DatabaseConfig => ({
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: Number(process.env.POSTGRES_PORT) ?? 5432,
    username: process.env.POSTGRES_USER ?? "postgres",
    password: process.env.POSTGRES_PASSWORD ?? "postgres",
    database: process.env.POSTGRES_DB ?? "demo",
}))
```

**Quy tắc:**
- Dùng `registerAs(...)` pattern cho mỗi config group.
- Giá trị mặc định luôn có để chạy ngoài Compose.
- `ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] })` trong `AppModule`.

### 6.2. File `.env`

- Repo phải ship `.env` mẫu với giá trị mặc định khớp Compose.
- `.env` **không** nằm trong `.gitignore` (vì là demo lab, không chứa secret thật).

---

## 7. TypeORM

- `autoLoadEntities: true` — không khai báo thủ công entity array.
- `synchronize: true` — chỉ dùng cho lab (production phải migration).
- Entity naming: `<Feature>Entity` (ví dụ: `CatEntity`, `ProductEntity`).
- Repository injection: `@InjectRepository(CatEntity) private readonly cats: Repository<CatEntity>`.

---

## 8. Validation

- **Global** `ValidationPipe` trong `bootstrap.ts` (không đặt per-controller).
- `whitelist: true` — strip unknown properties.
- `forbidUnknownValues: false`.
- DTO dùng `class-validator` decorators (`@IsString()`, `@IsNumber()`, `@IsNotEmpty()`).

---

## 9. Checklist trước khi push

- [ ] Compose file tên `compose.yaml` trong `.docker/`.
- [ ] `compose.yaml` có header block + comment song ngữ mọi service.
- [ ] Network name = lesson folder name, không `external`.
- [ ] Image name theo format `starciacademy/<slug>-<service>:latest`.
- [ ] `main.ts` chỉ import + gọi `bootstrap()`.
- [ ] `bootstrap.ts` có `ValidationPipe` + `listen("0.0.0.0")`.
- [ ] `tsconfig.json` có path alias `@<lesson-folder-name>`.
- [ ] Build script: `nest build && tsc-alias -p tsconfig.build.json`.
- [ ] Mọi import destructure trên dòng riêng, trailing comma.
- [ ] JSDoc song ngữ (VI + `(EN:)`) trên file, class, method.
- [ ] Logic phức tạp có hai tầng comment (Logic + Code).
- [ ] Dockerfile multi-stage `node:20-alpine`.
- [ ] `.env` mẫu có trong repo.
- [ ] Barrel `index.ts` trong mọi thư mục feature.

---

*Tài liệu phản ánh trạng thái gold standard từ module `0-monitoring-and-observability`, `2-service-discovery`, `3-distributed-tracing`. Khi refactor lớn, cập nhật mục tương ứng.*
