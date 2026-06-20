# Draft — Rail nav: title full-width + tooltip, text-base 16px, container p-6 (2026-06-19)

- File/§ đích khi `/merge`: `starci-ui.rules` (nav/list patterns) + §8 spacing.
- Bối cảnh: header module trong rail w-80 bị "n/m + caret" bên phải bóp → tiêu đề dài bị cắt giữa chừng, khó đọc.

## Luật (STRICT)
- **Tiêu đề dài trong nav/list hẹp = title chiếm FULL-WIDTH 1 dòng + `truncate` + tooltip (`title` attr).** ĐỪNG để
  meta (count/caret) nằm CÙNG hàng cướp width của title. Meta (count "n/m", bar) đẩy xuống **dòng 2** dưới title;
  caret canh giữa phải (`items-center`). (Ref: Carbon overflow content + truncate-with-tooltip; SAP wrap-then-truncate.)
- **Chữ nav label chính = `text-base` (16px)** (Typography `type="body"`), không 14px — dễ đọc (ref sidebar 14–16px).
  Sub-item (lesson row) có thể nhỏ hơn để phân cấp.
- **Padding container rail mặc định `p-6`** (24px) cho thoáng (thầy chốt). Vẫn theo scale 0/2/3/4/6.
- Pattern này đi kèm [[one-progress-bar-at-a-time]] (gập → "n/m bài" muted; mở → 1 thanh).
- Ref: [Carbon overflow](https://carbondesignsystem.com/patterns/overflow-content/) · [SAP wrap/truncate](https://www.sap.com/design-system/fiori-design-web/v1-71/foundations/writing-and-wording/ux-writing/wrapping-and-truncating-text) · [tooltip nav ellipsis](https://jobs.climate.columbia.edu/blog/the-missing-tooltip-in-menu).
