# STEP 2 (audit) — DIFF cây ĐÃ DUYỆT vs Storybook → thêm/tách/chỉnh → render 8080 → STOP

Chỉ chạy **sau khi thầy duyệt cây step 1**. Bây giờ mới được đối chiếu port sẵn có.

## A. Đối chiếu từng node của cây với `.storybook/stories/blocks/**`
Grep mỗi node: `find $FE_SOURCE/.storybook/stories/blocks -name "<Node>.tsx"`. Phân loại:

| Nhãn | Nghĩa | Việc step 3 |
|---|---|---|
| **REUSE** | port đã có, đủ dùng | dùng lại nguyên |
| **MODIFY** | port có nhưng thiếu prop/state cây cần | thêm prop/variant (§6b: prop chứ đừng đẻ component) |
| **ADD-STORY** | component TỒN TẠI trong `src/` nhưng CHƯA có port storybook | viết story phủ đủ states |
| **EXTRACT** | đang **inline** trong feature (không phải component riêng) | tách thành component + story |
| **NEW** | chưa tồn tại đâu cả **VÀ** chức năng thật sự khác | dựng mới (design/primitive từ atom) |

⚠️ Grep cho chắc 2 lượt: node "chưa có story" có thể **đã tồn tại trong `src/components/**`** (chỉ thiếu port) → ADD-STORY, KHÔNG phải NEW. Đừng nhầm path (`src/components/blocks/chips/X` chứ không `src/components/chips/X`).

### ⭐ A2. PHẢN BIỆN REUSE-first (bắt buộc — thầy chốt 2026-07-24)
Trước khi để bất kỳ node nào là **NEW** hay **EXTRACT**, HỎI: *"nó có phải CHỨC NĂNG khác, hay chỉ là port sẵn có cấu hình lại?"* — **ưu tiên tái dùng để ĐỒNG NHẤT tree**; đẻ component trùng khuôn = phân mảnh, "đổi 1 phải đổi hết".
- **Row bất kỳ** (leading + text + trailing/meta) → gần như luôn **REUSE `ListRow`**, không đẻ `XxxRow` mới. Icon/trạng-thái chỉ là node vào `leading`/`meta`.
- **List có nhãn** → `SurfaceListCard`(prop `label`) + `ListRow`, không extract "block danh sách".
- **Biến thể chrome** (flat vs card, tone khác) của pattern đã có → **MODIFY = thêm PROP/variant** vào component gốc (§6b), KHÔNG block mới. VD continue flat = `ContinueCard` + `variant="plain"`, không `ContinuePanel`.
- **Cảnh báo/alert/empty/tooltip** → REUSE feedback primitive (`Callout`/`EmptyState`/`ErrorState`), dù src đang hand-roll HeroUI `Alert`.
- Chỉ giữ **NEW** khi chức năng thật sự khác (vd conversion strip = compose nhiều commerce design theo pattern riêng).
- Neo: CourseContents phản biện → NEW 2→0, EXTRACT 2→0, chỉ còn 1 MODIFY (prop ContinueCard).

## B. Đề xuất thứ tự dựng — từ GỐC lên
primitive/design (NEW/ADD-STORY) TRƯỚC → EXTRACT block → ADD-STORY block → ráp story trang. (Gốc trước để tầng trên có mảnh mà ghép.)

## C. RENDER DIFF RA 8080 — PROTOTYPE ĐỐI CHIẾU TỪNG CÁI (bắt buộc — thầy soi mắt)
Trang `$FE_SOURCE/.artifacts/decompose/<ui>.step2.html` (Phosphor import, theme-aware):
- **Đếm** mỗi nhãn (REUSE/ADD-STORY/EXTRACT/NEW/MODIFY).
- **Mỗi node từng-là NEW/EXTRACT: vẽ PROTOTYPE mini render bằng port REUSE** (vd LessonRow render bằng ListRow) cạnh **lý do** — để thầy ĐỐI CHIẾU rằng reuse đủ, không cần đẻ mới. MODIFY thì vẽ 2 ô (bản card sẵn có vs bản cần) chỉ ra prop thiếu.
- **REUSE** gom hàng chip (khỏi rối). **Thứ tự dựng** (mục B) dạng list.
- Serve/verify 8080 (như s1 bước F) → báo link.

## D. STOP
Báo thầy: bảng diff + số đếm + thứ tự dựng + link 8080. **Dừng chờ duyệt** trước khi step 3 (dựng thật). Câu hỏi nên hỏi: feature-block có đưa vào storybook không · EXTRACT có đồng ý tách không · NEW design dựng hay giữ cấu-hình-tại-chỗ.
