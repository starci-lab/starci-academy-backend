# 12 — API Surface (REST + GraphQL)

| Tech | Path | Ghi chú |
|------|------|---------|
| **REST controllers** | `src/features/api/core/http/` | Subdirs: `admin/`, `github/`, `keycloak/`, `minio/`, `mount/`, `payos/`, `sepay/`. `http.ts` = bootstrap. |
| **GraphQL (Apollo)** | `src/features/api/core/graphql/` | `queries/`, `mutations/`. Apollo Server 5 + Express 5. |
| **Apollo client** | `src/modules/api/apollo/` | Client-side helper (introspection, federation, …). |
| **REST helpers** | `src/modules/api/rest/` | Common REST utilities. |
| **Swagger / Scalar** | `@nestjs/swagger` + `@scalar/nestjs-api-reference` | Doc UI tự bật trong `http.ts`. |
| **Docs module** | `src/modules/docs/` | Doc-related helpers. |

## Bootstrap order

`features/api/core/http/http.ts` chịu trách nhiệm:
1. Enable CORS (qua `modules/cors/`).
2. Cookie parser (qua `modules/cookie/`).
3. Validation pipe (declared global trong `apps/core/src/app.module.ts` qua `APP_PIPE`).
4. Swagger / Scalar mount.
5. Apollo GraphQL gateway mount.

## Khi thêm endpoint

| Loại | Vị trí |
|------|--------|
| REST controller | `src/features/api/core/http/<area>/` |
| GraphQL query | `src/features/api/core/graphql/queries/<name>/` |
| GraphQL mutation | `src/features/api/core/graphql/mutations/<name>/` |
| Webhook | `src/features/api/core/http/<vendor>/` |
