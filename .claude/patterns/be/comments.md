# Comment — ghi LÚC NÀO (WHY, không WHAT)

Nguồn: quét `src/` thật (2026-07-16). Codebase này comment DÀY hơn trung bình — nhưng toàn
WHY (ràng buộc nghiệp vụ, workaround, quyết định không hiển nhiên), gần như 0 comment WHAT
và 0 code comment-out. Giữ đúng tỷ lệ đó. `tsconfig` có `removeComments: true` — comment
không ship vào dist, đừng tiếc chữ khi có lý do thật. Ngôn ngữ comment/JSDoc: **tiếng Anh**.

## 1. WHY, không WHAT — comment trả lời "vì sao code phải thế này"

Comment inline `//` đặt NGAY trên dòng liên quan, giải thích ràng buộc mà code không tự nói:

```ts
// ✅ mẫu thật abstract-exception-http.filter.ts — workaround + hậu quả nếu phá
// GraphQL operations ride on the same HTTP req/res under the hood, but
// must be left to Apollo's own formatError — do not touch the response here
if (host.getType<string>() === "graphql") {
    throw exception
}

// ✅ mẫu thật review-flashcard request.ts — lý do validate nằm ở ĐÂY chứ không chỗ khác
// reject out-of-range grades before they reach the SM-2 math
@IsInt()
@Min(0)
@Max(3)
    grade: number

// ❌ SAI — nhại lại code, zero thông tin
// get the response from context
const response = ctx.getResponse<Response>()
// loop through cards
for (const card of cards) ...
```

Quyết định nghiệp vụ nhiều nhánh → block comment kể đủ ngữ cảnh (mẫu thật `listDue` trong
`flashcard-review.service.ts`: 6 dòng giải thích vì sao COURSE page key theo enrollment
còn DASHBOARD key theo user_id — người sửa sau không comment này SẼ "sửa cho đồng nhất" và phá).

## 2. KHÔNG comment tên đã rõ — XOÁ comment thừa & code comment-out

- Method/biến đặt tên tốt là tự-doc: `sleepEnqueueUxDelay()`, `isPlainObject()` không cần
  `// sleep for ux delay` bên trên.
- Code comment-out = XOÁ, git giữ lịch sử. `src/` hiện sạch — đừng là người đầu tiên để lại xác.
- Comment "section divider" (`// ==== helpers ====`) không phải khuôn nhà — file dài quá thì
  tách file theo [[modules-and-di]], không kẻ vạch.

## 3. JSDoc — cho surface public + hằng số/field có "nghĩa ngầm"

Khuôn đầy đủ (class/method/interface public bắt buộc JSDoc) xem [[format-and-imports]].
Riêng về LÚC NÀO đáng viết:

- **Hằng số mang quyết định nghiệp vụ** — JSDoc kể lý do + sự cố nó chống:

```ts
// ✅ mẫu thật flashcard-review.service.ts
/**
 * Max NEW (never-reviewed) cards offered per "due today" batch. Caps the
 * headline so a fresh viewer sees a manageable batch (overdue reviews + this
 * many new) instead of the entire never-reviewed backlog (the "449" bug). The
 * batch refills as new cards get reviewed and leave the new pool.
 */
const DAILY_NEW_LIMIT = 20
```

- **DTO/interface field khi ý nghĩa không hiển nhiên** — nói hệ quả của có/không giá trị,
  không nhại tên field:

```ts
// ✅ mẫu thật — sessionId nói rõ vì sao tồn tại + hành vi khi omit
description: "The review session this grade belongs to, so the event is attributed
to the session for per-session stats. Omit for an untracked grade.",

// ❌ SAI — nhại tên, vô dụng
/** The session id. */
sessionId?: string | null
```

- **Enum member** — mỗi member 1 dòng JSDoc nói HỆ QUẢ (xem `AiErrorKind`,
  ví dụ đầy đủ trong [[type-safety]] mục 3).
- Field tự-hiển-nhiên trong interface nội bộ vẫn được JSDoc 1 dòng ngắn (`/** The card id. */`)
  cho đều bộ — nhưng đừng phồng nó thành 3 dòng nói lại tên.

## 4. TODO/FIXME — kèm tag + ngữ cảnh đủ để người lạ làm tiếp

Khuôn nhà: `TODO(tag): hành động cụ thể + điều kiện/đường dẫn liên quan`. Không bao giờ
`// TODO fix later` trống nghĩa.

```ts
// ✅ mẫu thật paypal.client.ts — nói rõ cần gì để gỡ
 * TODO(real-keys): set `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / ...

// ✅ mẫu thật enqueue-generate-cv.service.ts — chỉ đích danh chỗ swap
// TODO(wire): swap the literal for ...

// ✅ mẫu thật start-mock-interview-session-draw.service.ts — ghi nhận limitation có chủ đích
 *   TODO: a deck can reference multiple modules; this takes the FIRST

// ❌ SAI
// TODO: fix this
// FIXME ???
```

TODO là NỢ CÓ CHỦ — viết xong phải trả lời được "ai đọc dòng này 3 tháng sau có làm tiếp
được không". Không thì đừng để TODO, hoặc làm luôn, hoặc mở proposal/backlog.

## 5. Comment SỐNG cùng code — đổi code thì đổi comment

Comment sai còn tệ hơn không có (người sau TIN nó thay vì đọc code). Sửa hành vi mà comment/
JSDoc bên trên còn tả hành vi cũ = diff CHƯA XONG. Đặc biệt các block WHY dài (kiểu `listDue`
enrollment-vs-user_id) — chính vì nó thuyết phục nên nó lỗi thời là nguy hiểm nhất.
Checklist trước khi kết thúc 1 edit: đọc lại JSDoc của method vừa sửa + comment trong vùng diff.
