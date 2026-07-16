# Concept — REST controller pattern (Express 5 + Swagger/Scalar)

> `src/features/api/core/http/` — controllers gom theo area: `admin/ github/ keycloak/ minio/ mount/ payos/ sepay/ stripe/ paypal/ nowpayments/`. `http.ts` = bootstrap gateway.

- Controller file `*.controller.ts` — KHÔNG declare type/enum/class inline, import từ `dtos/`/`types/`/`classes/`. DTO có `@ApiProperty` (Swagger) cho mỗi field.
- Validation pipe đã **global** (`APP_PIPE` ở `apps/core/src/app.module.ts`) → DTO tự validate, KHÔNG cần `@UsePipes` per-controller.
- Bootstrap order (`http.ts`): CORS → cookie parser → validation pipe → Swagger/Scalar mount → Apollo GraphQL gateway mount.
- Controller gọi xuống domain service (`@modules/bussiness`) — KHÔNG nhúng business rule (xem [[feature-layer]]).
- **Webhook (payment gateway)**: đặt ở `http/<vendor>/`, verify chữ ký theo vendor TRƯỚC khi xử lý — untrusted input, luôn verify signature + idempotency. Xem [[payment-gateways-and-webhooks]].

> Nguồn: `src/features/api/core/http/`, `src/modules/api/rest/`
