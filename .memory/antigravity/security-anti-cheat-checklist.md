# Nhật ký thay đổi (Security & Anti-Cheat Frontend Handoff Checklist)

Dưới đây là tổng hợp các công việc đã thực hiện để hoàn thành spec bảo mật và chống gian lận (Phases 1-5) cùng các file bị ảnh hưởng trong workspace `starci-academy`.

## Các công việc đã thực hiện

### 1. Phase 1: CSRF Protection
- Tạo Apollo Link `attach-csrf-token` để lấy token `csrf_token` từ cookie và đính kèm vào header `x-csrf-token` cho các mutation chạy qua cookie (refreshToken, signOut).
- Đăng ký CSRF Link vào các Apollo client cần thiết.

### 2. Phase 2: Concurrent Session Eviction (Đăng nhập thiết bị khác)
- Chặn lỗi `401 superseded` từ GraphQL response.
- Lưu flag `superseded_toast: "true"` vào `sessionStorage` và ép trình duyệt chuyển hướng (hard redirect) về `/`.
- Tạo hook toàn cục `useSessionSuperseded` để kiểm tra flag này, hiển thị Toast cảnh báo tiếng Việt: *"Phiên đăng nhập đã hết hạn do tài khoản được đăng nhập ở thiết bị khác."* (hoặc bản dịch tiếng Anh tương ứng), sau đó xóa flag.

### 3. Phase 3: Thiết lập Device Fingerprint
- Cài đặt `@fingerprintjs/fingerprintjs`.
- Tạo logic khởi tạo, cache visitor ID, tự động đính kèm header `x-device-fingerprint` cho các request REST (Axios) và GraphQL (Apollo Link).

### 4. Phase 4: Monaco Editor Behavioral Telemetry
- Lắng nghe các sự kiện thao tác trên Monaco Editor tại trang làm bài tập (pasteCount, pasteSizeMax, keystrokeCount, tabBlurCount, timeOpenToSubmitMs).
- Đính kèm dữ liệu telemetry này vào mutation submit bài giải code.

### 5. Phase 5: Cloudflare Turnstile Captcha
- Tạo component tái sử dụng `<Turnstile />`.
- Đưa Turnstile siteKey vào cấu hình `publicEnv`.
- Lưu trữ token captcha trong store Zustand và truyền qua header `x-captcha-token` trong giai đoạn khởi tạo đăng nhập (signInInit) và đăng ký (signUpInit).
- Disable nút submit nếu form bật Captcha nhưng chưa xác thực xong.

### 6. Sửa lỗi TypeScript & Refactor GraphQLHeaders
- Sửa lỗi mapping bị thiếu trường `otp` trong `useSignInForm.ts`.
- Đổi kiểu dữ liệu `GraphQLHeaders` trong `types.ts` để sử dụng enum `GraphQLHeadersKey` làm key và hỗ trợ giá trị `string | undefined`.
- Cập nhật định nghĩa headers ở `auth.ts`, `no-auth.ts`, `http.ts` và tự động lọc bỏ các header có giá trị `undefined` trước khi gửi đi.
- Bỏ các từ khóa ép kiểu `as string` thừa tại `useQueryContentSwr.ts` và `useQueryModuleSwr.ts`.
- Đã xác thực bằng lệnh `npx tsc --noEmit` đạt 0 lỗi biên dịch.

---

## Danh sách các file bị ảnh hưởng (Affected Files)

### Thêm mới (New Files)
- [attach-csrf-token.ts](file:///c:/Repositories/starci-academy/src/modules/api/graphql/clients/links/attach-csrf-token.ts)
- [useSessionSuperseded.ts](file:///c:/Repositories/starci-academy/src/hooks/effects/useSessionSuperseded.ts)
- [fingerprint.ts](file:///c:/Repositories/starci-academy/src/modules/api/fingerprint.ts)
- [attach-device-fingerprint.ts](file:///c:/Repositories/starci-academy/src/modules/api/graphql/clients/links/attach-device-fingerprint.ts)
- [useInitializeFingerprint.ts](file:///c:/Repositories/starci-academy/src/hooks/effects/useInitializeFingerprint.ts)
- [Turnstile](file:///c:/Repositories/starci-academy/src/components/reuseable/Turnstile/index.tsx)

### Chỉnh sửa (Modified Files)
- [auth.ts](file:///c:/Repositories/starci-academy/src/modules/api/graphql/clients/clients/auth.ts)
- [no-auth.ts](file:///c:/Repositories/starci-academy/src/modules/api/graphql/clients/clients/no-auth.ts)
- [client.ts](file:///c:/Repositories/starci-academy/src/modules/api/graphql/clients/clients/refresh-token/client.ts)
- [http.ts](file:///c:/Repositories/starci-academy/src/modules/api/graphql/clients/links/http.ts)
- [error.ts](file:///c:/Repositories/starci-academy/src/modules/api/graphql/error.ts)
- [UseEffects.tsx](file:///c:/Repositories/starci-academy/src/components/layouts/UseEffects.tsx)
- [PracticeProblem/index.tsx](file:///c:/Repositories/starci-academy/src/components/layouts/Practice/PracticeProblem/index.tsx)
- [mutation-submit-coding-solution.ts](file:///c:/Repositories/starci-academy/src/modules/api/graphql/mutations/mutation-submit-coding-solution.ts)
- [public.ts](file:///c:/Repositories/starci-academy/src/resources/env/public.ts)
- [store.ts (signIn)](file:///c:/Repositories/starci-academy/src/hooks/zustand/signIn/store.ts)
- [store.ts (signUp)](file:///c:/Repositories/starci-academy/src/hooks/zustand/signUp/store.ts)
- [useSignInForm.ts](file:///c:/Repositories/starci-academy/src/hooks/zustand/signIn/useSignInForm.ts)
- [useSignUpForm.ts](file:///c:/Repositories/starci-academy/src/hooks/zustand/signUp/useSignUpForm.ts)
- [CredentialsState/index.tsx](file:///c:/Repositories/starci-academy/src/components/modals/AuthenticationModal/SignInSection/CredentialsState/index.tsx)
- [RegistrationState/index.tsx](file:///c:/Repositories/starci-academy/src/components/modals/AuthenticationModal/RegistrationSection/RegistrationState/index.tsx)
- [types.ts](file:///c:/Repositories/starci-academy/src/modules/api/graphql/types.ts)
- [useQueryContentSwr.ts](file:///c:/Repositories/starci-academy/src/hooks/swr/api/graphql/queries/useQueryContentSwr.ts)
- [useQueryModuleSwr.ts](file:///c:/Repositories/starci-academy/src/hooks/swr/api/graphql/queries/useQueryModuleSwr.ts)
