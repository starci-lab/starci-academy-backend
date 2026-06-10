# StarCi Shop — Personal Project V2: Plan 20 Chapter (để thầy duyệt)

> Tái cấu trúc capstone Fullstack thành **20 chapter**: 5 BE cơ bản → 5 FE (HeroUI + widget layout) → 10 BE nâng cao xen kẽ FE. Mỗi chapter = 1 increment để lại app chạy được; chấm theo task V2 (criterion-first, task 0-100, milestone-weighted).
>
> Brand: teal **#00A898** = token HeroUI `--accent`. Widget chuẩn: nền trung tính + teal accent (đã chốt).

## A. Setup HeroUI v3 (ground-truth từ repo `starci-academy` — dạy ở Ch6)
Stack thật: `@heroui/react@3` + `@heroui/styles@3` · Next 16 (App Router) · React 19 · Tailwind v4 · next-themes. **v3 KHÔNG cần tailwind plugin** — chỉ import CSS.

**1. Cài**
```bash
npm i @heroui/react @heroui/styles next-themes
npm i -D tailwindcss @tailwindcss/postcss
```
**2. `globals.css`** (thứ tự quan trọng)
```css
@import "tailwindcss";
@import "@heroui/styles";
/* theme tokens (oklch) — :root/.light + .dark: --accent, --background, --foreground,
   --surface, --default, --danger, --success, --warning, --radius, --field-radius, --font-sans */
:root, .light { --accent: oklch(62.04% 0.1950 185.90); /* = #00A898 teal */ ... }
.dark { color-scheme: dark; --accent: oklch(62.04% 0.1950 185.90); --background: oklch(12% ...); ... }
```
**3. Provider** (`InnerLayout.tsx`, client) — bọc: `NextThemesProvider(attribute="class" defaultTheme="dark" storageKey=...)` → `HeroUIProvider` → app → `ToastProvider` (cuối).
**4. Dùng**: `import { Button, Card, Input, Modal, Tabs, addToast } from "@heroui/react"`; màu thương hiệu = class `text-accent`/`bg-accent` (KHÔNG hardcode hex trong code thật; widget mockup mới dùng #00A898).

## B. 20 Chapter
### Phase 1 — Backend cơ bản (Ch 1–5)
| Ch | Nội dung | Task nguồn |
|---|---|---|
| 1 | Khởi tạo project + `/health` 200 | M0.0 |
| 2 | Config tập trung + structured logging | M0.1, M0.2 |
| 3 | PostgreSQL + migration + `/health/db` | M0.3 |
| 4 | Auth: user entity + JWT register/login | M1.0, M1.1 |
| 5 | Auth: refresh-token rotation + RBAC guard | M1.2, M1.3 |

### Phase 2 — Frontend, chuẩn HeroUI + widget layout (Ch 6–10)
| Ch | Nội dung | Widget layout | Task nguồn |
|---|---|---|---|
| 6 | **Setup HeroUI v3** + App shell/Navbar + theme/dark | ⬛ app-shell | *(mới)* |
| 7 | **Auth UI**: login/register (HeroUI Form+Zod) | ⬛ auth | *(mới — lấp gap)* |
| 8 | Storefront: list + filter/URL + detail RSC | ⬛ storefront | M5.0–5.2 |
| 9 | Cart + Checkout (state + form) | ⬛ cart/checkout | M6.0, M6.1 |
| 10 | UI polish + a11y + i18n + perf | ⬛ polished states | M5.3, M7.0, M7.1 |

### Phase 3 — Backend nâng cao xen kẽ FE (Ch 11–20)
| Ch | Backend | FE xen kẽ |
|---|---|---|
| 11 | Catalog API + pagination + caching (M2.0–2.2) | nối product list vào API thật |
| 12 | Product image upload (M2.3) | UI upload ảnh (HeroUI) |
| 13 | Cart API per-user (M3.0) | giỏ đồng bộ server (merge guest) |
| 14 | Order creation + transaction + trừ kho (M3.1–3.2) | checkout → tạo đơn |
| 15 | Order history API (M3.3) | **Orders UI** ⬛ *(mới — lấp gap)* |
| 16 | Background jobs + email/SMS (M4.0–4.1) | trạng thái xử lý đơn |
| 17 | Realtime order status websocket (M4.2) | **Realtime UI** ⬛ *(mới — lấp gap)* |
| 18 | Observability + security E2E (M8.0–8.1) | error boundary + toast lỗi |
| 19 | Testing strategy (M8.2) | (smoke E2E luồng mua) |
| 20 | Deploy: docker + CI/CD + **VPS DO + nginx + certbot** + capstone demo (M9 + M10) | build FE + domain |

→ Lấp 4 gap FE: **App shell (6) · Auth UI (7) · Orders UI (15) · Realtime UI (17)**. Mỗi Phase-2/3 FE chapter kèm **widget layout** hướng dẫn dựng giao diện.

## C. MarkdownContent — render widget trong content
`MarkdownContent` hiện dùng react-markdown + remark-directive (đã có `:::muted`). Thêm cơ chế nhúng widget layout:
- **Phương án**: fence ` ```layout ` (hoặc directive `:::layout`) chứa HTML → render trong **iframe sandbox** (an toàn, cô lập CSS) hoặc sanitize-HTML; brand teal qua `--accent`.
- Tái dùng pattern `MermaidDiagram` (đã có map cho ```mermaid → component) → thêm nhánh ```layout → `<LayoutWidget html=...>`.
- An toàn: sandbox iframe `sandbox="allow-same-origin"`, không script học viên; chỉ render HTML/CSS layout mockup.

## D. Cần thầy duyệt
1. **Khung 20 chapter trên** (5/5/10, 4 gap FE bổ sung) — ổn chưa?
2. **"Chapter" map vào gì**: mỗi chapter = 1 milestone mới (20 milestone), hay giữ 11 milestone + chapter là cách trình bày trong roadmap?
3. **MarkdownContent**: dùng **iframe sandbox** (cô lập, an toàn nhất) cho widget — OK chứ?
4. Em vẽ trước **5 widget layout** (app-shell/auth/storefront/cart-checkout/orders) để thầy duyệt giao diện rồi mới viết content chapter?

Ref HeroUI: [v3 quick-start](https://heroui.com/docs/quick-start) · [theming](https://heroui.com/docs/react/getting-started/theming) · [next-app-template](https://github.com/heroui-inc/next-app-template)
