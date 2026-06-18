---
name: ui-apply
description: >
  Fix the UI / visual layer of a page in the MAIN StarCi Academy web app (`C:\Repositories\starci-academy`)
  — styling, tokens, spacing, component look, hierarchy polish — per the /fe design system, WITHOUT
  changing the UX structure. The "skin" pass (radius/border/color/spacing/typography/icons/states look),
  done in blocks + globals only (features stay style-free). Trigger when the user types `/ui-apply <page>`.
---

# /ui-apply — Polish the UI (skin) of a page

Sửa "da" (style / token / spacing / look) theo design system, **KHÔNG đổi cấu trúc UX** (đó là `/ux-apply`).
Style chỉ sống ở **block / globals** — feature không style.

## Trước khi làm
- Áp **`/fe`** (đọc `main.md` + `starci-<element>.md` + `drafts/*`). Đọc file element của thứ đang sửa (button/card/chip/…).

## Làm (CHỈ visual)
- **Token semantic** (CẤM hex/`slate-*`); **spacing `0/2/3/4/6`** (CẤM `1.5`); **padding card `px-4 py-3`**; radius concentric `2xl→xl→full`; flat (shadow chỉ overlay).
- **Text = `Typography`** (size/weight/color/align qua PROP); **icon** common = phosphor `*Icon`, brand = `react-icons/fa6`; entity icon → block **`IconTile`**.
- **Card = `LabeledCard`**; **chip = soft no-border**; text-action = **`Link`**; Tabs = **`ExtendedTabs`**; mọi fetch render qua **`AsyncContent`** (skeleton mirror).
- **Style LỆCH tầng** (bg/border/rounded/text-size/p-* trong feature) → đẩy vào **block** hoặc **globals BEM**; feature className = chỉ PLACEMENT.
- Container HeroUI tự pad → KHÔNG bọc thêm `p-*` (double padding). Hạn chế border → tint/spacing.
- **"Vẫn vậy"?** đổi token/card/typography (cái "da"), ĐỪNG churn cấu trúc — cấu trúc là việc của `/ux-apply`.

## Sau khi làm
- `npx tsc --noEmit` + `npm run lint` sạch (baseline 4 lỗi blog WIP). Verify bằng mắt (chạy → chụp → soi → sửa).
- **Thầy feedback → tự ghi `.claude/rules/drafts/<temp>.md`** (rút nguyên tắc tổng quát + nguyên nhân gốc), KHÔNG sửa main/element trực tiếp. Gộp khi thầy gõ `/merge`.
