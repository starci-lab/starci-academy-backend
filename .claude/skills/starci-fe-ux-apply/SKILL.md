---
name: starci-fe-ux-apply
description: >
  Implement the redesigned UX for a page in the MAIN StarCi Academy web app per the brainstorm from
  /starci-fe-ux-brainstorm (its `<Feature>/UX-BRAINSTORM.md` / the agreed direction). Restructures information
  architecture, sections, flows, and states using the blocks/features architecture and the /fe rules —
  the structural "what goes where & why", NOT pixel polish (that is /ui-apply). Verifies tsc/eslint +
  visually. Trigger when the user types `/starci-fe-ux-apply <page>`.
---

# /starci-fe-ux-apply — Build the redesigned UX (structure)

Dựng UX đã brainstorm. Tầng CẤU TRÚC (IA / section / flow / state) — KHÔNG đánh bóng pixel (đó là `/ui-apply`).

## Trước khi làm
- Đọc **`<Feature>/UX-BRAINSTORM.md`** (hướng đã chốt) + áp **`/fe`** (đọc `main.md` + `starci-<element>.md` + `drafts/*`).
- Chưa có brainstorm → chạy **`/starci-fe-ux-brainstorm`** trước. ĐỪNG tự chế hướng.

## STRICT — đừng TỰ CHẾ primitive; tra rule + dùng block canonical; design MỚI thì HỎI thầy
- **MỖI element đụng tới → BẮT BUỘC tra rule TRƯỚC** (`elements/*` · `concepts/*` · `layouts/*` trong `.claude/rules`) **+ tìm block/primitive canonical sẵn có trong repo**, rồi DÙNG THẲNG. CẤM hand-roll `<div border>` / `<input flat>` / `<button hover:bg>` / tự ghép icon+input khi hệ đã có primitive.
  - Bảng tra nhanh (đụng X → dùng Y, KHÔNG tự chế):
    - **search field** → block `reuseable/SearchInput` (`variant="secondary"` nếu trên surface) — KHÔNG `<div border><input>`. Ref [[elements/input]] §3 (variant theo nền).
    - **list dài/duyệt được** → `ScrollShadow hideScrollBar` (mirror `OutlineRail`) + **infinite** (`useSWRInfinite` + block `InfiniteScrollSentinel`, mirror `useQueryUserFollowersInfiniteSwr`). Ref [[list-surface-anatomy-search-count-list-pagination]] · [[sticky-rail-overflow-wrap-scrollshadow]].
    - **row/nhãn mở panel-drawer** → summary-row link `group-hover:underline` (KHÔNG fill). Ref [[hover-style-matches-clickable-nature]] (go-there→underline) + [[elements/label]] §2.
    - **chọn 1-trong-N** → `TabsCard`(nav) / `SegmentedControl`(setting) / `SelectableCardGroup`(card). **chip/badge** → HeroUI `Chip` ([[elements/chip]]). **section có nhãn** → `LabeledCard` / `CheckListCard` / `SurfaceListCard`. **rail chọn item** → `ListBox` ([[elements/list]] §4). **icon** → phosphor ([[elements/icon]]). **nhãn nhóm control** → `<Label>` ([[elements/label]] §1b).
  - **Hover KIỂU GÌ** theo bản chất target ([[hover-style-matches-clickable-nature]]): go-there→underline · user→opacity · stay-here/accordion→fill. Đừng mặc định `hover:bg`.
  - **Variant theo NỀN** ([[elements/input]] §3 · [[accordion-card-surface-on-standalone-pages]]): input/accordion/card chọn da để TƯƠNG PHẢN nền nó nằm trên (background→primary/no-variant; surface→secondary).
- **Phân biệt NGOẠI LỆ CÓ TÊN vs vi phạm:** vài chỗ CỐ Ý lệch primitive chuẩn (vd ô nhập composer-in-box dùng `<input>` flat — [[ai-chat-composer-box-controls-and-settings-modal]]). Chỉ lệch khi có **rule đặt tên ngoại lệ đó**; nếu không → dùng primitive chuẩn.
- **DESIGN MỚI (không rule/block nào cover) → HỎI THẦY TRƯỚC, đừng tự quyết primitive.** Tự chế UI mới = sai nguyên tắc "đồng bộ hệ". Nếu brainstorm chưa chốt cách render 1 thứ mới → dừng, hỏi; hoặc `/starci-fe-ux-brainstorm` lại. Sau khi thầy duyệt → ghi `drafts/*` để thành rule.
- **Trước khi viết 1 cụm `<div className="...">` tự dựng, tự hỏi:** "element này có rule chưa? có block canonical chưa?" → có thì dùng; chưa chắc thì grep repo (`SearchInput`/`ListBox`/`TabsCard`/`InfiniteScrollSentinel`…) trước khi tự chế.

## Làm
- Dựng theo IA đã chốt: đúng section / thứ tự / **1 primary action**; lắp bằng **block + HeroUI**, **feature chỉ GHÉP** (không style).
- Mọi fetch → **`AsyncContent`** (loading=skeleton mirror · empty=tự ẩn/CTA · error=retry). Tab → URL state nếu cần share.
- Dùng đúng field BE/DB đã map trong brainstorm; cần field BE mới → **nêu rõ, đừng fake** dữ liệu.
- 1 component = 1 folder `index.tsx` (tên folder = tên component); sub nest trong cha; props discipline (container tự đọc store/SWR).
- KHÔNG đụng trang/tab thầy đã ưng trừ khi brainstorm yêu cầu. Xoá dead code lộ ra (đã confirm không ai import).

## Sau khi làm
- `npx tsc --noEmit` + `npm run lint` sạch (baseline 4 lỗi blog WIP). Verify bằng mắt (chạy → chụp → soi → sửa).
- **NẾU thay đổi ĐỤNG backend (đổi resolver/gate/query) HOẶC feature PHỤ THUỘC BE data/runtime (dropdown từ catalog, list từ query, AI job, gate score…) → BẮT BUỘC CHECK BACKEND THẬT, không dừng ở "tsc FE sạch".** Chạy action thật (generate/submit…) + **đọc log BE** (`preview_logs` server backend) + query resolver xem data có tồn tại (empty UI thường = BE data/filter/enum-mismatch, không phải FE). Phân biệt **bug code vs config/env/data local** (vd model dropdown rỗng = local thiếu AI provider key → mọi model health-DOWN → nói rõ env-local, prod có key thì chạy; KHÔNG sửa code). Ref [[fe-change-touching-backend-must-verify-backend-runtime]]. Build xanh ≠ feature chạy.
- **Thầy feedback → tự ghi `.claude/rules/drafts/<temp>.md`** (rút nguyên tắc tổng quát + nguyên nhân gốc), KHÔNG sửa main/element trực tiếp. Gộp khi thầy gõ `/merge`.
