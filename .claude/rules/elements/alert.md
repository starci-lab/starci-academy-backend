# Element — Alert

> Element doc cho `Alert` (HeroUI v3 `@heroui/react`) — banner/thông báo INLINE bền (tip · trạng thái · verdict · maintenance). Thầy chốt 2026-06-28: **dùng component GỐC, KHÔNG custom CSS, KHÔNG nhét Button × tay**.

## 1. Khi nào dùng Alert (vs toast/modal)
- **Alert = thông điệp INLINE, bền, trong luồng** (nằm trong document flow): mẹo/onboarding, trạng thái (đang xử lý), verdict (đạt/chưa), khoá, thông báo bảo trì. Hiện tới khi xong/đóng — KHÔNG tự biến mất.
- **KHÔNG dùng cho:** thông báo thoáng qua (→ `toast`, tự tắt) · việc CHẶN cần quyết định (→ Modal/AlertDialog). Ref [[verdict-banner-and-separated-finding-cards]] (verdict = Alert) · connection-lost = pill/toast (trạng thái global, không Alert inline).

## 2. Anatomy (theo example CHÍNH CHỦ HeroUI)
```tsx
<Alert status="accent">
  <Alert.Indicator />                      {/* icon mặc định theo status; custom = truyền child */}
  <Alert.Content>
    <Alert.Title>{title}</Alert.Title>
    <Alert.Description>{desc}</Alert.Description>   {/* optional — bỏ nếu 1 dòng */}
    <Button className="sm:hidden" size="sm" />        {/* action mobile: child của Content */}
  </Alert.Content>
  <Button className="hidden sm:block" size="sm" />     {/* action desktop: child trực tiếp của Alert */}
  <CloseButton onPress={onClose} aria-label="..." />  {/* dismiss: HeroUI CloseButton, child của Alert */}
</Alert>
```
- **`status`** (5 giá trị, đọc `@heroui/styles .../alert.css`): **`default` · `accent` · `success` · `warning` · `danger`**. **KHÔNG có `info`** (cả variant lẫn token `--info` đều thiếu → đừng dùng). accent = brand/tip/nhấn · success = xong · warning = chú ý · danger = lỗi · default = trung tính.
- **`Alert.Indicator`** rỗng = icon mặc định theo status (`size-4`, tự tô `text-<status>-soft-foreground`). Custom CHỈ khi có nghĩa (vd loading): `<Alert.Indicator><Spinner size="sm"/></Alert.Indicator>` — truyền **child**, KHÔNG ép size/màu.
- **`CloseButton` (HeroUI)** = nút × dismiss chuẩn, đặt làm **child trực tiếp của `<Alert>`** (sau `Alert.Content`). Wire `onPress` + `aria-label` (i18n). **CẤM tự chế `<Button isIconOnly><XIcon/>`** cho việc đóng Alert.
- **Action** = `<Button>` (vd "Refresh"/"Retry"): desktop child trực tiếp của Alert, mobile child của Content (`sm:hidden`/`hidden sm:block`) — theo example.

## 3. Da Alert = theo NGỮ CẢNH NỀN (đứng 1 mình → gốc · trong card → tint /10 + no-shadow)
`.alert` bake: `flex gap-4 bg-surface px-4 py-3 shadow-surface` + `rounded-3xl`; `.alert__description` = **`text-sm text-muted`** (đã sm sẵn); `.alert--<status>` tự tô indicator/title. → **đừng bao giờ override** `text-sm`/`text-<status>`/`ml-auto/self-start`/radius (typography + màu + layout là của component). NHƯNG **NỀN + SHADOW chọn theo nơi Alert NẰM TRÊN** (cùng họ chọn da theo nền: [[accordion-card-surface-on-standalone-pages]] · [[input-variant-by-surface-and-search-result-count]]):

| Alert nằm trên | className | vì sao |
|---|---|---|
| **page bg / đứng 1 mình** | KHÔNG override (chỉ placement `mb-*`) | `bg-surface` + `shadow-surface` mặc định = card nổi đúng trên nền trang |
| **TRONG card / surface khác** (surface-in-surface) | **`shadow-none bg-<status>/10`** | default `bg-surface` + shadow đọc thành **card-in-card** ([[surface-in-surface-inner-has-border]] / [[card-in-card-border-not-double-fill]]); tint `/10` + phẳng = 1 dải nhấn mảnh trong card, không "hộp trong hộp" |

- **className `<Alert>` chỉ được đụng:** placement (`mb-4`) + (khi nested) `shadow-none bg-<status>/10`. KHÔNG hơn.
- **Đính chính** bản 2026-06-28 trước (ghi "luôn dùng gốc, bỏ mọi override"): SAI sắc thái — `TaskLockedAlert` (`shadow-none bg-warning/10`) ĐÚNG vì nó nested trong panel. Quy tắc thật = **theo nền**: nested thì soften, standalone thì gốc.

### Impl block — `Callout` (alert TRONG card, dùng chung)
- **Alert đặt trong card/surface → dùng block `blocks/feedback/Callout`, KHÔNG ghép `Alert`+tint tay ở feature** (style ở block, feature chỉ truyền content — [[single-source-render]]). Block bake sẵn `shadow-none bg-<status>/10` + `CloseButton` màu theo status (`text-<status> hover:bg-<status>/10`).
- API: `{ status?, title, description?, icon?, action?, onClose?, closeAriaLabel?, className? }`. `icon` = child cho Indicator (vd `<CursorClickIcon className="size-5"/>`); `onClose` có → render `CloseButton` (×) wired. `className` chỉ placement.
- **Standalone trên page bg → KHÔNG dùng Callout**, dùng `Alert` thuần (da surface mặc định đúng). Callout chỉ cho ngữ cảnh nested.

## 4. Icon
- Mặc định `<Alert.Indicator/>` (icon theo status, `size-4`, tự tô `text-<status>-soft-foreground`).
- **Icon riêng** → truyền **child** vào Indicator: `<Alert.Indicator><MyIcon className="size-5"/></Alert.Indicator>` (Phosphor `*Icon` hoặc `Spinner` — KHÔNG `@gravity-ui`, KHÔNG emoji, [[elements/icon]]). Child KHÔNG có `data-slot="alert-default-icon"` nên KHÔNG tự `size-4` → set `size-5` (hoặc `size-4` cho khớp default); KHÔNG cần set màu (indicator + `.alert--<status>` đã tô qua currentColor).

## Áp đầu (2026-06-28)
- Tạo block **`blocks/feedback/Callout`** (alert-trong-card: tint `/10` + no-shadow + CloseButton màu status).
- `SelectionHintCallout` (mẹo "bôi đen để hỏi AI" — nằm TRONG reading card) → `<Callout status="accent" className="mb-4" icon={<CursorClickIcon size-5/>} title description onClose={markSeen} .../>`. Feature hết style inline. Ref [[content-ai-selection-discoverability]].

## Liên quan
- [[verdict-banner-and-separated-finding-cards]] (verdict = Alert status success/danger) · [[elements/icon]] (Phosphor) · [[elements/chip]] (chip ≠ alert) · [[no-emoji]] / [[no-uppercase-text]] (nội dung).
