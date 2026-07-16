# Concept — Module layer (`src/modules/`)

> Module = đơn vị tái sử dụng (DynamicModule), gọi từ [[feature-layer]] hoặc module khác. KHÔNG tự lộ endpoint.

- **Pattern 3-file cố định**: `<name>.module.ts` (`@Module` extends `ConfigurableModuleClass`) · `<name>.module-definition.ts` (`ConfigurableModuleBuilder` cho `register({ isGlobal })`) · `index.ts` (re-export public API, thiếu = vỡ alias `@modules/<name>`).
- **Service để FLAT** `*.service.ts` ngay module root — KHÔNG folder-hoá. `types/ enums/ constants/ utils/` là folder NGANG HÀNG service, mỗi cái có `index.ts`, chỉ tạo khi có nội dung. Global dùng chung nhiều module → `@modules/common`.
- **Module lớn → nested sub-module**: module cha `imports` sub-module qua `.register({...})` rồi re-export ở `exports: [...]` — consumer luôn qua module cha (vd `@modules/ai` bọc `ai/balancer/`), không import sub-path trực tiếp.
- Đăng ký ở `apps/core/src/app.module.ts` — đây là bản kê khai trung tâm, đọc file này TRƯỚC khi cần biết module nào đang bật.
- Catalog thật: `databases/ cache/ s3/ crypto/` (data) · `bussiness/` (domain, xem [[feature-layer]]) · `cqrs/ event/ bullmq/ socketio/ kafka/` (messaging) · `keycloak/ session/ membership/ throttler/ vaildators/` (auth/sec) · `ai/ langchain/ rag/ judge0/` (AI/exec) · `payos/ sepay/ stripe/ paypal/ nowpayments/` (payment) · `env/ exceptions/ logger/ winston/ sentry/ init/ filesystem/` (platform).
- Gotcha: 2 typo cố ý giữ nguyên vì đổi vỡ import khắp repo — `bussiness` (business), `vaildators` (validators).

> Nguồn: `src/modules/*` (pattern), `apps/core/src/app.module.ts` (đăng ký)
