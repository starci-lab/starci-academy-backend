# Draft — UI chọn 1-TRONG-NHIỀU lựa chọn (single-select) → render TABS, không button-group (2026-06-25)

- File/§ đích khi `/merge`: `concepts/` (UI controls) hoặc `elements/tabs` + liên quan [[tabscard-two-secondary-groups]] + [[dashboard-labeledcard-and-tabscard]] + [[leaf-page-one-nav-and-combined-tab-toolbar]] + block `SegmentedControl` ([[payment-currency-toggle-and-price-breakdown]]).
- Bối cảnh: thầy chốt khi làm "Phỏng vấn thử" — bộ chọn cấp độ (Tất cả/Junior/Middle/Senior/Staff) đang là hàng `Button primary/outline`. Thầy: *"cấp độ câu hỏi render dạng tabs được không, update rules là nếu UI chọn 1 trong nhiều lựa chọn => tabs"*.

## Luật (STRICT)
- **Mọi control "chọn ĐÚNG 1 trong nhiều lựa chọn loại trừ" (single-select, mutually exclusive) → render dạng TABS (block `TabsCard` underline secondary), KHÔNG dựng hàng `Button variant=primary/outline` (button-group) hay chip rời.** Single-select = bản chất TAB (đổi lựa chọn = đổi 1 trục nội dung/filter). Button-group cho cảm giác "nhiều hành động" (sai) thay vì "1 trục nhiều giá trị".
- **Dùng block sẵn:** `TabsCard` (`leftTabs`/`rightTabs` = `{items:[{key,label,icon?}], selectedKey, ariaLabel, onSelectionChange}`) — feature chỉ truyền data, block lo style underline. KHÔNG tự ghép Tabs/pill.
- **Hai KIỂU tabs theo VAI TRÒ (thầy chốt 2026-06-25):**
  - **Underline (`TabsCard`)** = NAVIGATION / lọc nội dung panel phía dưới (đổi cái đang xem). Vd tab Nội dung/Thử thách, scope feed, filter danh mục.
  - **Block / segmented (`SegmentedControl`)** = chọn 1 OPTION / SETTING gọn TẠI CHỖ, KHÔNG đổi panel lớn. Active = khối nền pill (`bg-surface` trên track `bg-default`). Vd **cấp độ phỏng vấn** (Tất cả/Junior/…/Staff), công tắc tiền tệ VND/USD.
  - → Chọn theo vai: control là **điều hướng/đổi nội dung** → underline; là **chọn 1 thiết lập** → block. Thầy: *"chọn cấp độ dùng tabs dạng block, không phải underline"*.
- **Bỏ giới hạn "SegmentedControl chỉ 2–3 cái":** block segmented OK cho tới ~5–6 lựa chọn gọn (vd 5 cấp độ). Quá nhiều / nhãn dài / là trục nav → mới quay lại underline.
- **KHÔNG nhầm với MULTI-select** (chọn nhiều) → cái đó là chips/checkboxes, KHÔNG tabs. Luật này chỉ cho **single-select loại trừ**.
- **Filter "lọc nội dung phía dưới" = single-select → cũng là tabs** (đã chốt [[dashboard-labeledcard-and-tabscard]]): mở rộng nguyên tắc đó ra MỌI single-select, không riêng filter feed.

## Áp đầu 2026-06-25
- `InterviewSession` setup: level selector (Tất cả/Junior/Middle/Senior/Staff) `Button`-group → `TabsCard` (1 nhóm leftTabs, `selectedKey = level ?? "all"`). (Áp khi `/starci-fe-ux-apply` interview random.)
