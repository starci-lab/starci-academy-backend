# MARKDOWN — chuỗi chữ này render markdown tới mức nào

> Trục này trả lời đúng một câu: **chuỗi chữ này được render markdown tới mức nào.**
> Không trả lời cỡ chữ (xem `text/` — chưa dựng), không trả lời màu chữ (xem `color/` —
> chưa dựng). Neo code thật: [`example.html`](example.html).

---

## 1. THANG — ba tầng, không có tầng thứ tư

Thang này là thang **LỒNG NHAU**: tầng sau LUÔN cho phép mọi thứ tầng trước cho phép, cộng
thêm. Đọc từ type definition + component thật, không bịa.

| Tầng | Cơ chế thật | Cho phép | Nguồn |
|---|---|---|---|
| `title` | `Typography` (atom) prop `parseInlineCode` | CHỈ `` `backtick` `` → `<code>`. Không bold/italic/link/block | `atoms/text/Typography/Typography.tsx` — hàm `renderInlineCode`, dòng ~150-165 |
| `richtext nhỏ` | composite `RichText` | backtick + **bold** + *italic* + `[link]` + `\n`. KHÔNG block-level | `composites/viewers/RichText/RichText.tsx` — mảng `RULES`, dòng ~62-98 |
| `bài viết` | composite `MarkdownContent` | mọi thứ ở richtext nhỏ, cộng heading · list · code fence · bảng · mermaid · directive (`:::tab`/`:::accordion`/`:::chip`/`:::muted`) | `composites/viewers/MarkdownContent/MarkdownContent.tsx` — `ReactMarkdown` + `REMARK_PLUGINS`, dòng ~224 |

SSOT của thang: KHÔNG có type union code (`MarkdownTier` chưa tồn tại) — thang này sống dưới
dạng "component nào được import", không phải 1 kiểu TypeScript. **THANG CHƯA CÓ ĐẠI DIỆN
KIỂU TRONG CODE** — nếu sau này bake thành enum, xem §6 dòng "chưa gate được".

Lý do kỹ thuật của tầng `title` (không phải gu trình bày): title luôn nằm trong 1 element có
RÀNG BUỘC HTML (`<button>` của accordion trigger, thẻ header nén 1 dòng) — `MarkdownContent`
phát ra markup BLOCK-LEVEL (`<p>`, `<ul>`, `<div>`) mà lồng vào `<button>` là HTML không hợp
lệ. Xem `renderInlineCode`'s JSDoc, `Typography.tsx` dòng ~148-155.

---

## 2. CÂY QUYẾT ĐỊNH — hỏi từ trên xuống, dừng ở câu YES đầu tiên

| # | Hỏi | Ra |
|---|---|---|
| 1 | Field này là ĐỊNH DANH của 1 khối/1 item (xoá hết định dạng, người đọc **vẫn nhận ra đang xem cái gì**) VÀ/HOẶC nó nằm trong 1 element có ràng buộc HTML (`<button>`, header nén)? | `title` — DỪNG |
| 2 | Field cần HIỂN THỊ CẤU TRÚC BLOCK (heading riêng dòng, list nhiều mục, code fence nhiều dòng, bảng, mermaid, hoặc bất kỳ directive `:::`)? | `bài viết` — DỪNG |
| 3 | Còn lại (mô tả 1-vài dòng, có thể cần nhấn 1 từ hoặc 1 link, nhưng không cần block) | `richtext nhỏ` |

**Phép thử phụ cho câu 1** (khi phân vân title vs richtext nhỏ): xoá hết bold/italic/link
khỏi field. Người đọc còn nhận ra "đây là cái gì" ⇒ `title`. Định dạng đó tự nó MANG THÔNG
TIN (link dẫn sang trang khác, bold nhấn 1 từ khoá) ⇒ không phải title.

**Trước khi tin cây: nếu field đó có prop TYPE trong code là `ReactNode` (không phải
`string`), cây này KHÔNG áp được** — `ReactNode` là một SLOT (caller tự quyết định, tự nhét
gì cũng được), không phải một field-1-tầng mà trục này phân xử. Xem bẫy #4 dưới.

---

## 3. VÉT CẠN — hai trục riêng, cả hai đều phải vét cạn

### 3a. Trục TẦNG: thang 3 giá trị ⇒ `C(3,2) = 3` cặp — đủ cả 3

**Với thang chỉ 3 bậc, "kề nhau" là 2 cặp, "cách xa" là 1 cặp — không có nhóm "cách 1 bậc"
trung gian vì không đủ bậc để tạo nhóm đó.**

| Cặp | Phép phân định DỨT KHOÁT | Đã cắn thật |
|---|---|---|
| **`title` ↔ `richtext nhỏ`** | Dùng cây §2 câu 1. Field có nằm trong ràng buộc HTML (button/header nén) VÀ là định danh không? YES ⇒ `title`. Nếu định dạng (bold/link) MANG THÔNG TIN thay vì chỉ tô đậm tên ⇒ `richtext nhỏ`. | ✅ 3 lần — xem §3b bảng dưới |
| **`richtext nhỏ` ↔ `bài viết`** | Dùng cây §2 câu 2. Cần HEADING/LIST/CODE-FENCE/BẢNG/MERMAID/DIRECTIVE (cấu trúc nhiều dòng, nhiều khối) không? YES ⇒ `bài viết`. Chỉ cần 1 dòng có thể có bold/link/backtick ⇒ `richtext nhỏ`. | chưa (chưa ghi nhận ca lẫn thật, `RichText` chưa có consumer thật để mà lẫn — xem §4 bẫy #2) |
| **`title` ↔ `bài viết`** | **CỐ Ý KHÔNG CÓ phép thử riêng.** Phân vân ở đây nghĩa là đang đọc sai field: một field không thể vừa là identifier-trong-button vừa là thân tài liệu nhiều khối. Dừng lại, xác định field đó thực sự là gì (tên hay nội dung), đừng chọn giữa hai đầu thang. | ✅ 1 lần — `SubmissionFindingsList.tsx`'s `message`, xem §3b |

### 3b. Ba lỗi thật đã cắn — cặp `title ↔ richtext nhỏ`/`title ↔ bài viết`

| # | Chỗ | Đã viết (SAI) | Đúng ra | Cặp lẫn | Ngày |
|---|---|---|---|---|---|
| 1 | `RichText.tsx:145` JSDoc | liệt kê "titles" là ví dụ dùng RichText | title không dùng RichText | `title ↔ richtext nhỏ` | 2026-07-29 |
| 2 | `SurfaceCardAccordionItem.title` | kiểu `ReactNode` (mời JSX/markdown tuỳ ý) | kiểu `string`, qua `parseInlineCode` | `title ↔ richtext nhỏ` | 2026-07-29 |
| 3 | `SubmissionFindingsList.tsx`'s field `message` | render thẳng `<MarkdownContent>` (full, block-level) **NGAY TRONG accordion trigger `<button>`** | tách icon sang `titleStart`, `message` đổi tên vai trò thành `title` (string qua `parseInlineCode`) | `title ↔ bài viết` (lẫn nặng nhất, HTML không hợp lệ) | 2026-07-29 |

### 3c. Trục LOẠI FIELD — vét cạn theo TIÊU CHÍ KHÁCH QUAN: mọi tên field xuất hiện thật
trong `.storybook/components/**` với type `string`/`ReactNode` liên quan tới chữ tác giả.
Tiêu chí dừng: đã liệt kê đủ 8 loại field grep ra được trong code thật (`title`, `label`,
`subtitle`, `description`, `caption`, `hint`, `body`, `message`) — liệt kê thêm loại field
không tồn tại trong code là bịa, nên dừng ở đây.

| Field | Tầng ĐÚNG (theo cây §2) | Thực trạng CODE hôm nay | Neo |
|---|---|---|---|
| `title` (item trong 1 mảng, hiện trong button/header nén) | `title` | ✅ ĐÃ đúng ở `SurfaceCardAccordionItem`/`SubmissionFindingsList` sau đợt sửa 2026-07-29 | `SurfaceCard.tsx:1533`, `SubmissionFindingsList.tsx:293` |
| `title` (root prop của 1 composite, không nằm trong control) | thường `bài viết` cho phép slot tự do — **NHƯNG kiểu vẫn là `ReactNode`, chưa ai xiết** | ⬜ CHƯA xiết — `Alert`, `Accordion` (atom), `Toast`, `AsyncContent`, `Feedback`, `Form`, `Disclosure`, `List`, `TitledText`, `Page`, `Section` đều còn `title: ReactNode`/`title?: ReactNode` | xem §4 bẫy #4 |
| `label` (button/input/chip/badge label) | NGOÀI PHẠM VI trục này — chữ hệ thống/form, không phải nội dung tác giả | permissive `ReactNode` khắp atoms form (`Input`, `Select`, `Choice`, `SearchAutocomplete`) — chấp nhận được, vì không ai author markdown cho label form | `atoms/forms/*.tsx` |
| `subtitle` | `richtext nhỏ` (đi kèm title, mô tả thêm 1 dòng) | Lệch: `ContinueCard`/`Navbar` đã `string` ĐÚNG dạng; `SurfaceCard`/`List`/`TitledText` còn `ReactNode` — chưa xiết | `ContinueCard.tsx:51`, `SurfaceCard.tsx:1186` |
| `description` | `richtext nhỏ` | Type ĐÚNG (`string`) ở hầu hết block (`TrialEnrollNudge`, `EnrollGate`, `MilestoneUpNextCard`, `ProfileNotFoundState`, `PremiumGateModal`) — **NHƯNG render qua `Typography` thường, KHÔNG qua composite `RichText`** vì `RichText` CHƯA có consumer thật nào (xem §4 bẫy #2) | grep "description:.*string" |
| `caption` | `richtext nhỏ` | `MermaidDiagram.caption`/`LessonVideoModal.caption` đã `string` — cơ chế render CHƯA xác minh có qua `RichText` hay Typography thô | `MermaidDiagram.tsx:32`, `LessonVideoModal.tsx:127` |
| `hint` | NGOÀI PHẠM VI (chữ hệ thống form, như `label`) | `ReactNode` khắp `Input`/`Select`/`Choice`/`FieldFrame`/`KeyValue` — permissive hơn cần nhưng không phải nội dung tác giả | `atoms/forms/_field/FieldFrame.tsx:35` |
| `body` (SLOT `ReactNode` nhận nguyên cây con) | **KHÔNG PHẢI field-1-tầng** — là slot, caller tự quyết định tier khi soạn children | `Alert.tsx:111`, `Feedback.tsx:85/196`, `Form.tsx:55/137`, `Disclosure.tsx:44`, `DrawerShell.tsx:54` | |
| `body`/`markdownBody()` (string tài liệu dài) | `bài viết` | ✅ ĐÚNG, render qua `MarkdownContent` | `ChallengeBrief.tsx`, `ContentArticle.tsx` |
| `message` | phụ thuộc NGỮ CẢNH — không có tầng cố định cho riêng tên field này | `SubmissionFindingsList`'s `message` từng SAI (`bài viết` trong `title`-context) → sửa thành `title`; các `message` khác (toast, alert) chưa audit | xem §3b #3 |

---

## 4. BẪY CẤU TRÚC — sai không nằm ở chọn tầng, mà ở đọc sai vai trò của field

1. **Field cùng TÊN (`title`) không cùng VAI TRÒ.** `title` root prop của 1 composite khác
   `title` của 1 item trong mảng con nằm trong accordion trigger — cùng tên, hai bộ ràng buộc
   khác nhau. Đọc theo TÊN field mà không đọc NGỮ CẢNH RENDER (trong button hay không) là
   cách chắc chắn để lẫn `title ↔ bài viết`.

2. **Composite tầng giữa được XÂY nhưng KHÔNG AI DÙNG.** `RichText.tsx` (tầng `richtext
   nhỏ`) có story riêng nhưng **0 consumer thật** ngoài chính story nó (`grep "import.*RichText"`
   chỉ ra đúng 1 file — file story). Mọi `description`/`caption` hiện tại render qua
   `Typography` trần, bỏ qua tầng `richtext nhỏ` dù type đã đúng `string`. Nghĩa là: type
   đúng KHÔNG bảo đảm cơ chế render đúng — phải kiểm CẢ HAI.

3. **`ReactNode` là một cửa mời, không phải một tầng.** Một field khai `ReactNode` không nằm
   trong thang §1 — nó cho phép caller nhét `MarkdownContent` (bài viết) vào bất cứ đâu, kể
   cả bên trong 1 accordion trigger. Bẫy chỉ lộ ra khi có 1 consumer THẬT làm vậy — đúng như
   ca `SubmissionFindingsList`. **Xiết kiểu (`ReactNode` → `string`) là hành động sửa lỗi
   thật, không phải dọn kiểu cho đẹp.**

4. **Sửa 1 chỗ không tự lan sang chỗ TRÔNG GIỐNG.** Đợt 2026-07-29 chỉ xiết
   `SurfaceCardAccordionItem.title`; 11 component khác vẫn còn `title: ReactNode`/
   `title?: ReactNode` chưa đụng tới (`Alert`, `Accordion` atom, `Toast`, `AsyncContent`,
   `Feedback`, `Form`, `Disclosure`, `DrawerShell`, `ModalShell`, `Page`, `Section`, `List`,
   `TitledText`). Không có bằng chứng những component này ĐANG bị lạm dụng — ghi nợ, KHÔNG
   suy diễn thành lỗi đã xảy ra.

5. **Quét-theo-DỮ-LIỆU không thay được quét-theo-COMPONENT.** Đợt sửa đã quét
   `.storybook/stories/**/*.stories.tsx` tìm cú pháp markdown literal (`**`, `[text](url)`)
   trong field `title` — 0 hit. Nợ không nằm ở DỮ LIỆU story mà ở KIỂU của component
   (`ReactNode` cho phép, dữ liệu story hiện tại chỉ chưa dùng tới quyền đó). Kết luận "0 hit
   ⇒ an toàn" là SAI nếu chỉ quét dữ liệu mà không quét kiểu.

---

## 5. NEO THẬT — thứ tự ưu tiên khi hai nguồn đá nhau

1. **Component thật đang render field đó** (`Typography.tsx`/`RichText.tsx`/
   `MarkdownContent.tsx`) — đọc cơ chế THẬT nó cho phép, không suy từ tên field.
2. Cây quyết định §2 — chỉ dùng khi (1) chưa quyết được vai trò (root prop hay item-trong-mảng,
   trong button hay không).
3. `.artifacts/decompose/markdown-tier-rules.html` (2026-07-29) — bản ghi quyết định gốc của
   thầy, đã ÁP vào code; dùng để đối chiếu Ý ĐỊNH ban đầu, không dùng thay cho việc đọc lại
   component thật (artifact có thể lệch số dòng theo thời gian).

Neo cụ thể từng nhánh: [`example.html`](example.html).

---

## 6. VẠCH CẤM

| # | Cấm | Gate |
|---|---|---|
| 1 | Field `title` nằm trong 1 control có ràng buộc HTML (button/header nén) nhận kiểu `ReactNode` thay vì `string` | ⬜ **CHƯA — gate cần viết**: quét mọi prop tên `title` trong type khai trong `.storybook/components/**`, cảnh báo nếu type là `ReactNode`/`JSX.Element` VÀ component đó render nó bên trong `<button>`/`Accordion.Trigger` |
| 2 | Render `MarkdownContent` (block-level) bên trong bất kỳ element nào có ràng buộc HTML (`<button>`, `<summary>`, `<a>`, phần tử inline) | ⬜ **CHƯA — gate cần viết**: quét JSX, tìm `<MarkdownContent` mà tổ tiên JSX gần nhất trong cùng file là 1 trong danh sách thẻ cấm |
| 3 | Field khai kiểu `string` đúng tầng `richtext nhỏ` nhưng render qua `Typography` trần thay vì composite `RichText` | ⛔ không gate được tự động (cần biết Ý ĐỊNH tác giả field, không suy được từ type) — kỷ luật: mỗi field `description`/`caption`/`subtitle` mới phải tự hỏi "cần bold/link không, hay Typography trần là đủ" |
| 4 | Composite tầng giữa (`RichText`) tồn tại nhưng không có consumer thật ngoài story của chính nó, kéo dài qua nhiều đợt sửa | ⬜ **CHƯA — gate cần viết**: đối chiếu `check-deps-coverage.mjs` hiện có (bắt "component compose gì mà Deps tab không khai") — mở rộng để bắt luôn "component ĐƯỢC XÂY mà 0 ai import ngoài chính story nó" |
| 5 | Đổi kiểu 1 field markdown ở 1 consumer mà không `tsc` toàn repo để bắt các consumer khác cùng field name | ✅ có thể bắt gián tiếp qua `tsc --noEmit` toàn repo (đã dùng đúng cách này ở đợt 2026-07-29, bắt ra `SubmissionFindingsList` là consumer thứ 3) |
| 6 | Đánh giá "an toàn" chỉ bằng quét DỮ LIỆU story (cú pháp markdown literal trong field), bỏ qua quét KIỂU component | ⛔ không gate được — kỷ luật: quét dữ liệu KHÔNG thay được đọc kiểu, xem bẫy #5 |
