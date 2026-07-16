# INDEX — Foundations (token / nguyên liệu thô)

> Bản đồ đầy đủ của shelf `foundations/`. Foundation = quy ước ở TẦNG THẤP NHẤT (CSS var / Tailwind token /
> hành vi trình duyệt) mà mọi `components/` + `patterns/` đứng trên. Khác `components/` (canon 1 element ghép
> nhiều token lại: Button, Card, Input…) và `principles/` (luật thị giác xuyên-suốt) — foundation là NGUYÊN
> LIỆU (màu, khoảng cách, cỡ chữ, bo góc, đổ bóng, layer, breakpoint), không phải cách ghép chúng lại.
>
> **Trạng thái:** ✓ = đã có, đầy đủ (rút từ case debug thật) · **STUB** = mới viết brief (2026-07-07),
> grounded từ `globals.css`/code thật, dày thêm khi có case cụ thể · **TODO** = biết thiếu, chưa có doc.
>
> Nguồn token thật: `C:\Repositories\starci-academy\src\app\globals.css` (+ `@heroui/styles` bake mặc định
> khi `globals.css` không override — vd shadow, radius-scale, typography scale, tooltip delay).

## 1. Color
| Foundation | File | Trạng thái | Mục đích | Tokens (globals.css) |
|---|---|---|---|---|
| [[color]] | `color.md` | ✓ | Token semantic-only cho nền/chữ/viền + luật tonal/solid/color-mix | `--accent(-foreground)` · `--background` · `--surface(-secondary/-tertiary)(-foreground)` · `--default(-foreground)` · `--foreground` · `--muted` · `--success/-warning/-danger(-foreground)` · `--field-*` |

## 2. Spacing / rhythm
| Foundation | File | Trạng thái | Mục đích | Tokens |
|---|---|---|---|---|
| [[gap]] | `gap.md` | ✓ | Thang gap dọc chuẩn (`0·2·3·6·8` + ngoại lệ có tên `10`/`16`) | Không phải CSS var — quy ước Tailwind spacing scale |

## 3. Radius
| Foundation | File | Trạng thái | Mục đích | Tokens |
|---|---|---|---|---|
| [[radius]] | `radius.md` | STUB | Thang bo góc + quy tắc concentric (bo trong nhỏ hơn bo ngoài 1 nấc) | `--radius` · `--field-radius` |

## 4. Elevation (shadow)
| Foundation | File | Trạng thái | Mục đích | Tokens |
|---|---|---|---|---|
| [[elevation]] | `elevation.md` | STUB | 3 tầng shadow (surface/field/overlay) + gotcha shadow-vô-hình-ở-dark | `--surface-shadow`/`shadow-surface` · `--field-shadow`/`shadow-field` · `--overlay(-foreground)`/`--overlay-shadow` |

## 5. Typography
| Foundation | File | Trạng thái | Mục đích | Tokens |
|---|---|---|---|---|
| [[typography]] | `typography.md` | STUB | Type scale (`Typography` component) + font family + ngoại lệ modal-header | `--font-sans` (⚠️ đứt — xem ghi chú) |

## 6. Motion
| Foundation | File | Trạng thái | Mục đích | Tokens |
|---|---|---|---|---|
| [[motion]] | `motion.md` | STUB | Transition/duration convention + guard `prefers-reduced-motion` + sổ keyframe | `--tooltip-delay`/`--tooltip-close-delay` · `--skeleton-animation` · @keyframes (`wireFlow`, 9 ambient-effect, `reactionPop`, `appSplashTrickle`) |

## 7. Z-index / layering
| Foundation | File | Trạng thái | Mục đích | Tokens |
|---|---|---|---|---|
| [[z-index]] | `z-index.md` | STUB | Thang layer literal đúc từ usage thật (navbar/top-bar/overlay…) | Không có CSS var riêng — thang `z-10..z-50` + `z-[60]`/`z-[70]` |

## 8. Breakpoints / viewport
| Foundation | File | Trạng thái | Mục đích | Tokens |
|---|---|---|---|---|
| [[breakpoints]] | `breakpoints.md` | STUB | 5 mốc Tailwind default + hook JS mirror + quy ước rail=`lg+` | Tailwind `--breakpoint-sm/md/lg/xl/2xl` (không override) + `useSmViewpoint` |

## 9. Scroll & overflow behavior
| Foundation | File | Trạng thái | Mục đích | Tokens |
|---|---|---|---|---|
| [[sticky]] | `sticky.md` | ✓ | Offset chuẩn cho `position: sticky` (pin gần vị trí nghỉ) | Hành vi positioning, không phải token |
| [[scrollbar-gutter]] | `scrollbar-gutter.md` | ✓ | Chống jitter scrollbar hiện/ẩn (`html{overflow-y:scroll;scrollbar-gutter:stable}`) | `--scrollbar` (màu — chưa có doc riêng, xem ghi chú) |
| [[wide-content-scrolls-not-blocks-ui]] | `wide-content-scrolls-not-blocks-ui.md` | ✓ | Khối rộng (mermaid/table/pre) cuộn ngang, không chặn layout co lại | Hành vi overflow-x + `min-w-0`, không phải token |

## Ghi chú — token/khoảng-trống CHƯA có nhà (grounded từ `globals.css` + code thật, không suy diễn)

- **`--font-sans: var(--font-inter)` ĐỨT.** `--font-inter` không được định nghĩa ở BẤT KỲ đâu trong repo FE
  (đã grep toàn `src/`). Font thật app load là **`Open_Sans`** (`next/font/google`,
  `src/app/[locale]/layout.tsx`) expose `--font-open-sans`, gắn TRỰC TIẾP `font.className` lên `<body>` —
  KHÔNG đi qua `--font-sans`. Vì `<body>` đã set font trực tiếp, UI hiện tại KHÔNG vỡ mắt; nhưng bất kỳ chỗ
  nào dùng utility `font-sans` NGOÀI `<body>` sẽ fallback về sans hệ điều hành (SAI, âm thầm). Chi tiết ở
  [[typography]] — chưa sửa (ngoài phạm vi 1 doc foundation), flag để ai đụng lại biết mà chữa
  (`--font-sans: var(--font-open-sans)`).
- **`--focus`** (màu ring/outline focus-visible mặc định của MỌI component HeroUI — `outline-color:var(--focus)`,
  dùng khắp nơi) — chưa dòng nào trong `color.md` liệt kê nó trong bảng token §1. Gộp vào `color.md` khi
  `/merge` đụng lại file đó; không dựng foundation riêng (nó là 1 token màu, thuộc `color.md`).
- **`--segment`/`--segment-foreground`** (nền `SegmentedControl`) — component-scoped, 1 use-case hẹp, KHÔNG
  tách foundation riêng. Nằm chờ trong doc component đó khi được viết.
- **`--scrollbar`** (màu thanh cuộn) — `scrollbar-gutter.md` chỉ tả HÀNH VI (luôn hiện thanh, chừa gutter);
  màu thực của track/thumb chưa được nhắc ở đâu. TODO nhỏ, gộp vào `scrollbar-gutter.md` khi đụng lại.
- **`--heat-0..4`** (ramp heatmap data-viz, hue brand-pink) — đã có 1 doc riêng nói "trông trơn/nhạt = bug
  token, không phải redesign" (`principles/heatmap-trong-la-bug-token-khong-redesign.md`) nhưng KHÔNG có doc
  "đây là thang màu heat chuẩn". Không dựng foundation riêng ở đây (data-viz, 1 use-case hẹp) — chỉ ghi chú vị trí.
- **`--brand-*`** — `color.md` §1 nói "Brand ngoài (FB/GitHub) → token `--brand-*`" nhưng KHÔNG có token nào
  tên `--brand-*` tồn tại trong `globals.css` hiện tại (grep toàn `src/` ra 0 kết quả). Có thể bị xoá khi
  refactor hoặc chưa implement — flag để ai đụng social-brand-color biết mà TẠO/SỬA lại token, KHÔNG bịa giá
  trị hex rời rồi quên khai var.
- **Container / measure (cột đọc `max-w-3xl`)** — không có CSS var, chỉ là convention Tailwind rải trong
  `components/header.md` + `gap.md`; nhiều rule khác trỏ `[[three-tier-page-layout]]` (link chết, theo
  `README.md`). TODO-future: cân nhắc `measure.md` nếu cần 1 nhà tập trung cho quy ước bề rộng cột đọc — CHƯA
  viết (đây là layout convention, không phải 1 token `globals.css` thuần, nên để ngoài phạm vi lượt này).
- **Aspect-ratio ảnh/cover** — không thấy 1 quy ước tập trung (mỗi block tự `aspect-[...]` rời) — TODO-future,
  chưa đủ case thật để grounded thành 1 rule.

## Cách dùng
- Đụng 1 token/hành vi ở TẦNG THẤP NHẤT (màu/khoảng cách/cỡ chữ/bo góc/bóng/layer/breakpoint/scroll) mà chưa
  có rule → viết **ở đây** (`foundations/`), brief, grounded vào `globals.css`/usage thật — KHÔNG suy diễn.
- Trước khi thêm 1 STUB mới thành ✓: gom case thật ("Áp đầu") giống các file ✓ khác trong shelf này (xem
  `color.md`/`gap.md` — mỗi luật đều có ngày chốt + ví dụ áp dụng thật).
