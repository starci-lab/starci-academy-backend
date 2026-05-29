# 14 — Frontend Link

## Frontend repo
`C:\Repositories\starci-academy` (Next.js 16 + React 19 + HeroUI v3 + Tailwind v4).
- Doc pattern FE: `starci-academy/.claude/pattern/` (01-overview … 14-backend-link).
- Data layer FE: Apollo Client 4 (GraphQL), axios (REST/MinIO), SWR (cache — luôn `cache: false` ở Apollo).

## Endpoint
- GraphQL: `http://localhost:3001/graphql`
- REST: `http://localhost:3001/api/v1`
- WebSocket (socket.io): `ws://localhost:3001`

## Hợp đồng BE ↔ FE
| Khía cạnh | Backend | Frontend |
|-----------|---------|----------|
| Entity/Enum | `src/modules/databases/postgresql/primary/{entities,enums}` | `src/modules/types/{entities,enums}` (mirror) |
| Enum value | `createEnumType` (thường chữ thường) | định nghĩa lại đúng value |
| GraphQL op | `src/features/api/core/graphql/{queries,mutations}` | `src/modules/api/graphql/{queries,mutations}` |
| Input type | `XxxInput` (`graphql-types/inputs/`) | `XxxRequest` interface |
| Response | `AbstractGraphQLResponse` `{ success, message, error, data }` | `GraphQLResponse<T>`, entity ở `.data.<field>.data` |
| Auth | guard `KeycloakAuthGraphQLGuard` | Keycloak Bearer token (`createAuthApolloClient`) |

## Khi đổi hợp đồng
Sửa BE GraphQL field/input/enum hoặc entity → cập nhật FE:
1. `modules/api/graphql/<op>.ts` (query/mutation + `XxxRequest`).
2. `modules/types` (entity/enum mirror).
3. Đăng ký SWR op ở FE `SwrContext.tsx` nếu cần share state.
Chạy được khi cả 2 khớp value/field/type.

## Workspace
Mở chung 2 repo: `C:\Repositories\ac\starci-academy.code-workspace` (multi-root).
