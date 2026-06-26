# Draft — Field `data` của MỌI GraphQL envelope response PHẢI `nullable: true` (interceptor error-path bỏ data → null) (2026-06-25)

- File/§ đích khi `/merge`: `main.md` (GraphQL/resolver conventions) + `starci-be` cannon. Liên quan [[opaque-global-id-must-decode-before-raw-id-mutation]] (cùng họ "lỗi BE bị che").
- Bối cảnh: "Ghim dự án" (`pinExternalProject`) → FE toast *"Cannot return null for non-nullable field PinExternalProjectResponse.data."* — không phải lỗi nghiệp vụ, là lỗi schema nullability che mất lỗi thật.

## Root cause
`GraphQLTransformInterceptor` (`apollo/server/interceptors/graphql-transform.interceptor.ts`):
- **Success:** `map(data => ({ data, message, success: true }))` → `data` = giá trị resolver trả.
- **Error (`catchError`):** `observer.next({ success: false, message, error })` — **KHÔNG set `data`** → `data = undefined/null`.
→ Nếu response type khai `@Field(() => X) data: X` (NON-nullable), thì nhánh error (data null) **vi phạm non-null** → GraphQL ném *"Cannot return null for non-nullable field …data"*, **đè lên** lỗi thật (`err.message`). FE không bao giờ thấy nguyên nhân thật.

## Luật (STRICT)
- **MỌI envelope response (`extends AbstractGraphQLResponse`) PHẢI khai `data` `nullable: true`** (`@Field(() => X, { nullable: true }) data: X | null`). Vì interceptor error-path luôn trả data=null → non-nullable = crash + che lỗi. Convention đúng đã có sẵn ở `globalLeaderboard`/`blogPost`/`blogPosts` (data nullable). KHÔNG để response nào non-nullable data.
- **Khi thấy *"Cannot return null for non-nullable field <X>Response.data"*** → KHÔNG phải lỗi data thật → đó là response type quên `nullable: true` + có 1 lỗi BÊN DƯỚI đang bị che. Fix nullability TRƯỚC để lỗi thật nổi lên, rồi mới chẩn lỗi gốc (DB/migration/validation…).
- **Quét footgun:** grep response types `extends AbstractGraphQLResponse` mà field `data` thiếu `nullable: true` → sửa loạt (mọi mutation có thể throw đều dính).

## ĐÃ ÁP DỤNG 2026-06-25
- `PinExternalProjectResponse.data` + `PinCourseProjectResponse.data`: `@Field(() => ID)` → `@Field(() => ID, { nullable: true })` + `data: string | null`. tsc BE sạch. **Cần restart backend** (đổi schema).
- **Còn lại:** sau restart, nếu pin vẫn lỗi → toast hiện lỗi thật (nghi table `user_pinned_projects`/enum `project_pin_type` chưa migrate local). Chưa quét toàn bộ response types non-nullable data khác (nên làm 1 pass).
