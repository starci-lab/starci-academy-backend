# S2 — Apply fix vào block (story-local)

Sửa component `.tsx` local + story trong `.storybook/stories/blocks/**`, **chỉ đổi theo plan** (class/token/prop đã chốt).

- `diagnose-before-fix`: đụng nhiều branch (grid/line) → grep hết, sửa cả loạt.
- **Compose primitive, KHÔNG hand-roll** (dùng `CrossListCard`/`PriceTag`/`MetaRow`/`ButtonGroup`…).
- **§4 — primitive SỞ HỮU sizing/style nội bộ:** consumer truyền icon/children TRẦN; primitive tự ép (vd `StatusChip` ép icon `[&_svg]:size-4`). Cần khác → sửa PRIMITIVE, KHÔNG vá `size-*`/màu ở call-site.
- **§2d — đồng bộ element:** cùng info-type (vd time) → CÙNG element ở mọi ô; nhấn/giảm bằng **TONE** (neutral↔warning), không đổi sang element khác.
- **Spacing — thang `0 · 2 · 3 · 6 · 8`** (SOURCE là chuẩn; legacy `gap.md` tham khảo): chọn nấc theo QUAN HỆ — dính/no-gap `0` (vd khối giá xếp sát) · cụm-con `2` · trong-khối `3` · giữa-khối `6` · vùng-rộng `8`; ngoại lệ tên header→content `10`, landing `16`, divider-trong-card `3`. **Card padding = `p-3`** (SectionCard globals — KHÔNG `px-4 py-3`). CẤM ngoài thang (`1/1.5/4/5/7/9`). GROUP sở hữu gap con (§4).
