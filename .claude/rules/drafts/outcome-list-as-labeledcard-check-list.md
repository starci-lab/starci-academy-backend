# Draft — Khối "đầu ra/thành quả mong đợi" render dạng LabeledCard + list check-led (KHÔNG bullet thô), item markdown KHÔNG truncate (2026-06-24)

- File/§ đích khi `/merge`: `starci-ui.rules` (LabeledCard / list patterns) + [[item-card-meta-inside-bounded-object]] +
  [[description-fields-render-markdown-compact]] + [[dashboard-labeledcard-and-tabscard]].
- Bối cảnh: trang giải challenge (`…/challenges/<id>`), cột brief. Khối **"Đầu ra mong đợi"** (`challenge.outputs`)
  ban đầu là `<section>` heading + `MarkdownContent` 1 bullet list thô (join `- {body}`). Thầy: *"đầu ra mong đợi
  cũng render dạng labeled card với ListCard"*.

## Luật (STRICT)
- **Khối liệt kê "thành quả/đầu ra/deliverable mong đợi" = `LabeledCard` (label NGOÀI card) bọc 1 LIST các row,
  KHÔNG để bullet list thô trần trên nền.** Mỗi đầu ra = 1 **row** (leading icon + nội dung), ngăn nhau bằng
  `border-b border-separator` (row cuối bỏ divider). Đây là "labeled card với list" = card có nhãn + danh sách hàng,
  không phải `<ul>` markdown trơ. Đồng bộ với các section card khác của trang (`LabeledCard` "Nộp bài"/"Kết quả").
- **Leading marker = semantic của khối:** "đầu ra mong đợi" (cái-bạn-sẽ-đạt-được) → **`CheckCircleIcon` màu `text-success`**
  (đánh dấu thành quả/đã-xong-thì-đạt). Icon `mt-0.5 size-5 shrink-0`, row `flex items-start gap-3 py-3`.
- **Item có markdown (inline code/bold) PHẢI render qua `MarkdownContent`, KHÔNG truncate.** Đầu ra là **câu mô tả
  dài** chứa inline code (`` `registerAs` ``, `` `GET /payment-config` ``, `` `apiKey` ``) → **KHÔNG dùng block
  `ListRow`** (nó `truncate` title về 1 dòng + chỉ nhận text → cắt cụt câu + lòi cú pháp markdown). Thay vào đó row
  tự dựng `<div>` + `<MarkdownContent markdown={item.body} className="min-w-0 [&_p]:m-0" />` (compact mặc định,
  `[&_p]:m-0` bỏ margin `<p>` cho row gọn, `min-w-0` cho phép wrap nhiều dòng). Ref [[description-fields-render-markdown-compact]].
  - **Phân vai block list:** `ListRow` = row NHÃN NGẮN 1 dòng (truncate + meta/trailing, GitHub-style) → hợp item
    title ngắn. Item là **đoạn mô tả markdown nhiều dòng** → tự dựng row + MarkdownContent, đừng ép vào `ListRow`.
- **Nguyên tắc tổng quát:** khi thầy nói "render dạng card + list" cho 1 khối liệt kê, chọn block theo BẢN CHẤT item:
  label ngắn → `ListRow`; mô tả markdown dài → row tự dựng + `MarkdownContent`. Luôn bọc bằng `LabeledCard` (nhãn
  ngoài) để khớp "họ" card của trang. KHÔNG để lại bullet list thô khi sibling là card.

## ĐÃ ÁP DỤNG 2026-06-24
- `Challenge/ChallengeView/index.tsx`: "Đầu ra mong đợi" `<section>`+`MarkdownContent(outputsMarkdown)` →
  `LabeledCard label={t("challenge.outputs")}` + map `outputs` thành row (`CheckCircleIcon` success + `MarkdownContent`
  body, divider giữa các row). Gỡ `outputsMarkdown` useMemo (dead). Import `CheckCircleIcon` (phosphor). tsc/lint sạch.
- **Chưa đụng** "Yêu cầu"/"Các bước" (vẫn surface Accordion — đúng vai expand) + "Prerequisites" (vẫn bullet
  MarkdownContent). Chỉ chuyển "đầu ra mong đợi" theo yêu cầu; hỏi thầy nếu muốn chuẩn hoá nốt prerequisites.
