# Concept — Ngăn section bằng WHITESPACE, không divider; cắt count thừa

> Heuristic bố cục (họ `concepts/*`). Rút từ feedback rail "Trên trang này" (2026-06-24): bỏ `Separator` giữa các khối, ngăn bằng `gap-6`.

## Quy tắc (STRICT)
- **Ngăn các section trong 1 rail/stack dọc bằng WHITESPACE (`gap-6`), KHÔNG `Separator`/divider.** Nhiều block xếp dọc (vd rail: outline · actions · ôn tập · luyện tập) → cách nhau bằng khoảng trắng `gap-6` là đủ phân tách; thêm đường kẻ giữa mỗi cặp = nhiễu, nặng, "kẻ ô". Whitespace > dividers (design restraint). Bỏ `<Separator/>` mở đầu mỗi khối.
- **Divider chỉ dùng khi:** (a) bên TRONG 1 khối bounded để chia sub-row (vd separator inset của List Card / accordion — đó là 1 phần "da" của khối), hoặc (b) 2 vùng dính nhau KHÔNG thể tách bằng gap (hiếm). KHÔNG dùng divider để ngăn 2 section vốn đã cách nhau bằng gap.
- **Cắt dòng "count" thừa khi list ĐÃ hiện item.** Dòng đếm tổng ("N thử thách", "N bộ · M thẻ") đặt dưới 1 list đã liệt kê các item = **vanity/lặp** (mắt đã thấy số item) → bỏ. Chỉ giữ count khi list **không** hiện item (vd group gập, chỉ show "n/m" — ref [[one-progress-bar-at-a-time]]).

## Nguyên tắc rút ra
- Trước khi thêm 1 đường kẻ / 1 dòng meta, hỏi: khoảng trắng đã phân tách chưa? list đã nói số chưa? Nếu rồi → đừng thêm. Tối thiểu visual weight: ngăn bằng gap, đếm bằng chính list. (Ref design-restraint, vanity-cut.)

## Áp đầu (2026-06-24)
- Rail `OnThisPage`: các section đã `gap-6` (whitespace) → **bỏ `Separator`** mở đầu `LessonChallenges` + `LessonFlashcards`; **bỏ dòng count** ("2 thử thách" / "N bộ thẻ"). Cả hai chuyển sang block [[elements/list]] §3 `LabeledList`. Ref [[concepts/card]] (không 2 card liên tiếp) + [[gap]] (gap-6 cụm bự, gap-3 trong khối, gap-2 item).
