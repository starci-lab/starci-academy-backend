# Concept — KHI NÀO dùng left RAIL (2-pane master-detail) vs KHÔNG (→ tabs / full-bleed / 1 cột)

> Heuristic quyết định bố cục (họ `concepts/when-*`, anh em [[when-drawer]]). Gom các luật rail đang rải rác thành 1 chỗ. Rút từ vụ trang Phỏng vấn thử (2026-06-21): mode interview chỉ 2 item (Học thẻ/Phỏng vấn) mà vẫn render rail → **rail rỗng = void = lệch layout**. Hỏi nhanh: *surface này có 1 TRỤC NAV + danh sách ĐỦ DÀI để "nuôi" rail không?*

## Quy tắc gốc (STRICT)
- **DEFAULT = KHÔNG rail.** 1 cột centered (`max-w-3xl mx-auto`) là mặc định cho MỌI trang trong khu Learn. **Rail là NGOẠI LỆ phải "KIẾM được"**, không phải bố cục mặc định. Lý do: khu Learn ĐÃ có sidebar icon của `LearnShell` (nav surface↔surface) → thêm rail thứ 2 = nặng, dễ rỗng/lệch nếu không đủ nội dung. Thầy chốt 2026-06-21 (*"xóa rails đi"*): đụng tới rail thứ 2 mà nghi ngờ → **bỏ**.
- **Rail (cột nav trái 2-pane) CHỈ dùng khi surface có 1 TRỤC NAV + 1 DANH SÁCH item đủ dài để duyệt** (cây module→bài · deck list · topic list · category list). Rail = điều hướng/lọc BỀN trên 1 tập item phong phú. **Có ≥1 list con thật, đủ dài** mới được dùng rail.
- **KHÔNG có list đủ nuôi → KHÔNG rail.** "2-3 mode toggle" KHÔNG phải list → đừng nhồi vào rail (sẽ rỗng). Đính chính trực tiếp [[rating-scale-row-and-page-internal-rail-layout]] §2 (*"2 item thôi KHÔNG đủ nuôi rail"*).
- **Test "kiếm được rail":** (1) có 1 list con ≥ ~5 item để duyệt? (2) list đó BỀN qua mọi state của surface (không biến mất ở 1 mode)? Thiếu 1 trong 2 → KHÔNG rail.

## Inventory StarCi — surface nào GIỮ / BỎ rail (2026-06-21)
| Surface | Rail? | Vì sao |
|---|---|---|
| **Content map** (`/learn/content`, module→bài tree) | ✅ GIỮ | cây nội dung dài, bền |
| **Ôn tập — Học thẻ** (deck list) | ✅ GIỮ | deck list đủ nuôi |
| **Ôn tập — Phỏng vấn thử** | ❌ BỎ | random toàn khoá, KHÔNG list → 1 cột + mode tabs |
| **Practice** (topic list) | ✅ GIỮ | topic list đủ nuôi (standalone page-internal) |
| **Leaderboard** (category) | ✅ GIỮ | category nav (rail-as-filter) |
| **Challenge solve · Mind-map** | ❌ BỎ | full-bleed, surface tập trung |
| **Trang đọc/setup/form 1 task** | ❌ BỎ | 1 cột centered |

## Bảng quyết định
| Tình huống | Bố cục | Rule nguồn |
|---|---|---|
| 1 trục nav + **list dài** (module/bài, deck, topic, category) | **2-pane: rail trái + pane phải** | [[rating-scale-row-and-page-internal-rail-layout]] §2 · [[master-detail-rail-as-filter-and-mobile-chips]] |
| Nav chỉ **2-3 mode/option**, không sub-list | **TabsCard/SegmentedControl đầu pane** + 1 cột | [[single-select-among-options-use-tabs]] |
| Surface "giải đề"/làm-1-việc tập trung (challenge solve) | **full-bleed, bỏ rail khoá** | [[solving-surface-fullbleed-no-course-rails]] |
| Canvas chiếm trọn viewport (mind-map) | **full-bleed, no chrome** | [[fullbleed-canvas-no-chrome-and-orient-zoom]] |
| 1 cột đọc / setup / form focused (1 task) | **centered `max-w-3xl mx-auto`, no rail** | [[three-tier-page-layout]] |

## Đặt rail ở ĐÂU (nếu dùng)
- **Route trong LearnShell** → rail = `LearnShell.leftRail` (layout-level), state qua **URL** (rail ≠ pane cùng cây). [[learn-content-padding-shell-p6]].
- **Route STANDALONE** (không shell) → **page-internal 2-pane** (`ResizableRail` + content tự `p-6`). [[standalone-page-internal-rail-when-no-learnshell]].

## Mobile (STRICT)
- Rail dọc cạnh-trái CHỈ hợp `lg+`. Màn hẹp → rail `hidden lg:flex` + **fold thành hàng chip cuộn ngang** (mode chips + topic chips) TRÊN đầu pane, đọc cùng URL state. [[master-detail-rail-as-filter-and-mobile-chips]].

## Bẫy hay gặp
- **Surface 2 mode mà 1 mode CÓ list, 1 mode KHÔNG** (vd Ôn tập: "Học thẻ" có deck list ↔ "Phỏng vấn" random toàn khoá, không list): **KHÔNG ép cả surface 1 kiểu.** Mode có list → rail; mode không list → 1 cột + tabs. Đừng giữ rail rỗng cho mode không-list chỉ để "đồng bộ" (rỗng = void > lệch).
- **Đếm item TRƯỚC khi chọn rail:** nav < ~4 item + không sub-list = chắc chắn KHÔNG rail.

## Liên quan
- [[when-drawer]] (giấu phụ sau drawer) · [[rating-scale-row-and-page-internal-rail-layout]] (rail nuôi bằng list) · [[single-select-among-options-use-tabs]] (ít option → tabs) · [[master-detail-rail-as-filter-and-mobile-chips]] (rail=filter + mobile chips) · [[standalone-page-internal-rail-when-no-learnshell]] (rail ở layout vs page) · [[solving-surface-fullbleed-no-course-rails]] / [[fullbleed-canvas-no-chrome-and-orient-zoom]] (full-bleed bỏ rail) · [[elements/sidebar]] (block rail).

## Áp đầu (2026-06-21) — ĐÃ ÁP DỤNG (hướng A)
- Trang **Phỏng vấn thử** (`/learn/flashcards/interview`): mode interview chỉ 2 item → rail rỗng (void, lệch). **Bỏ rail ở route interview** + mode switch vào pane (1 cột centered); **review GIỮ rail** (có deck list).
- Files: `learn/layout.tsx` (`isFlashcardInterview = isFlashcards && segments.includes("interview")` → gate leftRail `isFlashcards && !isFlashcardInterview`) · `Flashcards/index.tsx` (in-pane `SegmentedControl` mode switch `hidden lg:block` khi `mode==="interview"`; mobile vẫn `FlashcardMobileNav`) · `InterviewSession` (nắn meter "Độ sẵn sàng" empty: `flex-wrap items-center` → `flex-col gap-2`, hint xuống dòng). tsc/eslint sạch.
