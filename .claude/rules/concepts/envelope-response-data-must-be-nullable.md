# Concept — Field `data` của MỌI GraphQL envelope response PHẢI `nullable: true`

> Heuristic engineering (họ `concepts/*`, BE GraphQL). Cùng họ "lỗi BE bị che" với [[opaque-global-id-must-decode-before-raw-id-mutation]] + [[fe-swr-gate-must-match-be-enroll-guard]].

## Root cause
`GraphQLTransformInterceptor` (`apollo/server/interceptors/graphql-transform.interceptor.ts`):
- **Success:** `map(data => ({ data, message, success: true }))` — `data` = giá trị resolver trả.
- **Error (`catchError`):** `observer.next({ success: false, message, error })` — **KHÔNG set `data`** → `data = null`.
→ Nếu response type khai `@Field(() => X) data: X` (NON-nullable), nhánh error (data null) **vi phạm non-null** → GraphQL ném *"Cannot return null for non-nullable field …Response.data"*, **đè lên** lỗi thật (`err.message`). FE không bao giờ thấy nguyên nhân thật.

## Luật (STRICT)
- **MỌI envelope response (`extends AbstractGraphQLResponse`) PHẢI khai `data` `nullable: true`** — `@Field(() => X, { nullable: true }) data: X | null`. Interceptor error-path luôn trả `data=null` → non-nullable = crash + che lỗi thật. Convention đúng đã có ở `globalLeaderboard`/`blogPost`/`blogPosts`.
- **Khi thấy *"Cannot return null for non-nullable field `<X>`Response.data"*** → KHÔNG phải lỗi data thật → response type quên `nullable: true` + có 1 lỗi BÊN DƯỚI đang bị che. **Fix nullability TRƯỚC** để lỗi thật nổi lên, rồi mới chẩn lỗi gốc (DB/migration/validation…).
- **Quét footgun:** grep response types `extends AbstractGraphQLResponse` mà field `data` thiếu `nullable: true` → sửa loạt (mọi mutation có thể throw đều dính).

## Liên quan
- [[opaque-global-id-must-decode-before-raw-id-mutation]] · [[fe-swr-gate-must-match-be-enroll-guard]] (cùng họ "lỗi BE bị che, contract FE↔BE") · [[ai-structured-output-must-match-consumer-shape]] (shape BE che lỗi runtime).
