---
name: ux-apply
description: >
  Implement the redesigned UX for a page in the MAIN StarCi Academy web app per the brainstorm from
  /ux-brainstorm (its `<Feature>/UX-BRAINSTORM.md` / the agreed direction). Restructures information
  architecture, sections, flows, and states using the blocks/features architecture and the /fe rules —
  the structural "what goes where & why", NOT pixel polish (that is /ui-apply). Verifies tsc/eslint +
  visually. Trigger when the user types `/ux-apply <page>`.
---

# /ux-apply — Build the redesigned UX (structure)

Dựng UX đã brainstorm. Tầng CẤU TRÚC (IA / section / flow / state) — KHÔNG đánh bóng pixel (đó là `/ui-apply`).

## Trước khi làm
- Đọc **`<Feature>/UX-BRAINSTORM.md`** (hướng đã chốt) + áp **`/fe`** (đọc `main.md` + `starci-<element>.md` + `drafts/*`).
- Chưa có brainstorm → chạy **`/ux-brainstorm`** trước. ĐỪNG tự chế hướng.

## Làm
- Dựng theo IA đã chốt: đúng section / thứ tự / **1 primary action**; lắp bằng **block + HeroUI**, **feature chỉ GHÉP** (không style).
- Mọi fetch → **`AsyncContent`** (loading=skeleton mirror · empty=tự ẩn/CTA · error=retry). Tab → URL state nếu cần share.
- Dùng đúng field BE/DB đã map trong brainstorm; cần field BE mới → **nêu rõ, đừng fake** dữ liệu.
- 1 component = 1 folder `index.tsx` (tên folder = tên component); sub nest trong cha; props discipline (container tự đọc store/SWR).
- KHÔNG đụng trang/tab thầy đã ưng trừ khi brainstorm yêu cầu. Xoá dead code lộ ra (đã confirm không ai import).

## Sau khi làm
- `npx tsc --noEmit` + `npm run lint` sạch (baseline 4 lỗi blog WIP). Verify bằng mắt (chạy → chụp → soi → sửa).
- **Thầy feedback → tự ghi `.claude/rules/drafts/<temp>.md`** (rút nguyên tắc tổng quát + nguyên nhân gốc), KHÔNG sửa main/element trực tiếp. Gộp khi thầy gõ `/merge`.
