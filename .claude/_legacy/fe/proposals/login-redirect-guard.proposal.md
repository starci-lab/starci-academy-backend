# Proposal — `/login` page + auth-guard redirect (chưa auth vào dashboard/learn → /login)

> Chốt 2026-07-11 (prototype `scratchpad/login-redirect-flow/index.html`, :8081, 8 màn, ephemeral). Quyết định: tạo route `/login` MỚI làm đích redirect (thay vì tiếp tục bounce về `/home`); **giữ song song** `AuthenticationModal` cho các entry-point khác (navbar) — không thay thế.

## Bối cảnh hiện có (đã khảo sát, KHÔNG bịa)
- Guard đã tồn tại ở [`src/proxy.ts`](../../../src/proxy.ts) (Next 16 `proxy` convention) — `PROTECTED_PATTERNS` gồm `/dashboard`, `/admin`, `/checkout`, `/profile` (owner surfaces), `/courses/:id/learn`. Hiện tại logged-out trên path này → redirect `/{locale}/home`. Cần đổi đích sang `/{locale}/login`.
- Auth hiện là **modal** (`src/components/modals/AuthenticationModal/`), KHÔNG có route riêng. `SignInSection`/`SignUpSection` (+ `CredentialsState`/`OtpState` con) dùng `Modal.Header`/`Modal.Body` (chỉ là div thường, không cần Modal context) nhưng render `<Modal.CloseTrigger />` (phụ thuộc react-aria Dialog context) — phải tách phần này ra khỏi 2 component con để tái dùng ngoài modal.
- State máy sign-in/sign-up nằm ở Redux `state.state.signInState`/`signUpState` (Credentials/OTP) + `tabs.authenticationModalTab` — dùng CHUNG được cho cả modal lẫn page (singleton flow, không có 2 nơi cùng lúc).
- OAuth: `CredentialsState.onOauthPress` set `SessionStorage[oauth_idp_hint]` rồi redirect Keycloak với `redirect_uri=window.location.href`; callback landing pages `src/app/[locale]/authentication/{google,github}/login/page.tsx` → `OauthRedirect` (chờ ~1s rồi về locale home); token exchange thật ở `useExchangeCodeForToken` (đọc `?code&state`, gọi mutation, lưu Redux+localStorage+cookie).

## Flow (đã duyệt qua prototype)
1. **Trigger** — khách chưa auth vào `/dashboard` (hoặc bất kỳ protected pattern) → edge (`proxy.ts`) redirect 307 tới `/{locale}/login?redirect=<original-path+search>` TRƯỚC khi HTML protected render.
2. **`/login` — Sign-in tab (mặc định)** — shell `centered-form-setup` (`max-w-2xl`, không rail/navbar chrome). Banner ngữ cảnh khi có `redirect` param ("Đăng nhập để tiếp tục tới Dashboard" — tâm lý trấn an, không phải bị chặn). Card: OAuth row → separator → EmailField/PasswordField → RememberMeRow → CTA primary "Đăng nhập" → prompt chuyển Đăng ký.
3. **Sign-up tab** — cùng card, đổi nội dung (không đổi route) — mirror Sign-in.
4. **OTP step** — sau submit credentials, step 2 trong CÙNG card (Redux `signInState=OTP`): 6-ô mã, resend, back.
5. **Submitting/Error state** — field disabled + spinner trong CTA khi submit; lỗi = banner + inline field error (KHÔNG đổi layout, không toast).
6. **Success → redirecting (transient ~1s)** — card đổi hẳn nội dung (giống `centered-form-setup` §3 SubmitSuccess, không toast) → tự điều hướng tới `redirect` target hoặc `/dashboard` mặc định.
7. **Đích quay lại** — landing đúng route ban đầu (vd `/dashboard`), xác nhận `redirect` param giữ xuyên suốt.
8. **Đã auth mà gõ thẳng `/login`** — edge redirect ngay về `/dashboard`, không bao giờ render form (mirror rule "authed ở marketing root" đã có trong `proxy.ts`).

## Zones / element-aware block briefs
- Logo/mono avatar (top) — click → `/home` (phễu, không ngõ cụt).
- `OauthButtons` (đã có, `CredentialsState/OauthButtons`) — tái dùng nguyên.
- `EmailField`/`PasswordField`/`RememberMeRow` — tái dùng nguyên.
- Tab switch (Sign in / Sign up) — dùng lại pattern `Separator`/`Button` hiện có trong `AuthenticationModal`, không cần block mới; chỉ đổi nguồn state (vẫn Redux `authenticationModalTab`).
- `Button` primary `fullWidth size="lg"` cho submit — theo `centered-form-setup` §2.
- Empty/gate: N/A cho trang này (không có state rỗng ngoài lỗi form).

## Files to touch (cho `starci-fe-layout-apply`)
1. **NEW** `src/app/[locale]/login/page.tsx` — route mới, render `LoginPage`.
2. **NEW** `src/components/features/auth/LoginPage/index.tsx` (hoặc tên tương đương) — compose shell `centered-form-setup`: logo + banner (đọc `redirect` searchParam) + card bọc tab switch + `SignInSection`/`SignUpSection`.
3. **EDIT** `src/components/modals/AuthenticationModal/SignInSection/CredentialsState/index.tsx` + `OtpState/index.tsx`, và 2 file tương ứng trong `SignUpSection/` — tách `<Modal.CloseTrigger />` ra khỏi nội dung dùng chung (ví dụ nhận 1 prop `chrome?: "modal" | "page"` hoặc để component cha bọc chrome, con chỉ render Header/Body). Đảm bảo modal cũ KHÔNG đổi hành vi.
4. **EDIT** `src/proxy.ts` —
   - Đổi đích redirect (2) từ `/${locale}/home` → `/${locale}/login?redirect=<encodeURIComponent(original path+search)>`.
   - Thêm rule mới: authed + path (sau strip locale) === `/login` → redirect `/${locale}/dashboard` (mirror rule 1).
5. **EDIT** OAuth success path — `CredentialsState.onOauthPress` (2 file, Sign in + Sign up) cần lưu thêm `redirect` target vào `SessionStorage` (song song `oauth_idp_hint`) TRƯỚC khi redirect Keycloak (vì query param không sống sót qua round-trip IdP theo cách đáng tin cậy).
6. **EDIT** `src/hooks/effects/useExchangeCodeForToken.ts` (hoặc nơi tương đương xử lý callback thành công) + credentials/OTP success handler — đọc `redirect` target (SessionStorage cho OAuth, searchParam cho credentials/OTP) → `router.push(target ?? pathConfig().locale(locale).dashboard())`, rồi xoá key khỏi SessionStorage sau khi dùng.
7. Có thể cần: `src/resources/path/index.ts` — thêm `pathConfig().locale(locale).login()` builder nếu path đang build thủ công ở nhiều nơi.

## Verify plan
- tsc/eslint sạch.
- Browser: vào `/dashboard` khi logout → xác nhận redirect `/login?redirect=/dashboard`; đăng nhập (credentials + OTP) → xác nhận quay lại đúng `/dashboard`; thử OAuth (Google/GitHub) → xác nhận vẫn quay lại đúng `redirect` target sau round-trip; gõ thẳng `/login` khi đã auth → xác nhận bounce về `/dashboard` không flash form; modal cũ ở navbar vẫn hoạt động bình thường (không regress).

## Prototype
`scratchpad/login-redirect-flow/index.html` (:8081, 8 màn, ephemeral — chưa lưu vào `fe/prototypes/`).
