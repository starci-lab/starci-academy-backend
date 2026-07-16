# Concept — Auth: Keycloak + session

> `src/modules/keycloak/` (OIDC SSO, login & RBAC chính) + `src/modules/session/` (device session) + `src/modules/membership/` (gói thành viên) hợp thành lớp auth.

- Keycloak: `jwks.service.ts` (verify JWT qua JWKS) + `token.service.ts` + `user.service.ts` + `keycloak-oidc-redirect.service.ts` (redirect flow) + `guards/` (`KeycloakAuthGraphQLGuard` dùng ở resolver, xem [[graphql-resolver-pattern]]) + `@Keycloak()` decorators.
- Auth flow: FE redirect tới Keycloak → BE validate token qua JWKS → domain guard (`bussiness/guards/`, vd enrollment/ownership check) áp ở feature layer qua `@UseGuards(...)`.
- **Session** (`src/modules/session/`) — quản device session (multi-device login), giới hạn số thiết bị đồng thời; tách khỏi Keycloak token validation.
- **Membership** (`src/modules/membership/`) — gói thành viên/subscription state, dùng entitlement riêng với AI quota (xem [[ai-catalog-balancer-entitlement]] — 2 khái niệm quota khác nhau, đừng nhầm).
- Hạ tầng phụ trợ: `passport/` (strategy holder), `cookie/` (signed cookie), `cors/`, `throttler/` (rate-limit qua Redis storage), `crypto/` (hash/sign/encrypt), `code/otp-challenge.service.ts` (OTP email) — `captcha/`, `csrf/`, `totp/`, `helmet/` là các module bảo mật bổ sung (chưa tài liệu hoá chi tiết, xem source trực tiếp khi cần).

> Nguồn: `src/modules/keycloak/`, `src/modules/session/`, `src/modules/membership/`
