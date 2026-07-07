# Element — Tabs (block `TabsCard` / `ExtendedTabs`)

> Element doc cho họ "tabs" (toolbar nav 1-2 nhóm). Bổ trợ [[elements/card]] (TabsCard-in-card) + block `SegmentedControl` (chọn setting gọn).

## 0. Single-select loại-trừ → TABS, KHÔNG button-group (STRICT)
- **Mọi control "chọn ĐÚNG 1 trong nhiều lựa chọn loại-trừ" → render dạng TABS, KHÔNG hàng `Button variant=primary/outline` (button-group) hay chip rời.** Single-select = bản chất tab (đổi lựa chọn = đổi 1 trục); button-group đọc "nhiều hành động" (sai). KHÔNG áp cho MULTI-select (chọn nhiều) → cái đó là chips/checkboxes.
- **2 KIỂU tabs theo VAI (thầy chốt 2026-06-25):**
  - **Underline (`TabsCard`)** = NAVIGATION / lọc nội dung panel phía dưới (đổi cái đang xem — tab Nội dung/Thử thách, scope feed, filter danh mục).
  - **Block / `SegmentedControl` (pill)** = chọn 1 OPTION/SETTING gọn TẠI CHỖ, KHÔNG đổi panel lớn (cấp độ Junior→Staff, currency VND/USD). OK tới ~5-6 lựa chọn gọn.
  - → điều hướng/đổi nội dung → underline; chọn 1 thiết lập → block.

## 1. `TabsCard` — toolbar 1-2 nhóm tab (block dùng chung, cả 2 secondary) (STRICT)
- **Toolbar 1-2 nhóm tab = block `blocks/navigation/TabsCard`**, KHÔNG tự ghép Tabs/pill lẻ ở feature. API: `<TabsCard leftTabs={group} rightTabs={group?} />`, mỗi `group` = data `{ items: [{key,label,icon?,isDisabled?,muted?}], selectedKey, ariaLabel, onSelectionChange }`. Feature chỉ truyền data; block owns style.
- **Cả 2 nhóm đều secondary (underline), KHÔNG primary** → đọc như 1 tầng nav, không cái nào loud hơn. Block bake `data-[selected]:border-b-2 border-accent text-accent` (`.extended-tabs` global chỉ bỏ baseline).
- **2 nhóm cách nhau `justify-between` + `gap-3`** (icon+label trong 1 tab = `gap-2`). Tách vai semantic: nhóm TRÁI = đổi nội dung; nhóm PHẢI (ngôn ngữ) = cùng nội dung đổi cách trình bày. Gộp 1 toolbar thay vì 2 tầng tab.
- **Chrome của trang** (full-width `border-b` + cap) nằm ở WRAPPER feature (vd `ContentTabBar`), KHÔNG nhồi vào `TabsCard` (block tái dùng được).

## 2. Tab có CẢ icon + label → mobile ẨN label, chỉ giữ icon — CHỐT 2026-06-18
- **Tab item có CẢ `icon` LẪN `label` → trên mobile (`<sm`) ẨN label, chỉ hiện icon; từ `sm:` lên hiện lại label.** Hàng tab nhiều item (2 nhóm leftTabs+rightTabs, hoặc filter feed) trên màn hẹp dễ tràn/wrap xấu → icon-only gọn, không tràn.
- **Cài ở BLOCK render tab (`ExtendedTabs`/`TabsCard`), KHÔNG ở feature** — sửa 1 chỗ, áp mọi nơi. Label bọc `<span className="hidden sm:inline">{label}</span>`; icon luôn render.
- **A11y BẮT BUỘC:** khi label bị ẩn, tab vẫn phải có tên cho screen-reader → set `aria-label`/`textValue` = label gốc (icon-only không được mất nhãn). Tab CHỈ-có-label (không icon) → giữ label luôn (không ẩn — ẩn là mất sạch).
- **Chỉ áp cho tab có icon** (icon thay được label về mặt nhận diện). Tab không icon → luôn hiện label.

## 3. Toolbar 2 nhóm tab: nhóm PHỤ (preference đặt-1-lần) thu thành DROPDOWN trên mobile — CHỐT 2026-06-27
- **Toolbar có 2 nhóm tab mà 1 nhóm là PREFERENCE "đặt-1-lần" (language/version/đơn vị…) → trên mobile THU nhóm phụ đó thành 1 DROPDOWN (`Select`), nhóm CHÍNH (nav đổi body) GIỮ NGUYÊN tabs + NHÃN.** Phân vai: PRIMARY nav = rõ + 1 chạm + giữ nhãn; SECONDARY preference = thu gọn khi chật (đổi ít, 2 chạm chấp nhận được). Convention chuẩn của docs/code-reader (Stripe API docs · Mintlify · Docusaurus: language/version selector → dropdown trên mobile).
- **KHÔNG icon-only-hoá nhóm nav chính trên mobile** (mơ hồ khi đứng 1 mình) — chỉ thu nhóm phụ. KHÔNG cuộn ngang toolbar, KHÔNG xếp 2 hàng (tốn chiều cao) trừ khi nhóm phụ cũng cần luôn-hiện.
- **Implement ở BLOCK, opt-in qua prop** — `TabsCard` có prop **`collapseRightOnMobile`**: mobile (`sm:hidden`) render `rightTabs` thành `Select` (trigger = item đang chọn icon+label + `Select.Indicator`; options = `ListBox.Item` giữ `isDisabled`); `sm+` (`hidden sm:block`) render inline tabs như cũ. Đọc CÙNG group data (items/selectedKey/onSelectionChange) → 1 nguồn. Feature chỉ bật cờ; mặc định KHÔNG collapse (giữ inline). Style ở block.
- **Gotcha HeroUI `Select.onSelectionChange` trả `Key | null`** (null khi bỏ chọn) → guard `if (key !== null)` trước khi gọi `group.onSelectionChange(key: Key)` (lỗi tsc TS2345 nếu không).
- **a11y:** `Select.Trigger`/`ListBox.Root` nhận `aria-label = group.ariaLabel`; `ListBox.Item` cần `textValue` (string) cho typeahead/screen-reader — label node → `typeof label === "string" ? label : key`.
- Áp đầu: `ContentTabBar` (lesson reader — Nội dung/Thử thách trái + ngôn ngữ TS/Java/C#/Go phải) bật `collapseRightOnMobile`.

## 4. DOCUMENT TABS — chọn 1-trong-N item BỀN (CV/sheet/view), gộp 1 toolbar `TabsCard` + slot `leftEnd`
- **Chọn 1-trong-N khi item là DOCUMENT BỀN (có tên + hành động riêng sửa/xoá/đổi tên — CV, sheet, view) → DOCUMENT TABS (underline, `TabsCard`), KHÔNG chip strip.** Phân ranh với attempt-selector ([[attempt-history-selector-adaptive-and-grading-model-chip]] = chip strip): attempt = bản ghi TRANSIENT chỉ-xem → chip; document = ít, bền, có identity + action → tab. Hỏi: item có tên riêng + user quản lý (sửa/xoá) không? Có → document tab; chỉ lịch sử xem lại → chip.
- **2 trục cùng govern body → GỘP 1 toolbar `TabsCard`:** trái = trục NỘI DUNG (document nào — accent) · phải = trục TRÌNH BÀY (Kết quả/Xem trước — neutral, 1 tín hiệu accent/toolbar). KHÔNG 2 hàng tab chồng.
- **Hành động per-document (⌄ Sửa/Xoá) + "+" thêm mới = slot `leftEnd` của `TabsCard`** (cụm inline NGAY SAU dải tab trái, bọc `flex min-w-0 items-center gap-1`) — là **SIBLING của tab list, TUYỆT ĐỐI KHÔNG lồng button vào `Tabs.Tab`** (react-aria tab không nest interactive). ⌄ menu áp cho document ĐANG ACTIVE (Google Sheets style — 1 menu thay N kebab); "+" = ghost icon-only; "+N" overflow = span muted (→ drawer).
- **Tab label = 1 node trong `label`, KHÔNG dùng prop `icon`** khi icon là verdict/status: `TabsCard` ẩn label dưới `sm` khi có `icon` (§2) → N tab cùng icon verdict thành N icon giống hệt. Nhét verdict + tên (`truncate max-w-32`) + score nhỏ (`text-xs opacity-70`) hết vào `label`.
- **Header row của collection:** label trái + outcome line phải; entry-point "+ Thêm" chỉ về hàng này khi **0 document** (strip dưới không render). ≥1 document → strip tabs render (kể cả 1 — kiểu Sheets: 1 tab + "+").

## 5. `Tabs.Tab` PHẢI chứa `<Tabs.Indicator/>` (active underline)
- **Mỗi `<Tabs.Tab>` PHẢI có `<Tabs.Indicator/>`** làm con (sau label) để có gạch chân active. HeroUI Tabs không tự render underline; thiếu → tab active chỉ đổi màu chữ, không rõ tab nào đang chọn. (`TabsCard` block đã tự lo — chỉ áp khi dựng raw HeroUI `Tabs`, vd trong modal.) Ref [[modal-header-tabs-indicator]].

## Liên quan
- [[elements/card]] (filter feed = TabsCard) · [[leaf-page-one-nav-and-combined-tab-toolbar]] (2 nhóm tab gộp 1 toolbar) · [[cv-document-tabs-combined-toolbar-leftend]] (document tabs + leftEnd) · [[master-detail-rail-as-filter-and-mobile-chips]] (mobile collapse cho rail) · [[modal-header-tabs-indicator]] (Tabs.Indicator) · [[when-drawer]].
