# Draft — "Trên trang này" (OnThisPage): label SẠCH + render sâu tới h5 (2026-06-21)

- File/§ đích khi `/merge`: `starci-ui.rules` (OnThisPage/TOC) + cập nhật [RENDER-AUDIT].
- Bối cảnh: sau khi thêm anchor `#` hover (H-2), TOC hiện *"Lời mở đầu#"*, *"2.1. Thực hành#"* — `#` lòi vào label.
  Thầy: *"cái bên này render details hơn dc không"*.

## Luật (STRICT)
- **TOC label đọc `data-toc-label` (text SẠCH), KHÔNG `textContent`.** Heading có thể chứa thứ phụ (anchor `#`,
  inline code, icon) → `node.textContent` dính rác. `MarkdownContent` set `data-toc-label={getNodeText(children)}`
  trên mỗi heading; hook `useTableOfContents` đọc `dataset.tocLabel ?? textContent`. Quy tắc chung: **bất cứ khi nào
  nhét element con vào heading (anchor/badge/code), nguồn label cho TOC phải là attribute sạch, không phải DOM text.**
- **TOC cap ĐÚNG 3 CẤP: h2 / h3 / h4** (thầy chốt: *"nest max 3 level thôi"*). Lesson StarCi đánh số sâu, h4 =
  `2.1.1` đã là cấp 3 → ĐỦ. Reading mode: chỉ h2/h3/**h4** đi qua factory `buildTocHeading` (gắn
  `id`+`data-toc`+`data-toc-label`+anchor → scroll-spy/jump chạy). **h5 KHÔNG vào TOC** (cấp 4, sâu quá → rail
  rối). Nhưng h5 vẫn render như **heading thật trong bài** (reading: foreground + semibold + `mt-4`), chỉ là không
  có `data-toc`. h6 cũng không vào TOC.
- **Indent theo cấp** (nested tree, lookup `data-toc-level`): h2 flush · h3 `pl-3` · h4 `pl-6`. Active =
  `text-accent`, còn lại `text-muted`. Rail scroll-y.
