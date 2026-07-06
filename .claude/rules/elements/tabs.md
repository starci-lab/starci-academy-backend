# Element — Tabs (block `TabsCard` / `ExtendedTabs`)

> Element doc cho họ "tabs" (toolbar nav 1-2 nhóm). Bổ trợ [[single-select-among-options-use-tabs]] (khi nào dùng tabs) + [[tabscard-two-secondary-groups]] (2 nhóm tab 1 toolbar).

## 1. Tab có CẢ icon + label → mobile ẨN label, chỉ giữ icon — CHỐT 2026-06-18
- **Tab item có CẢ `icon` LẪN `label` → trên mobile (`<sm`) ẨN label, chỉ hiện icon; từ `sm:` lên hiện lại label.** Hàng tab nhiều item (2 nhóm leftTabs+rightTabs, hoặc filter feed) trên màn hẹp dễ tràn/wrap xấu → icon-only gọn, không tràn.
- **Cài ở BLOCK render tab (`ExtendedTabs`/`TabsCard`), KHÔNG ở feature** — sửa 1 chỗ, áp mọi nơi. Label bọc `<span className="hidden sm:inline">{label}</span>`; icon luôn render.
- **A11y BẮT BUỘC:** khi label bị ẩn, tab vẫn phải có tên cho screen-reader → set `aria-label`/`textValue` = label gốc (icon-only không được mất nhãn). Tab CHỈ-có-label (không icon) → giữ label luôn (không ẩn — ẩn là mất sạch).
- **Chỉ áp cho tab có icon** (icon thay được label về mặt nhận diện). Tab không icon → luôn hiện label.

## 2. Toolbar 2 nhóm tab: nhóm PHỤ (preference đặt-1-lần) thu thành DROPDOWN trên mobile — CHỐT 2026-06-27
- **Toolbar có 2 nhóm tab mà 1 nhóm là PREFERENCE "đặt-1-lần" (language/version/đơn vị…) → trên mobile THU nhóm phụ đó thành 1 DROPDOWN (`Select`), nhóm CHÍNH (nav đổi body) GIỮ NGUYÊN tabs + NHÃN.** Phân vai: PRIMARY nav = rõ + 1 chạm + giữ nhãn; SECONDARY preference = thu gọn khi chật (đổi ít, 2 chạm chấp nhận được). Convention chuẩn của docs/code-reader (Stripe API docs · Mintlify · Docusaurus: language/version selector → dropdown trên mobile).
- **KHÔNG icon-only-hoá nhóm nav chính trên mobile** (mơ hồ khi đứng 1 mình) — chỉ thu nhóm phụ. KHÔNG cuộn ngang toolbar, KHÔNG xếp 2 hàng (tốn chiều cao) trừ khi nhóm phụ cũng cần luôn-hiện.
- **Implement ở BLOCK, opt-in qua prop** — `TabsCard` có prop **`collapseRightOnMobile`**: mobile (`sm:hidden`) render `rightTabs` thành `Select` (trigger = item đang chọn icon+label + `Select.Indicator`; options = `ListBox.Item` giữ `isDisabled`); `sm+` (`hidden sm:block`) render inline tabs như cũ. Đọc CÙNG group data (items/selectedKey/onSelectionChange) → 1 nguồn. Feature chỉ bật cờ; mặc định KHÔNG collapse (giữ inline). Style ở block.
- **Gotcha HeroUI `Select.onSelectionChange` trả `Key | null`** (null khi bỏ chọn) → guard `if (key !== null)` trước khi gọi `group.onSelectionChange(key: Key)` (lỗi tsc TS2345 nếu không).
- **a11y:** `Select.Trigger`/`ListBox.Root` nhận `aria-label = group.ariaLabel`; `ListBox.Item` cần `textValue` (string) cho typeahead/screen-reader — label node → `typeof label === "string" ? label : key`.
- Áp đầu: `ContentTabBar` (lesson reader — Nội dung/Thử thách trái + ngôn ngữ TS/Java/C#/Go phải) bật `collapseRightOnMobile`.

## Liên quan
- [[single-select-among-options-use-tabs]] (tabs = nav; SegmentedControl = setting) · [[tabscard-two-secondary-groups]] (2 nhóm 1 toolbar) · [[master-detail-rail-as-filter-and-mobile-chips]] (mobile collapse cho rail) · [[when-drawer]].
