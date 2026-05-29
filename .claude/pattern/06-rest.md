# 06 — REST (Express 5 + Swagger/Scalar)

`src/features/api/core/http/` — REST controllers, gom theo area. `http.ts` = bootstrap (CORS → cookie → validation pipe → Swagger/Scalar → Apollo mount).

## Cấu trúc
```
http/
├─ http.ts            # bootstrap gateway
├─ admin/             # admin endpoints
├─ github/            # GitHub integration
├─ keycloak/          # auth callback / token
├─ minio/             # presigned upload / file ops (S3-compatible)
├─ mount/             # mount-file endpoints
├─ payos/  sepay/     # webhook thanh toán (xem dưới)
```

## Controller pattern
- File `*.controller.ts`. KHÔNG declare type/enum/class inline — import từ `dtos/`, `types/`, `classes/`.
- DTO request/response ở `dtos/` với `@ApiProperty` (Swagger). 1 file/feature, `index.ts` re-export.
- Validation pipe đã **global** (`APP_PIPE` ở `apps/core/src/app.module.ts`) → DTO tự validate, KHÔNG cần `@UsePipes(ValidationPipe)`.
- Response REST bọc qua helper `src/modules/api/rest/` (transform interceptor) khi cần thống nhất shape.

## Webhook (PayOS / Sepay)
- Đặt ở `http/payos/` và `http/sepay/`. Verify chữ ký theo từng vendor trước khi xử lý.
- Sau verify → grant/ghi nhận inline (vd grant AI tier) hoặc publish event/enqueue job.
- ⚠️ Webhook là untrusted input — luôn verify signature + idempotency (tránh xử lý trùng).

## Swagger / Scalar
- `@nestjs/swagger` + `@scalar/nestjs-api-reference`, mount tự động trong `http.ts`. Mọi DTO field nên có `@ApiProperty({ description })`.

## Thêm endpoint REST
1. Tạo `http/<area>/<area>.controller.ts` (+ `<area>.module.ts` nếu là area mới).
2. DTO ở `http/<area>/dtos/`.
3. Gọi xuống domain service (`@modules/bussiness`) — KHÔNG nhúng business rule trong controller.
4. Đăng ký module area vào aggregator HTTP.
