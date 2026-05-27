# 05 — Auth, Identity & Security

| Tech | Module path | Ghi chú |
|------|-------------|---------|
| **Keycloak (OIDC SSO)** | `src/modules/keycloak/` | `jwks.service`, `token.service`, `user.service`, `keycloak-oidc-redirect.service`, guards, `@Keycloak()` decorators. Login & RBAC chính. |
| **JWT (NestJS)** | `@nestjs/jwt` global (registered ở `apps/core/src/app.module.ts`) | Dùng kết hợp với Keycloak JWKS. |
| **Passport** | `src/modules/passport/` | Strategy holders. |
| **Cookie** | `src/modules/cookie/` | Cookie parser + signed cookies. |
| **CORS** | `src/modules/cors/` | Cấu hình CORS tập trung. |
| **Throttler** | `src/modules/throttler/` | Rate limit với Redis storage (`@nest-lab/throttler-storage-redis`). |
| **Crypto** | `src/modules/crypto/` | Hash, sign, encrypt helpers. |
| **OTP / Challenge code** | `src/modules/code/otp-challenge.service.ts` | OTP generation/verify (email OTP, …). |
| **Validators** | `src/modules/vaildators/` | (typo "vaildators" giữ nguyên). class-validator custom rules. |
| **Pipes (business)** | `src/modules/bussiness/pipes/` | Custom Nest pipes. |
| **Guards (business)** | `src/modules/bussiness/guards/` | Custom Nest guards (enrollment check, ownership, …). |
| **Sentry** | `src/modules/sentry/` | `@sentry/nestjs` integration, global. |

## Auth flow tóm tắt

1. Frontend redirect tới Keycloak (`keycloak-oidc-redirect.service.ts`).
2. Backend validate token qua JWKS (`jwks.service.ts`) + `token.service.ts`.
3. Guards trong `src/modules/bussiness/guards/` áp dụng cho RBAC / ownership domain-level.
4. Throttler bảo vệ rate limit ở Redis.
