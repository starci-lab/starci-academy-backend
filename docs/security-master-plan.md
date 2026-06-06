# Security Master Plan — StarCi Academy Backend

> Mục tiêu: CSRF + 1 session toàn tài khoản + device fingerprint + anti-AI/anti-cheat.
> Quyết định đã chốt: **scope full (Phase 0→4)**, **1 session toàn tài khoản**, **FingerprintJS open-source**.
> Ngày lập: 2026-06-01.

## 0. Thực trạng (đã verify trong code)

| Hạng mục | Trạng thái | File chính |
|---|---|---|
| Auth | Keycloak JWT (RS256) verify qua JWKS | `src/modules/keycloak/jwks.service.ts`, `guards/abstract.ts` |
| Access token | `Authorization: Bearer` (header) → **miễn nhiễm CSRF** | guards |
| Refresh token | httpOnly cookie `keycloak_refresh_token`, `sameSite: lax` | `src/modules/cookie/cookie.service.ts` |
| Session DB | KHÔNG có (JWT stateless) | — |
| CSRF | KHÔNG có | — |
| Helmet | KHÔNG có | `apps/core/src/main.ts` |
| Fingerprint/IP/UA | KHÔNG track | — |
| Anti-cheat telemetry | KHÔNG có | submission entities |
| Throttler | Có (Redis) | `src/modules/throttler/` |

**Insight cốt lõi:** access token là JWT stateless → muốn enforce single-session/kick-session, BẮT BUỘC thêm lớp server-side session check trong guard (Redis), vì JWT không revoke per-request được.

---

## Phase 0 — Hardening nền (rủi ro thấp)

**Files:**
- `apps/core/src/main.ts` — đăng ký Helmet.
- `src/modules/helmet/setup.ts` (mới) — cấu hình HSTS, X-Frame-Options=DENY, noSniff, referrerPolicy, CSP cơ bản. GraphQL playground cần nới CSP ở non-prod.
- `src/modules/cookie/cookie.service.ts` — đổi refresh cookie `sameSite: "lax"` → `"strict"` (clearCookie đã strict sẵn).

**Acceptance:** response có security headers; refresh cookie strict; app vẫn login/refresh OK.

---

## Phase 1 — CSRF (double-submit token)

Chỉ bảo vệ endpoint **đọc cookie tự động**: mutation `refreshToken`, `signOut`. (Bearer-header API không cần.)

**Files mới `src/modules/csrf/`:**
- `csrf.service.ts` — phát token random + ký HMAC (secret từ mount/env), verify double-submit.
- `csrf.guard.ts` — so khớp cookie `csrf_token` (non-httpOnly) với header `X-CSRF-Token`; thêm check Origin/Referer khớp `cors.origins`.
- `setup.ts` + `csrf.module.ts`.

**Tích hợp:**
- Khi login/exchange-code/refresh thành công → set cookie `csrf_token` (non-httpOnly, sameSite strict).
- Gắn `@UseGuards(CsrfGuard)` (hoặc check inline) vào `refresh-token.resolver.ts`, `sign-out.resolver.ts`.
- **FE (starci-academy):** đọc `csrf_token` cookie, gửi qua header `X-CSRF-Token` ở các call refresh/signOut.

**Acceptance:** request thiếu/sai `X-CSRF-Token` hoặc sai Origin → 403; flow hợp lệ OK.

---

## Phase 2 — Device Fingerprint (FingerprintJS)

**FE (starci-academy):** tích hợp `@fingerprintjs/fingerprintjs`; gửi `fingerprint` + để BE đọc UA/IP khi login & khi nộp bài.

**BE:**
- `src/modules/databases/postgresql/primary/entities/device.entity.ts` (mới): `userId`, `fingerprint`, `userAgent`, `ipAddress`, `lastSeenAt`, `trusted`. Index theo convention (dùng tên property quan hệ, KHÔNG cột RelationId ảo — xem memory feedback-index-relation-columns).
- Decorator `@ClientContext()` (mới, `src/modules/passport/decorators/`) trích IP (x-forwarded-for) + UA từ request, dùng cả REST & GraphQL.
- `guards/abstract.ts`: sau verify JWT, upsert device record (lastSeenAt).

**Acceptance:** mỗi login ghi/đối chiếu được device theo fingerprint+UA+IP.

---

## Phase 3 — 1 Session TOÀN TÀI KHOẢN

**Mô hình:** login chỗ mới → đá MỌI phiên khác. Tại 1 thời điểm chỉ 1 nơi đăng nhập.

**Cơ chế (Redis):**
- Key `session:{userId}` → `{ sessionId, fingerprint, issuedAt }` (sessionId = uuid sinh lúc login).
- Login (exchange-code & login REST): sinh sessionId mới, ghi đè Redis → phiên cũ vô hiệu về mặt logic.
- Đưa `sessionId` xuống FE (cookie `session_id` httpOnly hoặc claim) để guard đối chiếu.
- `guards/abstract.ts`: sau verify JWT → đọc `session:{userId}` từ Redis; nếu sessionId của request ≠ sessionId hiện hành → **401 SessionRevoked**.
- (Tùy chọn mạnh) gọi **Keycloak admin logout** để revoke refresh token các phiên cũ.

**Files:**
- `src/modules/session/session.service.ts` (mới, Redis) + `session.module.ts`.
- Sửa guards + exchange-code/login handlers + signOut (xoá key).
- Reuse `IoRedisInstance` đang có.

**Acceptance:** login máy B → request máy A trả 401; FE bắt 401 → logout + thông báo "đăng nhập nơi khác".

---

## Phase 4 — Anti-AI / Anti-Cheat

### 4a. Telemetry (thu bằng chứng)
- `coding-submission.entity.ts` + `user-challenge-submission.entity.ts`: thêm `ipAddress`, `userAgent`, `deviceFingerprint`.
- Coding practice (FE Monaco): `typingTelemetry` JSON — pasteCount, pasteSizeMax, keystrokeCount, tabBlurCount, timeOpenToSubmitMs.
- Truyền telemetry qua request DTO `submitCodingSolution` / `submitChallengeSubmission`.

### 4b. Detection (chấm nghi ngờ)
- Heuristic service `src/modules/bussiness/anti-cheat/` : flag khi paste cả bài / gõ nhanh bất thường / submit quá nhanh / nhiều submission trùng IP+fingerprint.
- AI-text detection cho challenge free-text: reuse pipeline AI grading thêm 1 step "khả năng do AI viết" → `aiLikelihoodScore`.
- Centralize cờ vào `job.entity.ts`: `suspicionScore`, `flaggedForReview` (cả 3 flow đều qua Job).
- Query admin: list submission flagged để review thủ công.

**Acceptance:** submission gian lận điển hình bị gắn cờ + lưu telemetry; có endpoint xem flagged.

---

## Trạng thái (cập nhật 2026-06-01)
TẤT CẢ 5 phase BE đã code xong, `nest build` (webpack) compile pass + eslint 0 lỗi cho mọi file mới/sửa. Chưa e2e (cần Keycloak + Redis + FE). DB dùng `synchronize` env-driven → dev tự tạo bảng/cột.

- ✅ Phase 0 — `src/modules/helmet/` + cookie strict
- ✅ Phase 1 — `src/modules/csrf/` (5 login phát cookie, guard trên refresh/signout)
- ✅ Phase 2 — `DeviceEntity` + `src/modules/client-context/` (@ClientContextParam) + `bussiness/device/`
- ✅ Phase 3 — `src/modules/session/` (Redis single-session) + guard `assertCurrent`
- ✅ Phase 4 — `bussiness/anti-cheat/` + telemetry columns + `CodingTelemetryInput`
- ✅ Phase 5 — `src/modules/captcha/` (Cloudflare Turnstile) + guard trên `signInInit`/`signUpInit`/`forgotPasswordInit`

### FE handoff checklist (starci-academy) — BẮT BUỘC
1. **[deploy-blocking]** Gửi header `X-CSRF-Token` (đọc từ cookie `csrf_token`) khi gọi `refreshToken` + `signOut`.
2. **[deploy-blocking]** Bắt 401 "Session has been superseded" → logout + báo "đăng nhập nơi khác".
3. Tích hợp FingerprintJS → gửi header `X-Device-Fingerprint` mọi request.
4. Monaco editor đo telemetry (pasteCount, pasteSizeMax, keystrokeCount, tabBlurCount, timeOpenToSubmitMs) → gửi qua `submitCodingSolution.request.telemetry`.
5. **[captcha]** Render Cloudflare Turnstile widget ở form sign-in/sign-up/forgot-password → gửi token qua header `X-Captcha-Token` khi gọi `signInInit`/`signUpInit`/`forgotPasswordInit`. Prod: set `CAPTCHA_ENABLED=true` + `TURNSTILE_SECRET`.

### Pending (BE, optional sau)
- AI-text detection cho challenge free-text (tái dùng AI grading pipeline) → `suspicionScore` cho challenge.
- Device-record lúc login (hiện chỉ record ở coding submit).
- Query admin xem submission `flaggedForReview`.
- Đặt `CSRF_SECRET` thật ở prod (`openssl rand -hex 32`).

## Thứ tự thực thi
`0 → 1 → 2 → 3 → 4`. Mỗi phase: code → typecheck/lint/build → (e2e nếu áp dụng) → commit riêng.

## Phối hợp FE (starci-academy)
- Phase 1: gửi `X-CSRF-Token`.
- Phase 2: tích hợp FingerprintJS, gửi fingerprint.
- Phase 3: bắt 401 SessionRevoked → logout.
- Phase 4: instrument Monaco editor telemetry.
