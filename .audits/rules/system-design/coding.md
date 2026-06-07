# System Design — Coding rules (code repo thế nào) · đúc kết

> Bản để audit/viết CODE trong `.repo/system-design-mastery-module-*`. SD dùng **CHUNG convention NestJS/TS với Fullstack** — đọc **`../fullstack/coding.md` PHẦN A** trước (comment kĩ A0, module folder A4, file naming A5, params/result A6, JSDoc A7, data-access/exception A8, env A9, unit test A10). File này CHỈ liệt kê **SD deltas**. Code body → `contents.md §5`. Challenge → `challenges.md`.
>
> **SD KHÔNG có frontend** → bỏ hẳn `../fullstack/coding.md PHẦN B` (Vite/HeroUI/Sandbox/Playwright).
> Nguyên tắc cứng giữ nguyên: **code block `##### 2.1.3.x` + `# codeImplementations` = diff=0 với `.repo/.../src`**.

---

## S1. Repo naming + off-by-one
- `system-design-mastery-module-<N+1>-<slug>` — **off-by-one** (slot mount `<N>` → repo `<N+1>`). Khác FS (slot-matched). Verify tên `.repo` folder + git remote khớp body (xem `contents.md §5`); nhiều repo còn `NEEDS-RENAME` / lệch số/slug — đừng tin URL body, kiểm `.repo` thật.

## S2. App chạy TRONG Docker (khác FS chạy host) — multi-service cho phép
- **Khác FS**: FS app chạy trên host (`nest start --watch`), Docker chỉ infra. **SD app service đóng gói trong Docker** (Generic/Flexible/Microservices-Docker) → start = **1 lệnh** `docker compose up -d --build`.
- **Multi-service 4-lang — LAYOUT CHỐT (ruling thầy 2026-06-07): `.docker/` Ở NGOÀI (lesson root) + `<service>/<lang>/`** (SERVICE-major, LANG-minor). Tức mỗi microservice 1 folder, BÊN TRONG chia per-lang:
  ```
  <lesson>/
  ├── .docker/compose.yaml        ← Ở NGOÀI, orchestrate cả stack (per-lang chọn qua profile/biến hoặc compose riêng)
  ├── <service-1>/                ← vd inventory, order, api-gateway
  │   ├── 0-typescript/  1-java/  2-csharp/  3-go/   ← mỗi lang 1 project root (src/, Dockerfile, config)
  ├── <service-2>/ … 
  ```
  - **ANTI-PATTERN (đã gặp ở m4 cũ):** TS để rải thẳng root (`inventory/`, `order/` = TS) còn java/csharp/go ở `1-java/`/`2-csharp/`/`3-go/` → LỆCH. TS phải vào `<service>/0-typescript/`. KHÔNG có `0-typescript/` ở lesson root chứa hết services (đó là lang-major, SAI). KHÔNG TS-at-root.
  - Single-service vẫn theo pattern (1 folder service chứa per-lang, KHÔNG `src/` ở lesson root).
- 4-lang: mỗi `<service>/<lang>/` cùng API contract (xem `code-context.md`). Body `cd` trỏ `.docker` ở lesson root (không `<lang>/.docker`). Bài agnostic (k8s) → chỉ manifest, không app code per-lang.

## S3. NestJS bootstrap khi đóng gói Docker (CỨNG)
- **`await app.listen(port, "0.0.0.0")`** — container PHẢI bind `0.0.0.0`, KHÔNG default `127.0.0.1` (host `curl` → connection refused). (Khác FS host-mode không cần `"0.0.0.0"`.)
- Webhook lesson (HMAC): `NestFactory.create(AppModule, { rawBody: true })` — verify chữ ký cần raw body trước JSON parse.
- `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })` + `setGlobalPrefix("api/v1")` + `enableCors()` — như FS.

## S4. Docker / Compose convention SD
- `.docker/compose.yaml` ở **cấp lesson**. Có `name: <lesson-slug>`, `container_name: <lesson-slug>-<svc>`, network `<lesson-slug>-network` (driver bridge, explicit name), named volume.
- **Generic/Flexible** = chỉ infra image (postgres:16-alpine, redis:7-alpine, mongo:7, minio, rabbitmq:3-management-alpine, kafka, prometheus, grafana, jaeger, vault…); app service vẫn build từ Dockerfile lesson nếu có.
- **Microservices-Docker** = ≥1 app service đóng gói, **BUILD LOCAL — KHÔNG push DockerHub** (ruling thầy 2026-06-07):
  - Dockerfile multi-stage per service.
  - `.docker/compose.yaml` dùng **`build:`** (context trỏ folder service + Dockerfile) → `docker compose up -d --build` build tại chỗ. **KHÔNG** `image: starciacademy/...:latest` để pull, **KHÔNG** `docker push`/`docker manifest inspect`, **KHÔNG** Strategy-B image+build. Học viên clone là chạy ngay bằng build local, không phụ thuộc registry.
  - **DockerHub dùng KHI VÀ CHỈ KHI variant K8s** (§S5) — cluster phải pull image từ registry, không build trong cluster. Mọi variant Docker (generic/flexible/microservices-docker) = build local, KHÔNG hub.
  - Port: single `3000:3000`; multi-service mỗi service 1 host port riêng (3010/3020/3030…), ghi rõ trong bảng §2.1.2.
- **TypeORM `synchronize: false`** (CỨNG) — schema authority = `init.sql`/migration, KHÔNG để `true` (drift âm thầm).
- Env consumer PHẢI khớp key ConfigModule đăng ký (mỗi `process.env.X` ↔ `environment:` trong compose). Checklist hạ tầng: Kafka `KAFKA_BOOTSTRAP_SERVERS/GROUP_ID/TOPIC`; PG `POSTGRES_HOST/PORT/USER/PASSWORD/DB`; Redis `REDIS_HOST/PORT`; Mongo `MONGO_URI`; RabbitMQ `RABBITMQ_URL`.
- Bitnami image: DockerHub đã gỡ → dùng prefix `bitnamilegacy/*`.

## S5. Kubernetes variant (manifest — agnostic)
- **DockerHub = CASE DUY NHẤT dùng hub, IMAGE PUSH SẴN cho học viên** (ruling thầy 2026-06-07): cluster (kind/cloud) phải pull image từ registry, không build trong cluster. **Mình/chủ nhiệm push image LÊN HUB TRƯỚC khi ship lesson** (build → tag `starciacademy/<module>-<lesson>-<service>:latest` → `docker push`); manifest `image: starciacademy/...:latest` trỏ image PUBLIC. **Học viên CHỈ pull về dùng** (`kubectl apply`), **KHÔNG build/push gì** → body §2.1.4 KHÔNG hướng dẫn học viên `docker build`/`docker push`, chỉ apply manifest + pull. (Mọi variant Docker khác = build local, KHÔNG hub — §S4.)
- Folder `.kubernetes/`: `00-namespace.yaml` (prefix số theo thứ tự apply) · `deployment-<svc>.yaml` (≥2 replica, `livenessProbe` + `readinessProbe` + `resources.requests/limits` BẮT BUỘC mỗi container) · `service-<svc>.yaml` (ClusterIP default) · `configmap.yaml` · `secret.yaml` (placeholder DEV) · optional `ingress.yaml`/`hpa.yaml`/`pvc.yaml`.
- Label `app: <svc>` đồng nhất Deployment selector ↔ template ↔ Service selector.
- Helm: `.helm/<release>/values.yaml` (values cho chart upstream) hoặc `charts/<name>/{Chart.yaml,values.yaml,templates/}` (chart tự viết).
- Body start = multi-step `kubectl create namespace` → apply/helm install → `kubectl wait` → `kubectl port-forward` → curl.

## S6. codeImplementations order
- `typescript → csharp → go → java` (xem `contents.md §4`). KHÔNG `dotnet`.

## S7. Chung — như FS
- Comment **English-only**, JSDoc/doc-block per-member mọi cấp + inline `//` giải thích *why* gần từng dòng (A0/A7). TS strict, `npm run lint` sạch. `throw new Error` CẤM → `AbstractException`. Config qua `envConfig()` có default committed (chạy out-of-box → body KHÔNG mention `.env`; ngoại lệ lesson dạy env). Em-dash prose, code-fence comment English-only, tiếng Việt prose đủ dấu.

## Gate liên quan
`./.audits/check-lesson.ps1` (SD bỏ `fe-vite-clean`). Code diff=0 verify bằng Loop code↔docs (Sonnet đối chiếu `.repo`, Opus quyết khi lệch). Verify image DockerHub đã push (microservices-docker) + manifest k8s có probe/resources (k8s) trước khi PASS.
