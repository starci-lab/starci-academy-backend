# MATRIX — HÌNH DỮ LIỆU nào thì LẤY COMPONENT NÀO

> **Đây là bảng TRA, không phải catalog.** Vào bằng cột đầu — *"tôi đang có cái gì trong tay"* —
> rồi đọc sang phải ra đúng MỘT component. Không đọc từ tên component ngược lại.
>
> Thầy chốt 2026-07-30, cuối phiên feedback `ChallengePage/Graded`: *"kiểu ma trận là tình huống
> nào chọn gì — ví dụ label + văn bản, cần render ⇒ SurfaceCard; dữ liệu dạng list, có extends ⇒
> SurfaceCardAccordion; dữ liệu dạng list đầu việc ⇒ SurfaceCardCrossList"*.
>
> ⚠️ **Mở file này TRƯỚC khi gõ dòng JSX đầu tiên.** Không phải sau khi dựng xong rồi soi lại.

---

## Vì sao file này tồn tại

Cả phiên `ChallengePage/Graded` (2026-07-30) lặp lại **đúng một lỗi**: dựng đúng field, đúng nghiệp
vụ, `tsc` sạch, 10 cổng xanh, eslint xanh — mà **chọn sai vỏ**.

Neo cụ thể. Một đoạn văn (hint của `ChallengeBrief`) bị nhét vào `SurfaceCardList` với `items` độ
dài **luôn bằng 1**. Thầy bắt: *"sao lại là SurfaceCardList mà không render SurfaceCard và bỏ text
vào thôi? nó phải list đâu?"* Trước đó cùng vùng ấy còn lồng `SurfaceCardAccordion` vào chính nó
chỉ để có một trigger; thầy bắt *"phản hồi không render dạng card được không?"* — đúng ca phải dùng
`Disclosure`.

Không cổng nào bắt được hai lỗi đó, vì cả hai đều **hợp kiểu và render ra vẫn trông được**. Chỉ có
bảng tra chặn được.

## Quan hệ với các canon khác

| File | Trả lời câu | Dùng lúc |
|---|---|---|
| [`boundary.md`](boundary.md) | *"tôi được phép ghi vào đâu"* | trước tất cả |
| **`matrix.md`** (file này) | *"cụm nội dung này lấy COMPONENT nào"* | đang **DỰNG** |
| [`principles/`](principles/INDEX.md) 15 trục | *"giá trị này (gap · cỡ chữ · màu) đúng hay sai"* | đang **AUDIT** |

Thứ tự là bắt buộc, không phải gợi ý: **chọn sai vỏ thì cả 15 trục đúng hết cũng vô nghĩa.** Một
`SurfaceCardList` chở một đoạn văn thì gap đúng thang, cỡ chữ đúng bậc, màu đúng token — vẫn sai.

Không dòng nào trong file này khớp cụm của tôi ⇒ **mới** tính đến mở rộng component. Và đó là
**quyết định của THẦY**, không tự thêm (`boundary.md` §2.3).

---

## 1. Bề mặt có NHÃN — họ `SurfaceCard*`

Cùng một file: `composites/cards/SurfaceCard/SurfaceCard.tsx`. Nhãn do **khung** vẽ qua prop
`label`, caller không tự dựng nhãn bằng `Typography`.

Phép phân định gốc, hỏi đúng hai câu: **(1)** nội dung tôi có là MỘT KHỐI hay MỘT MẢNG DÒNG ĐỒNG
DẠNG? **(2)** nếu là mảng — mỗi dòng có phần ẨN không, và dòng có BẤM được không?

| Tôi đang có | Chọn | Đường vào nội dung | Đừng chọn |
|---|---|---|---|
| MỘT khối tự do: đoạn văn, markdown, cụm JSX tôi tự ghép | **`SurfaceCard`** | `children` / `body` (+ `header`, `footer`) | `SurfaceCardList` — mảng độ dài 1 là sai khái niệm ở KIỂU DỮ LIỆU |
| Cả khối đó BẤM ĐƯỢC (một thẻ dẫn đi đâu) | **`SurfaceCard`** + `onPress` / `href` | `isPressable` tự suy ra | đừng tìm `SurfaceCard.Pressable` — không còn export đó |
| MẢNG dòng PHẲNG, mỗi dòng một hàng, thường bấm được | **`SurfaceCardList`** | `items[]` — `title`/`subtitle`/`leadingIcon`/`metaText`/`trailingIcon`, hoặc `content` tự do | `SurfaceCardAccordion` nếu dòng không mở ra; `ListLabeled` nếu KHÔNG cần mặt card |
| MẢNG dòng MỞ RA ĐƯỢC (trigger + thân ẩn) | **`SurfaceCardAccordion`** | `items[]` — `id` · `title` (**string plain**) · `body` | `Disclosure` nếu chỉ có MỘT vùng gập |
| MẢNG dòng ĐỌC-THÔI mang dấu ✓ / ✗ / ○ | **`SurfaceCardCrossList`** | `items[]` — `text` + `mark: check\|cross\|pending\|none` + `tone` | `SurfaceCardList` — source ghi thẳng *"Read-only; for CLICKABLE rows use SurfaceCardList"* |
| MẢNG section, mỗi section có THÂN nhiều dòng, cần thanh nhãn LẶNG bên TRONG khung | **`SurfaceCardNested`** | `items[]` — `eyebrow`/`title`/`content`, hoặc `children` | `SurfaceCardList` — Nested cố tình KHÔNG có leading/meta/trailing/selected/verdict |
| LƯỚI ô bấm-rồi-xong (chấm mức, chọn lối vào, menu ô lớn) | **`SurfaceCardPressableGroup`** | `items[]` + `onPress`/`href` + `ariaLabel` | `SurfaceCardSelectableGroup` nếu không cần luật một-trong-N |
| LƯỚI ô là CONTROL chọn-một-trong-N thật | **`SurfaceCardSelectableGroup`** | `items[]` + `value` + `onChange` + `ariaLabel` | `SurfaceCardPressableGroup` — khác **hợp đồng DOM**, không phải khác style |
| Ô "tạo mới" nét đứt cuối một lưới thẻ | **`SurfaceCardPlaceholder`** | `icon` + `label` + `onPress` (không có children) | dùng làm empty-state là sai — List/Accordion đã có `emptyState` riêng |

**Card nằm TRONG một bề mặt khác** (modal, drawer, panel, card khác) ⇒ **không đổi component**, chỉ
bật `variant="nested"` — viền THAY cho shadow, vì shadow tàng hình trên mặt cha.
`SurfaceCard`/`SurfaceCardList`/`SurfaceCardAccordion`/`SurfaceCardCrossList` đều đã có trục này.

**Nổi bật một thứ trên màn** ⇒ prop `isHighlight` của chính `SurfaceCard`, không bọc thêm lớp.

### Vạch cấm của mục này

- ⛔ **`items` mà độ dài LUÔN bằng 1 ⇒ chọn sai họ.** Một đoạn văn không phải danh sách một phần
  tử. Neo 2026-07-30 round-12 · `ChallengeBrief.tsx:240` — hint đi qua BA hình trong một ngày
  (`SurfaceCardAccordion` → `SurfaceCardList` → `SurfaceCard` + `label`). Mảng-luôn-1 kéo theo
  divider-giữa-hàng và `key` vô nghĩa.
- ⛔ **Đã có `label` của khung thì đừng dựng nhãn thứ hai bên trong.** Cùng ca trên: giữ accordion
  mà thêm `label="Gợi ý"` thì chữ "Gợi ý" hiện HAI LẦN (header card + trigger của item duy nhất),
  vì item accordion **buộc** phải có `title`.
- ⛔ **`title` của `SurfaceCardAccordionItem` là `string`, PLAIN TUYỆT ĐỐI.** Không markdown, không
  cả backtick. Neo 2026-07-30 round-2 (thầy chốt) — **đảo** quyết định 2026-07-29 vốn còn chừa
  ngoại lệ `parseInlineCode`. Icon màu riêng ra `titleStart`/`titleEnd`, vì icon nằm trong `title`
  bị ép theo `currentColor` (bắt được thật ở `ChallengeDeliverableList.tsx`: hàng failed làm cả
  "1. Viết API" đỏ theo icon).
- ⛔ **Khung LẶP nhận `items`, `children` BỊ CẤM** (luật KHUNG API, thầy 2026-07-25): áp cho
  `SurfaceCardList` · `SurfaceCardAccordion` · `SurfaceCardCrossList` · `SurfaceCardPressableGroup`
  · `SurfaceCardSelectableGroup`. `children` chỉ còn hợp pháp ở khung BỌC (`SurfaceCard`,
  `SurfaceCardNested`).
- ⛔ **Đừng nhét một block đã có mặt card riêng vào slot `content` của `SurfaceCardList`** — slot
  đã tự có `p-3` + hover + separator, thêm `rounded-3xl shadow-surface` là NHÂN ĐÔI chrome. Neo:
  `ContentPager`, `QaQuestionThread`.
- ⚠️ **Bẫy skeleton phải nhớ:** `isSkeleton` của `SurfaceCardList` **chỉ** chảy tới đường FIXED
  row; đường FREE-FORM (`item.content`) **bỏ qua hoàn toàn**. Đi đường `content` thì phải tự dựng
  mirror (neo: `ChallengeBrief.tsx:57` → `PlaygroundSetupSteps` nhân bản tiền lệ).
- ⚠️ `isSkeleton` của card **pressable** nghĩa khác card thường: pressable **thay hẳn** children
  bằng mirror tile generic; card thường chỉ shimmer phần frame tự vẽ (`label`/`description`).
- ⚠️ Comment cũ trong `blocks/` còn viết `SurfaceCard.Pressable`, `SurfaceCard.List`. Namespace đã
  **phẳng hết**; `.Pressable` XOÁ 2026-07-29 (thầy: *"sao còn .Pressable, thành isPressable là prop
  hết rồi mà?"*). Đọc comment thì hiểu ý, gõ code phải theo export thật.

---

## 2. Dòng và danh sách KHÔNG có mặt card — họ `List*`

`composites/lists/List/List.tsx`. Cùng hình với họ `SurfaceCard*` ở trên, khác **đúng một trục**:
có mặt `bg-surface` hay không.

| Tôi đang có | Chọn | Đường vào nội dung | Đừng chọn |
|---|---|---|---|
| ĐÚNG MỘT hàng kiểu GitHub, đặt vào khung tôi đã có | **`ListRow`** | props `leading`/`title`/`subtitle`/`meta`/`trailing` (+ `href`/`onPress`) | đừng `.map` nó N lần để giả list |
| Nhãn + MẢNG dòng ngắn (+ một nút), chỗ đặt ĐÃ có mặt bao ngoài | **`ListLabeled`** | `items[]` (= `ListRowProps` + `key`) + `label`/`icon`/`action`/`emptyState` | `SurfaceCardList` nếu cụm này cần mặt riêng |
| Vài mẩu meta trên MỘT dòng, nối bằng ` · ` | **`ListMeta`** | `chip?` + `items[]` — mỗi phần tử là một mẩu | đừng tự gõ `·` + `mx-1` ở call-site |
| Một hàng cài đặt: tên + giải thích + công tắc | **`ListToggleRow`** | props `label`/`description`/`checked`/`onCheckedChange` | `ListRow` nếu bên phải là chip/số/caret, không phải switch |
| Nội dung do MỘT NGƯỜI viết: avatar + dòng danh tính + thân/trả lời lồng | **`IdentityContentRow`** | `byline` (node) + `children` (node); `nested` vẽ đường dẫn thụt | đừng mong nó vẽ mặt card — muốn mặt thì bọc `SurfaceCard` |

### Vạch cấm của mục này

- ⛔ **Mảng dòng là DATA.** Có mặt card ⇒ `SurfaceCardList`. Không mặt card ⇒ `ListLabeled`. Không
  bao giờ là `.map(ListRow)` tay: `ListRow` là `py-2` không mặt, không separator full-bleed.
- ⛔ **Đừng hand-roll một hàng bấm bằng `<button>` + flex/icon/chevron.** Neo:
  `PersonalProjectTaskPage.tsx:88` ghi thẳng *"THE SETTINGS SUMMARY ROW REUSES `ListRow`, not a
  hand-rolled button"* — bản `src` tự dựng, và đó đúng là lỗi *"lấy atom trần thay cho composite hệ
  này đã sở hữu"*.
- ⛔ **Đừng tự dựng danh sách ✓/✗ bằng icon + `MarkdownContent` trong `StackH` rồi `.map`.** Neo
  ca chọn ĐÚNG, `MockInterviewScorecard.tsx:42`: *"`SurfaceCardCrossList` REPLACES A HAND-ROLLED
  ROW LIST"* — tự dựng là dựng lại đúng composite đã có, tới cả divider và số dòng skeleton.
- ⚠️ **Có HAI thứ tên `ListRow`**: export công khai ở `lists/List/List.tsx` (`py-2`, không mặt,
  `div role="button"`) và một component **nội bộ** cùng tên trong `SurfaceCard.tsx` dựng dòng của
  `SurfaceCardList` (`p-3`, separator full-bleed, `<button>` thật, có verdict/selected). Đừng lẫn.
- ⚠️ **`ListLabeled` có ZERO call-site thật** — mọi list có nhãn trong thực tế đều chọn
  `SurfaceCardList`. Đang định dùng `ListLabeled` thì kiểm lại: chỗ đó có mặt bao ngoài **thật**
  không?
- ⚠️ Bài học `IdentityContentRow` (thầy 2026-07-29, sửa **hai lần trong một ngày**): chốt đầu
  *"cả 3 seam đều tight"*, xem render thật rồi sửa avatar↔cột về `grouped`. **Một quyết định gap
  đưa ra trước khi thấy render là tạm thời** — đừng coi chốt đầu là chốt cuối chỉ vì nó dứt khoát.

---

## 3. Ẩn / hiện theo cú bấm — chọn theo SỐ VÙNG rồi mới đến CÓ BIÊN

Hai câu hỏi **độc lập**, hỏi theo thứ tự: **(1)** đếm số vùng gập. **(2)** có nền/viền/radius/đệm
bao ngoài không?

| Tôi đang có | Chọn | Đường vào nội dung | Đừng chọn |
|---|---|---|---|
| MỘT vùng gập, KHÔNG cần biên nào | **`Disclosure`** (`composites/layout/Disclosure`) | `title` (nhãn trigger inline) + `body` / `children` | `SurfaceCardAccordion` — nó là mặt card thật, một item thì nhãn nói hai lần |
| ≥2 vùng đồng dạng, CÓ mặt card | **`SurfaceCardAccordion`** | `items[]` + `label`/`description`/`emptyState` | `Disclosure` — nó không lặp, không có `items` |
| ≥2 vùng đồng dạng, KHÔNG cần mặt card | **`Accordion`** (atom, `atoms/navigation/Accordion`) | `items[]` — `key`/`title`/`content` | `SurfaceCardAccordion` nếu không muốn surface |
| Bấm vào để mở panel **BÊN NGOÀI**, không phải vùng inline | **`ListRow`** (hàng bấm) + **`DrawerShell`** | `ListRow` trailing caret; nội dung trong drawer | `Disclosure` — source nêu tên `TaskSubmissionPanel` là đúng ca này |

### Vạch cấm của mục này

- ⛔ **Đừng lồng `SurfaceCardAccordion` vào chính nó chỉ để có một trigger.** Neo 2026-07-30
  round-4→5: làm vậy ra hai lớp card lồng nhau, thầy bắt *"phản hồi không render dạng card được
  không?"* — đúng ca là `Disclosure`.
- ⛔ **Đừng dựng lại `Disclosure` từ HeroUI headless `Disclosure` compound.** Compound đó mặc định
  trigger `justify-between` + caret ĐUÔI; hình nhà là caret ĐẦU + hug-width. Cố ý hand-roll, ghi rõ
  trong file.
- 📌 **`Disclosure` là quyết định TRÌNH BÀY, không phải field bịa.** Neo
  `ChallengeDeliverableList.tsx:296` (thầy chốt round-10, giữ qua round-13): nội dung bên trong vẫn
  đúng một field thật (`shortFeedback`), chỉ nằm sau một cú bấm vì nó là chi tiết phụ. Đường tới
  hình này là một chuỗi **bỏ**: bỏ danh sách finding từng dòng (đo DB thật: một attempt tới TÁM
  finding × 3 field ⇒ chôn form nộp bài dưới hai chục dòng), bỏ accordion đệ quy + severity
  chữ-màu (round 4-7, *"dựng khi chưa có neo thật"*).
- ⚠️ `SurfaceCardAccordion` mở/đóng theo **MỘT identity nhóm**, không phải N panel tự trị. Cần mỗi
  panel một diff hai chiều riêng thì đó là ca khác (`MockInterviewScorecard` đã cắt scope đúng vì
  lý do này, không phải vì dùng sai).

---

## 4. Chữ — BA BẬC theo HÌNH CHUỖI, không theo độ dài

Ranh giới cứng ở bậc 2↔3 là **block-level**: `MarkdownContent` phát markup block và tự cầm nhịp dọc
nên **không nest hợp pháp** trong `<button>`/trigger/nhãn inline; `RichText` phát inline nên nest
được ở đâu cũng được.

| Tôi đang có | Chọn | Đường vào nội dung | Đừng chọn |
|---|---|---|---|
| Chuỗi PLAIN, không marker nào | **`Typography`** (atom) | `text` (ReactNode) — **không phải children** | `RichText` — thêm một lớp parse vô nghĩa |
| Chuỗi có thể lẫn backtick, mà BUỘC phải ở lại inline (trong `<button>`, trigger) | **`Typography`** + `parseInlineCode` | `text` | `MarkdownContent` — block-level trong `<button>` là HTML không hợp lệ |
| Chuỗi mang TẬP MARKER NHỎ đóng: `code` · **bold** · _italic_ · `[link]()` · `\n` | **`RichText`** (`composites/viewers`) | `text: string` + `size`/`color` | `MarkdownContent` — chuỗi này không có block nào |
| Chuỗi là TÀI LIỆU: heading · bullet · bảng · fence · directive nhà | **`MarkdownContent`** | `source: string` + `measure: reading\|compact` | `RichText` — nó không phát block-level |
| Field schema khai kiểu **"text"** mà tác giả gõ lẫn marker | **`stripMarkdown`** (`atoms/text/_markdown.ts`) rồi đưa vào `Typography` | tham số `markdown: string` → `string` | đừng "làm sạch" rồi vẫn định hiện định dạng — nó XOÁ, không đổi |
| CẶP (hoặc ba) dòng chữ đọc như MỘT ý: tiêu đề + phụ đề (+ hint) | **`TitledText`** (`composites/text`) | props `title`/`subtitle`/`hint` + `size: row\|header\|stat` | đừng tự xếp hai ba `Typography` cạnh nhau |
| MỘT dòng NGANG: icon dẫn + nhãn, CÙNG một tone | **`InlineIconLabel`** (`composites/text`) | `icon` (node **trần**) + `children` + `tone`/`size` | `Chip` nếu giá trị thuộc tập ĐÓNG; `TitledText` nếu trục DỌC |
| MỘT con số + đơn vị ở slot trailing: "N điểm" | **`ScoreValue`** (`composites/text`) | `points: number` (+ `unit`) | ⛔ **KHÔNG BAO GIỜ** `Chip` |

### Vạch cấm của mục này

- ⛔ **Field TITLE/HEADLINE luôn ở bậc 1.** Tối đa là backtick qua `parseInlineCode`, **không bao
  giờ** bold/italic/link. Thầy chốt 2026-07-29, SSOT là `.artifacts/decompose/markdown-tier-rules.html`
  (*"chỉ chấp nhận markdown ở bài viết và richtext là text nhỏ thôi"*). Doc của `RichText.tsx:145`
  đã bị sửa để bỏ chữ "titles" khỏi ví dụ dùng.
  **Phép thử:** xoá hết định dạng mà người đọc vẫn nhận ra "đang xem cái gì" ⇒ là title; nếu định
  dạng **MANG** thông tin ⇒ là richtext nhỏ.
- ⛔ **KIỂU DỮ LIỆU PHẢI KHỚP Ý ĐỊNH.** Một prop tên `title` khai `ReactNode` là đang **mời** caller
  nhét markdown/JSX. Neo 2026-07-29: `SurfaceCardAccordionItem.title` siết `ReactNode → string` +
  thêm `titleStart`. Quét ra 4 vi phạm, 2 ngoài dự kiến; nặng nhất `SubmissionFindingsList.tsx`
  render **full `MarkdownContent` ngay trong trigger `<button>`**.
- ⛔ **`ScoreValue` không bao giờ là `Chip`.** Chip là viên pill cho giá trị thuộc **tập ĐÓNG**;
  điểm rubric là số vô hướng tự do, không phân loại gì cả ⇒ là CHỮ. Neo 2026-07-29: cùng info-type
  "N điểm" từng render Chip ở `ChallengeBrief`/`TaskBriefBody`/`PersonalProjectTaskPage` nhưng chữ
  trần ở `ChallengeDeliverableList` — một info-type, hai element. Vòng hai 2026-07-30: gỡ luôn
  `color="accent"`, đối chứng `ChallengeHeader` giữ muted với lý lẽ *"một con số thô không phải một
  fact phân loại"*.
- ⛔ **"text" vs "body" là ranh giới CỐ Ý ở tầng content, không phải chi tiết.** Neo 2026-07-30
  round-3 · `ChallengeBrief.tsx:190` (thầy chốt): `prerequisites`/`outputs` **đảo** từ markdown về
  plain, huỷ quyết định round-2 vốn khớp `src/ChallengeView`. Lý do đo được: backend
  content-authoring schema đặt tên field khác hẳn — `outputs`/`prerequisites` chỉ `lang` + **TEXT**,
  còn `requirements`/`steps` là `lang` + `title` + **BODY**. Chặn bằng `stripMarkdown` ngay biên
  render, vì tác giả vẫn gõ backtick theo thói quen.
- ⛔ **Đừng truyền JSX vào prop `icon`/`prefixIcon` của atom** — nhận **COMPONENT REF**
  (`icon={TrayIcon}`), atom tự ép scale + weight. Và `InlineIconLabel` nhận icon **trần**, call-site
  không được tự set size (§5 icon-ownership).
- ⛔ **Đừng bọc `Typography` bên trong thứ đã tự bọc chữ.** `InlineIconLabel` luôn tự bọc child vào
  `HeroTypography` ⇒ lồng link `Typography` vào là text-trong-text (neo `ProfileHero.tsx:70`: social
  link đi `Typography isLink`, chỉ hai hàng meta không-link mới dùng `InlineIconLabel`). HeroUI
  `Radio.Content` thì **throw**.
- ⚠️ `Typography`: nhánh `isSkeleton` phải check **TRƯỚC** mọi nhánh `size`, không thì
  `size="h3" isSkeleton` render heading RỖNG — bug im lặng, `tsc`/eslint không bắt.
- ⚠️ `Typography` phải TỰ SỞ HỮU giá trị của mình để phòng vệ (AUDIT 2026-07-30 round-1/3/6):
  `weight` rơi về `font-normal` **tường minh** (vì `.accordion__trigger { font-medium }` của HeroUI
  rỉ vào, đo được 500 trên DOM), và mọi nhánh đọc `COLOR_CLS[color ?? "default"]` (vì
  `.accordion__body-inner { color: var(--muted) }` rỉ qua khe không khai màu).
- ⚠️ `MarkdownContent` **CHƯA port**: `arcSections`, chế độ `plain` ("render thô"), fence ```` ```mdx ````
  live-render, fence ```` ```layout ````. Đang cần một trong bốn thì **đừng chọn nó rồi tưởng là có** —
  mọi cổng ở đây đều sẽ cho qua.

---

## 5. Payload do TÁC GIẢ soạn hoặc do DỮ LIỆU quyết — viewer

Điểm chung: **hình do payload quyết định**, component không biết trước.

| Tôi đang có | Chọn | Đường vào nội dung | Đừng chọn |
|---|---|---|---|
| Một chuỗi markdown đủ khối (kể cả khi chỉ có một fence lệnh) | **`MarkdownContent`** | `source: string` + `measure` | đừng dựng `<pre>` tay — fence ```` ```bash ```` đã tự có nút copy + chrome mono |
| Một khối code **không** đến từ markdown (API trả về, snippet dựng tay) | **`CodeToHtml`** | `code` + `language` + `theme` | đừng gọi khi code nằm trong fence — `map.tsx` đã dispatch |
| HAI node đã render sẵn: một demo + một source, lật qua lại | **`CodePreviewTabs`** | `preview` + `code` (ReactNode) | đừng gọi khi chỉ có chuỗi markdown chứa `:::tab` |
| Một sơ đồ mermaid dạng VĂN BẢN, đứng riêng | **`MermaidDiagram`** | `code: string` + nhãn UI truyền qua prop | đừng gọi khi mermaid nằm trong tài liệu — đã tự dispatch, gọi tay là nhân đôi |
| DỮ LIỆU graph có sẵn node/edge, cần kéo-zoom | **`FlowDiagram`** | `nodes[]` + `edges[]`; node dùng `FLOW_DIAGRAM_CARD_NODE_TYPE` | `MermaidDiagram` — nó nhận VĂN BẢN, ra SVG tĩnh |
| Đường dẫn tới một file PDF, xem ngay trong trang | **`PDFView`** | `src` + `title` | `MarkdownContent` — đây là file nhị phân, không phải nội dung chữ |

### Vạch cấm của mục này

- ⛔ **`map.tsx` là chỗ DUY NHẤT trong cả bản vẽ mà spacing viết tay là ĐÚNG.** Viewer không bao giờ
  thấy con nó như một node (chỉ thấy cái parser trả về) nên **không có seam cho frame sở hữu** —
  cùng miễn trừ §13z dành cho tầng atom, cùng một lý do.
- ⛔ **Glue của parser KHÔNG phải cửa của người dựng màn:** `buildMarkdownRenderers` · `TabsBlock` ·
  `TabPane` · `MarkdownTable` · `MarkdownTableHead`/`Body`/`Row`/`Column` ·
  `flattenMarkdownTableHeaderChildren` · `isMarkdownHeaderTableRowNode`. Chỉ chạm khi đang **sửa
  ngữ pháp markdown**. Bảng DỮ LIỆU thật của tôi ⇒ mục 8 (`Table`).
- ⛔ **Đừng tự dựng `ReactMarkdown` song song với một map riêng** — sẽ chẻ ngữ pháp thành hai bản.
- ⚠️ **Skeleton hai lớp, đừng lẫn:** `isSkeleton` nghĩa là *"cả payload chưa về"* (shimmer toàn
  footprint, không mount runtime nặng). Khác hẳn shimmer từng phần bên trong (một trang PDF chưa
  lăn tới, một khối code chưa highlight).
- ⚠️ `MarkdownContent` chỉ có `isSkeleton` **từ 2026-07-29**; trước đó call-site tự fake bằng một
  `Typography isSkeleton` không liên quan. `TabsExtended` thì **không bao giờ** có ⇒
  `PlaygroundSetupSteps` phải tự dựng mirror riêng, và **cố ý không mượn** `data-anat-part` của
  phần thật (mượn là một link gãy trong anatomy panel).
- ⚠️ Vận hành: `PDFView` nạp worker pdf.js từ CDN unpkg ⇒ canvas cần MẠNG trong Storybook (chỉ story
  `src=""` chạy offline). `MermaidDiagram`/`CodeToHtml` nhận nhãn UI qua **prop** vì tầng này không
  có runtime i18n.

---

## 6. Nhãn phân loại · chip · token — bốn cửa theo HÌNH DỮ LIỆU

| Tôi đang có | Chọn | Đường vào nội dung | Đừng chọn |
|---|---|---|---|
| MỘT nhãn ngắn giá trị TỰ DO (một tag lẻ, một chip chấm màu) | **`Chip`** (atom, `atoms/chips/Chip/ChipBase.tsx`) | `text` (BẮT BUỘC, cấm children) + `icon` (component ref) hoặc `dotColor`/`dotClassName` | `EnumChip` nếu có bảng map |
| N nhãn ĐỒNG CẤP, đồng tone, cần cắt tràn `+N` | **`ChipGroup`** (atom) | `items[]` (`key`/`text`) + `maxVisible` + `tone` **chung cả hàng** | đừng dùng nếu mỗi nhãn một tone — hàng cầu vồng |
| MỘT giá trị thuộc TẬP ĐÓNG + bảng map value→màu/nhãn | **`EnumChip`** (composite) | `value` + `map` (thiếu entry thì **THROW**, không im lặng) | `Chip` — map ở đâu thì luật màu ở đó |
| MỘT con số + đơn vị in TRONG CÙNG viên ("24 Module") | **`HighlightChip`** | `value` + `label` (+ `icon`) | `Chip` — nó chỉ nhận một `text` |
| MỘT item ĐÃ CHỌN, hàng viền cả bề ngang, có nút Change / × | **`RemovableToken`** | `label` + `icon` (trần) + `onEdit`/`onRemove` | `Chip` + `onRemove` — cái đó là viên 24px, dùng ở đây thổi bay hàng |
| Một scalar/đếm thuần ("482 học viên") | **muted text** (`Typography`) | — | ⛔ KHÔNG chip, KHÔNG icon (README atom §1) |

### Vạch cấm của mục này

- ⛔ **`EnumChip.icon` là selector chuỗi đóng `"check" \| "cross"`, KHÔNG phải icon reference.** Neo
  2026-07-30 round-2 (thầy chốt): thêm icon per-entry nhưng thêm theo cách **SIẾT** —
  *"thu hẹp vào một tập đã tuyển mới là toàn bộ ý nghĩa của ký hiệu quốc dân"*. Mở union ra khi có
  ký hiệu **THỨ BA** đủ chuẩn, đừng nới kiểu.
- ⛔ **Đừng đặt hai chip cạnh nhau nói về CÙNG MỘT fact.** Verdict đã có tone + icon của callout thì
  chip thứ hai là hai tín hiệu tranh nhau — cho chip nói một fact **KHÁC**.
- ⛔ **Đừng truyền `size` cho `Chip`** — một cỡ duy nhất, cỡ gốc HeroUI. §4a cấm hạ nấc để chữa
  hình ở một call-site (neo: đã lỡ hạ `md→sm` + `px-2` vì chip trong `PriceTag` trông to).
- ⛔ **Chip DESIGN không được fold vào đây:** `DifficultyChip` · `AiCategoryChip` · `LanguageChip` ·
  `HostPlatformChip` ở tầng trên, không phải thành viên họ chip hệ.
- ⚠️ **Từ vựng màu là ALIAS, không khai lại:** `EnumChipColor` = `ChipTone`, `HighlightChipTone` =
  `ChipTone` (thầy chốt 2026-07-29 — trước đó phải có `COLOR_TO_TONE` dịch giữa hai bản copy tay,
  thành alias thì phép dịch là no-op nên XOÁ). ⚠️ Nhưng `ChipTone` **TÁCH khỏi** `AlertStatus`
  2026-07-30 round-9, vì `AlertStatus` thêm `"info"` mà `HeroChip.color` không có ⇒ chip còn 5 giá
  trị, **không có `info`**.
- ⚠️ Tên gốc là tên file + tên story riêng (`EnumChip`/`HighlightChip`/`RemovableToken`); alias
  `ChipEnum`/`ChipHighlight`/`ChipRemovable` chỉ tồn tại trong gallery gộp.
- ⚠️ `StatusChip` và `Chip.Dot` đã **XOÁ** 2026-07-26 (chấm thành prop `dotColor`; `StatusChip` chỉ
  khoá cứng `tone`, không thêm hành vi nào).

---

## 7. Số đo — thanh · vòng · ô số liệu

Chọn thanh bằng đúng một câu: **"có mấy TỔNG?"** Chọn ô số bằng: **"ai cấp bề mặt + ô chứa gì?"**

| Tôi đang có | Chọn | Đường vào nội dung | Đừng chọn |
|---|---|---|---|
| MỘT tỉ lệ trên MỘT tổng, đọc theo hàng ngang mảnh | **`ProgressMeter`** (`composites/stats`) | `value` (+ `max`, `label`, `showValue`, `target`) | `SegmentBar` — đó là nhiều thành phần |
| Cùng tỉ lệ đó nhưng cần là khối TIÊU ĐIỂM tròn có số giữa | **`ProgressRing`** | `value` (+ `label`, `caption`, `size`) | `ProgressMeter` — khác **chỗ đặt**, không khác dữ liệu |
| NHIỀU hạng mục CÙNG đơn vị chia CHUNG một tổng | **`SegmentBar`** | `segments[]` + `ariaLabel` **bắt buộc** | `CourseProgressBar` — làn bằng nhau sẽ nói dối về cơ cấu |
| NHIỀU chiều, mỗi chiều có TỔNG RIÊNG, đơn vị khác thang | **`CourseProgressBar`** | `dims[]` (`completed`/`total`) + `ariaLabel` | `SegmentBar` — JSDoc ghi thẳng *"Deliberately NOT SegmentBar"* |
| Bảng giải nghĩa màu, hình mang màu ở CHỖ KHÁC | **`Legend`** | `items[]` (`label`/`color`/`suffix`) | đừng thêm khi đã dùng SegmentBar/CourseProgressBar — chúng TỰ render Legend |
| Một cặp số + nhãn, chỗ đặt ĐÃ có bề mặt | **`StatPair`** | `value` + `label` + `valueType` | `MetricCard` — khung lồng khung |
| MỘT chỉ số đứng một mình, cần khung thẻ riêng | **`MetricCard`** | `value` + `label` (+ `hint`) | đừng xếp N cái cạnh nhau để làm một dải |
| 3-4 số ĐỒNG CẤP đọc thành MỘT dải liền | **`StatRibbon`** | `items[]` khoá cứng `{value,label}` | `StatGridCard` nếu mọi ô đúng là cặp số-nhãn |
| NHIỀU ô, mỗi ô phức tạp hơn cặp số-nhãn (icon + meter + nhiều dòng) | **`StatGridCard`** | `items[]` với `content: ReactNode` **tự do** | `StatRibbon` — `items` ở đó khoá cứng |
| Một việc ĐANG CHẠY, biết hoặc không biết tỉ lệ | **`ProgressBar`** / **`ProgressCircle`** (atom) | `value` + `max` + `isIndeterminate` | `ProgressGauge` — nó không có indeterminate |
| MỘT MỨC ĐO tĩnh luôn xác định (dung lượng, pin, điểm) | **`ProgressGauge`** (atom) | `value` + `max` | `ProgressBar` — chọn sai làm screen-reader đọc sai vai (meter vs progressbar) |

### Vạch cấm của mục này

- ⛔ **Bề rộng của `SegmentBar` là tỉ lệ THẬT** (`flexGrow: value`, `flexBasis: 0`) — cam kết trong
  source: *"không bao giờ relative-to-max"*. Các lát dính SÁT nhau không gap để bar đọc thành MỘT
  đường.
- ⛔ **Đừng nhân đôi Legend.** `SegmentBar` và `CourseProgressBar` tự render `Legend` bên dưới (tắt
  bằng `hideLegend`). `Legend` cũng **không phải** `ChipGroup`: chấm màu + chữ nhạt giải nghĩa MÀU,
  không phải hàng token pill.
- 📌 **Vạch target = `h-1 bg-muted rounded-none` FLUSH track, nhãn DÍNH thẳng không offset.** Neo
  2026-07-30 round-14 (thầy: *"anchor hơi dài, màu không make sense"*, *"rounded-none nhé"*,
  *"offset chi ông? không offset"*). Trước là `h-5 w-1 bg-accent` — cao gấp 5 lần thứ nó đánh dấu,
  và CÙNG tone với fill nên một màu tải hai nghĩa ("đạt được" vs "cần đạt"). `bg-muted` cố ý nằm
  ngoài tập danger/warning/success để **fill một mình** trả lời "đậu hay không".
- ⚠️ `ProgressMeterTargetMark` gần như **không gọi trực tiếp** — `ProgressMeter` tự dựng khi truyền
  `target`. Nó `absolute` neo theo containing block của thanh, đứng một mình sẽ trôi.
- ⚠️ **Skeleton là một trục riêng, không phải variant:** mọi thứ ở mục này (trừ `StatGridCard` và
  `ProgressMeterTargetMark`) dùng union `{ isSkeleton: true; data? } | { isSkeleton?: false; data }`
  ⇒ dựng trạng thái nghỉ thì **không cần bịa dữ liệu giả**. Hai ngoại lệ đó caller phải tự lo.
- ⚠️ `StatPair` **không có** `isSkeleton` riêng ⇒ neo `ProfileFollowers`: block **từ chối** StatPair
  để đi thẳng `Typography` (`size="h5" tabularNums` + `size="xs"` muted), vì nếu không sẽ phải tự
  dựng mirror ngay cạnh nó — hai hình cho một con số.

---

## 8. Cặp nhãn–giá trị và bảng

| Tôi đang có | Chọn | Đường vào nội dung | Đừng chọn |
|---|---|---|---|
| ĐÚNG MỘT dòng "một tên, một số" (hoặc một hàng TỔNG đứng riêng) | **`KeyValueRow`** (`composites/data/KeyValue`) | `label` + `value` (+ `hint`, `emphasis`, `divider`) | đừng `.map` nó thành N dòng |
| NHIỀU dòng "một tên, một số" cùng kiểu | **`KeyValueList`** | `items[]` + `gap` (`SeamScale`) + `divider` | `Table` — `columns` + header là thừa cho hai cột |
| N bản ghi, mỗi bản ghi ≥3 trường cần THẲNG CỘT | **`Table`** (`composites/data/Table`) | `columns[]` + `items[]` + `ariaLabel` **bắt buộc** | `KeyValueList` — nó không có cột/header |

### Vạch cấm của mục này

- ⛔ **COMPOSITE API LAW, ghi trong file:** composite **KHÔNG format** tiền/ngày/đơn vị/trạng thái —
  consumer truyền node **đã format** (`"1,200,000 ₫"`, `<Chip/>`). Composite cũng **KHÔNG tự tính
  tổng**; `emphasis` chỉ là STRESS thị giác. Và `Table` **KHÔNG** sort/filter/paginate/select.
- ⛔ **`ariaLabel` của `Table` là BẮT BUỘC** vì react-aria `Table` không có nhãn ngầm — thiếu thì cả
  bảng đọc lên vô danh, và `tsc`/eslint **KHÔNG bắt**.
- ⚠️ §10a *"một seam, một chủ"*: `KeyValueList` sở hữu quyết định vạch — hàng CUỐI không vạch
  (`index < items.length - 1`), khoảng trên/dưới vạch dùng chung `gap` của list.
- ⚠️ Bẫy canh lề `Table`: `text-right` phải đặt trên SPAN BỌC (`CellBox`), không trên `<th>/<td>` —
  CSS HeroUI `.table__column { text-align: left }` là **un-layered** nên thắng utility Tailwind v4
  trong `@layer utilities`.

---

## 9. Khung và nhịp — `frames/`

Trục là thứ tôi chọn, không phải thứ component đoán. Chi tiết cây quyết định:
[`principles/frame/context.md`](principles/frame/context.md).

| Tôi đang có | Chọn | Đường vào nội dung | Đừng chọn |
|---|---|---|---|
| Mấy khối KHÁC KIỂU xếp DỌC | **`StackV`** | `children`; `gap` **BẮT BUỘC** | `Flex direction="col"` — StackV đã forward `padding` và `as` |
| Mấy thứ KHÁC KIỂU trên MỘT hàng | **`StackH`** | `children` (+ `wrap`) | `Cluster` nếu là N phần tử cùng kiểu |
| MẢNG phần tử NHỎ CÙNG KIỂU, tự wrap (chip, tag, dãy nút) | **`Cluster`** | `items[]` (`key`/`content`); `separator` bật dấu `·` | `StackH` — phép thử §13b, không chọn bằng mắt |
| MẢNG ô ĐỒNG DẠNG chia theo SỐ CỘT theo bậc container | **`Grid`** | `items[]` (+ `span?: 1\|2`); `columns` **BẮT BUỘC** | `Cluster` nếu ô giữ bề ngang nội tại |
| Hàng cần ĐỔI KIỂU DISPLAY theo bậc (grid hẹp → flex chia đều rộng) | **`ResponsiveRow`** | `items[]` + `columns` (cap `1\|2`) + `at` | `Grid` — display cố định, không chia đều được |
| ĐÚNG HAI BÊN CÓ TÊN: dẫn ↔ theo sau | **`Split`** | slot `start` / `end` (không children) | `StackH justify="between"` — chỉ giống về MẮT |
| HAI VÙNG CỠ TRANG: cột đọc + rail DÍNH 360px từ `@app-xl` | **`SplitWorkspace`** | slot `main` / `aside` | `StackH wrap` + hai `StackV` — cách giả đó là BUG đã ghi trong file |
| Một vùng cần GIỚI HẠN BỀ NGANG đọc được | **`Container`** | slot `body` (`children` là shorthand) | `StackV` — nó không có `max-w`/`mx-auto` |
| Hộp flex nội bộ tầng frame | **`Flex`** | — | ⛔ **KHÔNG BAO GIỜ** gọi từ ngoài `components/frames/` |
| Đang khai `gap` | **`SeamScale`** | `flush` · `tight` · `related` · `grouped` · `section` · `page` (+ `baseline`) | đừng gõ `gap-4`/`gap-5`/`gap-1.5` — không typed được |
| Đang khai `padding` | **`InsetScale`** | `flush` · `snug` · `cozy` · `roomy` · `airy` | đừng dùng từ của `SeamScale` cho padding, và ngược lại |

**Hợp đồng nội dung theo §13b, quy luật rõ:** khung **BỌC** nội dung tự do ⇒ `children`
(`StackV`/`StackH`/`Container`/`Flex`). Khung **LẶP** danh sách ⇒ `items` DATA, `children` **BỊ
CẤM** (`Cluster`/`Grid`/`ResponsiveRow`). Khung có **NHIỀU VAI** ⇒ slot **CÓ TÊN**, không children
(`Split` start/end · `SplitWorkspace` main/aside).

### Vạch cấm của mục này

- ⛔ **`Flex` là NƠI DUY NHẤT trong cả bản vẽ được viết `flex` · `flex-col` · `flex-wrap` ·
  `items-*` · `justify-*` · `gap-*`.** Và chính nó thì **INTERNAL tầng frame**: source ghi *"nothing
  outside `components/frames/` may call it"*, còn export chỉ vì `Stack.tsx` import (đã verify: đúng
  MỘT import, `Stack.tsx:6`). Suy ra tầng composite/block/layout/page **không hand-write flex/gap
  nào và cũng không gọi `Flex`** — chỉ `StackV`/`StackH`. Lý do ghi trong source: *"A public frame
  that can do everything the constrained one can is not a second option, it is the way the
  constraint gets bypassed."*
- ⛔ **Container query, KHÔNG phải viewport.** Mọi bậc đáp ứng dùng `@app-sm/md/lg/xl` vì app shell
  là split và rail AI dock vào có thể bóp cột. ⚠️ `@sm`/`@md`/`@lg` built-in Tailwind là thang
  **KHÁC, NỬA CỠ** (`@sm`=24rem vs `@app-sm`=40rem) — dùng nhầm là **âm thầm halve mọi
  breakpoint**. `Container` là khung DUY NHẤT mở `@container`; `Grid` cố ý **không** mở.
- ⛔ **Đừng đổi `max-w-app-*` thành `max-w-3xl`/`5xl` cho "gọn"** — trùng số hôm nay nhưng KHÁC
  NGUỒN; token đổi là khổ và breakpoint lệch nhau âm thầm, không lỗi nào bắt.
- ⛔ **Đừng cố nhét cái thứ ba vào `Split`** — hai slot có tên tồn tại để **đóng lại** câu hỏi "con
  nào đi đâu". Neo đo: hàng này xuất hiện **43×** khắp app; `min-w-0` cho start và `shrink-0` cho
  end được áp ở MỘT chỗ thay vì 43 call-site.
- ⛔ **`SplitWorkspace` sở hữu CỨNG mọi số đo** (`gap-6/8`, `w-[360px]`, `top-24`,
  `max-h-[calc(100dvh-7rem)]`) — y hệt ở cả hai nguồn `src`. Chỉ thêm prop khi có người dùng thật
  **THỨ BA** không đồng ý một con số. Neo thầy 2026-07-29 (*"desktop là phải render flex chứ
  nhỉ?"*): `main` có `min-w-0 flex-1` nên hàng giả bằng `StackH wrap` **gần như không bao giờ wrap
  thật** ⇒ split render side-by-side ở MỌI bề rộng, mobile luôn.
- ⛔ **Đừng để con tự mang margin.** §10a: khe có ĐÚNG MỘT chủ, và chủ là CHA. Neo: `mx-1` gõ tay
  cạnh dấu `·` bị cổng `check-padding` bắt 2026-07-27 — khoảng thở của `·` đến từ khoảng trắng của
  CHÍNH CHUỖI.
- 📌 **Cơ chế thực thi, đây là lý do duy nhất frame sở hữu `gap`:** `gap`/`padding` là union literal
  và `gap` luôn REQUIRED ⇒ off-scale là **lỗi `tsc` tại call-site**, không phải finding sau review.
  Thầy 2026-07-27: *"the caller picks a variant, not a step"* — 72% call-site nằm đúng hai bậc khó
  phân biệt nhất (50 chỗ `3`, 43 chỗ `2`); **số** cho tác giả chọn cái TRÔNG đúng và lý lẽ không bao
  giờ vào tới code, **từ** thì buộc phải trả lời.
- ⚠️ Ca dễ lẫn nhất `related` ↔ `grouped`: đổi chỗ hai cái mà nghĩa không đổi ⇒ peers ⇒ `related`.
  Thứ tự mang nghĩa, hoặc mỗi dòng một loại khác nhau ⇒ dòng của một mặt ⇒ `grouped`.
- ⚠️ Bài học `snug` (`_spacing.ts`): lần đếm đầu chỉ soi **prop** `padding` nên kết luận "không ai
  dùng `p-2`" và thang ship 4 bậc — nhưng 34 call-site thật viết `p-2` bằng **class** và vượt qua
  đúng cái cổng dựng ra để loại nó. **Một phép đếm chỉ phủ MỘT cách viết sẽ đếm thiếu, và thang rút
  từ nó thừa hưởng điểm mù; một cổng đối chiếu SAI THANG còn tệ hơn không có cổng, vì im lặng đọc
  thành đồng ý.**

---

## 10. Trang · vùng · overlay

| Tôi đang có | Chọn | Đường vào nội dung | Đừng chọn |
|---|---|---|---|
| Mở đầu một ROUTE: breadcrumb · tên trang · mô tả · nút phải · dải meta | **`PageHeader`** (`composites/layout/Page`) | `breadcrumb`/`title`/`description`/`actions`/`meta` + `size: page\|compact` | `SectionHeader` — nó không có breadcrumb/meta |
| Tiêu đề một VÙNG bên trong trang, cần tụt bậc khi lồng | **`SectionHeader`** (`composites/layout/Section`) | `eyebrow`/`title`/`description`/`action` + `level: 1\|2\|3` | `PageHeader` — đếm số cái trên một trang |
| "Một tiêu đề vùng + một khối nội dung (+ dòng đóng)" xếp dọc một nhịp | **`Section`** | `header` (props HOẶC node) · `body` · `footer` · `gap` | `SectionCard` nếu cần MẶT có biên — Section là khung QUANH mặt |
| Hàng CTA ghim cứng đáy VIEWPORT | **`PageBottomBar`** | `body` (dẫn đầu, thường là giá) + `actions` | `footer` của shell — cái đó neo vào hộp thoại |
| Luồng ngắn tự chứa cần chặn màn, bề rộng theo `size` | **`ModalShell`** | `title`+`description` HOẶC `header` (node) · `body` · `footer` | `DrawerShell` — nó có `placement`, không có `size` |
| Panel DÀI trượt vào từ MÉP màn | **`DrawerShell`** | như trên + `placement` + `contentClassName` | `ModalShell` — drawer full-bleed dọc mép |
| Nội dung đúng bằng "một câu hỏi + hệ quả + hai nút" | **`FeedbackConfirm`** (`composites/feedback`) | `title`/`description`/`confirmLabel`/`cancelLabel`/`tone`/`isConfirming` | `ModalShell` — nhưng thêm BẤT CỨ GÌ ngoài ba thứ đó thì đổi sang ModalShell |

Hàng nhãn phía trên một card đã là prop của khung (`label`/`labelEnd`/`onSeeMore`/`action` —
`SurfaceCard`/`SurfaceCardList`/`SurfaceCardAccordion` đều `extends SurfaceLabelProps`).
`SurfaceCardHeader` gần như **không gọi trực tiếp**.

### Vạch cấm của mục này

- ⛔ **Đừng hand-roll `<div className="flex justify-end gap-2">` trong `body` của Modal/Drawer** —
  đó chính là `footer`, và `Modal.Footer`/`Drawer.Footer` đã tự `justify-end gap-2`. Truyền nút
  **TRẦN**.
- ⛔ **CHA GIỮ NHỊP** (thầy chốt 2026-07-27): `gap-3` trên `Modal.Dialog` quyết seam, con chỉ
  `mt-0!` để **TẮT** margin HeroUI ship sẵn. MỘT seam, MỘT chủ (§10a).
- ⛔ **KHUNG KHÔNG ĐƯỢC HỎI NỘI DUNG BÊN TRONG NÓ LÀ LOẠI GÌ.** Neo cùng lượt: prop
  `bodyStartsWithTabs` bị **XOÁ** — nó bắt caller khai *"body của tôi mở đầu bằng tabs"* để khung
  trừ 4px; 4px đó là hình học của `Tabs`, phải do chính `Tabs` lo (§13z).
- ⛔ **Đừng tự dựng node `header` cho `Section`/`SectionHeader` khi chỉ có title/description/action**
  — truyền PROPS để frame tự dựng. Node là **cửa thoát** cho header lạ (một hàng toolbar), không
  phải đường chính.
- ⛔ **Đừng chờ `FeedbackConfirm` tự đóng sau confirm** — caller phải gọi `onOpenChange(false)` khi
  hành động resolve. Và nó **không mở `children`**: không có cửa nào nhét thêm nội dung.
- ⚠️ `PageHeader.anatPart` tồn tại để **CHA gọi tên nó như MỘT node** (§11a.1) — thiếu prop này thì
  cha buộc phải chuyền `showAnatomy` xuống, mở ruột con và làm cháu lọt ra như thể là em ruột. Đó là
  **GỐC** của cả một lớp bug, không phải triệu chứng (deep-scan 2026-07-27).
- ⚠️ Bug thật đã fix bằng HAI LỚP div (thầy 2026-07-29): `@container` đo **content-box của chính
  nó, TRỪ padding của chính nó** ⇒ đặt `p-*` cùng div với `@container` là âm thầm bóp bề rộng đo
  được; ở `size="xl"` cap trùng đúng token nên `@app-xl` **không bao giờ cháy**, xác nhận live:
  `SplitWorkspace` trong `Container size="xl"` kẹt `flex-col` ở cửa sổ 1920px. Nay div NGOÀI giữ
  `@container` + `max-w` (không padding), div TRONG giữ padding.
- ⚠️ `Page.Container` đã chuyển sang `frames/Container/Container` từ 2026-07-26 (§13c: frame trùng
  thì xoá — bản cũ chỉ có padding phải, không `mx-auto`/`max-w`). `Section` slot `header`/`footer`
  của `Container` cũng đã XOÁ 2026-07-27 vì là bản sao yếu của `StackV`; cặp đúng là
  **`Container` > `StackV`**.

---

## 11. Async · thông báo · hố trống

Hai câu hỏi: **(1)** hình CHỖ ĐẶT — dải trong một mặt, hay hố canh giữa? **(2)** ĐỘ CAO — đây là
async region hay không?

| Tôi đang có | Chọn | Đường vào nội dung | Đừng chọn |
|---|---|---|---|
| Một vùng nạp dữ liệu cần đủ bốn ngả ở MỘT chỗ, và tôi ở tầng **BLOCK** | **`AsyncContent`** (`composites/async`) | `content` (`children`) · `skeleton` (node) · `emptyContent`/`errorContent` (**PROPS**, không node) + `isLoading`/`isEmpty`/`error` | ⛔ đừng ở tầng **SCREEN** |
| "Chưa có gì ở đây" + tối đa một đường ra | **`AsyncContentEmpty`** | props `title`/`description`/`icon` (component ref)/`action`, hoặc `onRetry`+`retryLabel` | `FeedbackEmpty` trần nếu vùng đó là async region |
| "Lấy dữ liệu thất bại, thử lại" | **`AsyncContentError`** | như trên; thường khai `const errorContent: AsyncContentErrorProps = {…}` | render thẳng ở screen |
| Một HỐ TRỐNG mà tôi muốn TỰ chọn cỡ (compact một dòng / default / trang 404 có `code`) | **`FeedbackEmpty`** | `code`/`icon`/`title`/`description`/`body`/`action` + `size`/`tone` | `AsyncContentEmpty` nếu không phải async region |
| Ghi chú có sắc thái nằm BÊN TRONG một mặt, CTA là một nhãn text | **`FeedbackCallout`** | `status`/`title`/`description`/`body` + `actionLabel`+`onAction` | `Alert` trần — Callout đã chọn `tone="soft"` + tự dựng nút |
| Cần đúng MẶT alert của hệ, và tự quyết chỗ đặt | **`Alert`** (atom) | `status`/`tone`/`title`/`description`/`body`/`action` (node) | ⛔ đừng `import { Alert } from "@heroui/react"` |
| Thông báo kết quả NỔI | **`Toast`** (atom) | `status` (tự chọn icon) + `title` + `description` + `action` | `Popover` — đó là panel bấm-mở |
| Chỉ cần báo "đang chạy", không có tỉ lệ nào | **`Spinner`** (atom) | `size` + `tone` (`current` ăn theo màu chữ cha) + `label` | `isSkeleton` nếu hình lúc tải nên MIRROR khung sắp hiện |
| Shimmer cho chính hình mình vẽ | **`isSkeleton` của chính component đó** | prop, chảy thẳng xuống atom | không có component skeleton dùng chung (§12c) |

### Vạch cấm của mục này

- ⛔ **`AsyncContent` KHÔNG ở tầng SCREEN.** Neo `PlaygroundPreparePage.tsx:35` — *"CORRECTING THE
  PLANNER'S TREE — NO `AsyncContent.Base` AT THIS TIER"*: planner đề xuất nối screen thẳng vào
  switch bốn nhánh, đúng lỗi *"rebuilt a worse version from a bare part instead of reusing the whole
  thing"*. Đã quét MỌI screen trước khi viết: không screen nào import `AsyncContent`/
  `AsyncContentError`. `QuizPage` phát biểu luật thẳng: *"a screen calls blocks and frames, never a
  composite directly"*. Thêm bằng chứng: không block nào trong năm block màn đó có prop `error` ⇒
  bịa ra ở screen là bịa một state không phần nào diễn đạt được.
- 📌 **NGOẠI LỆ DUY NHẤT được ghi tài liệu:** `AsyncContentEmpty` được import ở tầng screen
  (`CourseContents`, `ModulePage`, `FoundationResourcePage`, `QuizPage`, `PlaygroundPreparePage`) —
  và **chỉ khi nó thay THẾ CẢ THÂN màn**, không phải một node của một pha.
- ⛔ **Đừng bọc `AsyncContent` quanh khung đã TỰ có `isSkeleton` + `emptyState`.** Phép phân định:
  *vùng này có một mặt bounded phải sống xuyên MỌI trạng thái không?* Có ⇒ dùng trục của khung;
  không ⇒ dùng switch. Neo hai lựa chọn khác nhau **trên cùng một màn**, có lý do ghi rõ:
  `SubmissionFindingsList` đi trục `isSkeleton`/`emptyState` của `SurfaceCardAccordion` (section
  "Góp ý" phải đọc như cùng một mặt bounded dù đang shimmer/rỗng/lỗi/đầy), còn
  `SubmissionAttemptSelector` thì **có** bọc `AsyncContent` (một chip strip không có khung nào để
  mất).
- 📌 **Tái sử dụng MỘT PHẦN là hợp lệ:** `SubmissionFindingsList` judgement 3 —
  *"ERROR STILL REUSES `AsyncContent` — just its MESSAGE frames, not its switch"*: truyền
  `AsyncContentError` làm `emptyState` của accordion (kèm `items=[]`) để message retry render
  **bounded** trong cùng mặt card; error vẫn thắng `isLoading`, mirror đúng thứ tự ưu tiên.
- ⛔ **Đừng tự dựng `Button` cho CTA của `FeedbackCallout`** — truyền `actionLabel`+`onAction`,
  frame tự dựng nút và tự áp skin theo status (`CALLOUT_ACTION_CLASS` là INTERNAL, thầy chốt
  2026-07-25, đúng để screen không phải chạm atom).
- ⛔ **`Alert` là CỔNG DUY NHẤT xuống HeroUI Alert.** Trước 2026-07-25 mỗi bên tự import và tự giữ
  bảng màu/close riêng nên "sửa một, sửa hết". Và `Alert` **không có `children`** — nội dung tự do
  chỉ qua `body` (§12b).
- ⚠️ **BẪY HỢP ĐỒNG `AsyncContent`, không đọc source thì không thấy:** bỏ trống `errorContent` ⇒
  nhánh error **KHÔNG kích hoạt**, frame rơi tiếp xuống loading/empty/content (cố ý, giữ hợp đồng
  cũ). Bỏ trống `emptyContent` ⇒ nhánh empty render `null`, vùng **TỰ ẨN** ("silent empty branch").
- ⚠️ **`FeedbackEmpty size="compact"` bỏ ÂM THẦM** `icon`/`description`/`body`/`action`/`code` —
  truyền vào cũng không hiện, chỉ còn title mờ. `size="page"` **không** tự bọc surface.
- ⚠️ Ba họ message xếp thành **CHUỖI COMPOSE**, không phải ba lựa chọn ngang hàng: `Alert` →
  (`FeedbackCallout` = Alert + soft + tự dựng CTA từ text) và (`Toast` = Alert + plain);
  `FeedbackEmpty` → (`AsyncContentEmpty`/`AsyncContentError` = lớp MỎNG, chỉ thêm glyph mặc định
  Tray/Warning, ép duotone, gói `onRetry` thành nút).
- ⚠️ `Alert.status` thêm `"info"` 2026-07-30 round-9 — một tone trung tính KHÁC `accent` (hồng
  active-state của brand). Gotcha: `HeroAlert.status` là union ĐÓNG chưa từng có `info` ⇒ truyền
  `"default"` xuống vendor, ba bảng info-aware của atom quyết màu thật bằng className.

---

## 12. Ô nhập và form

Atom form **TỰ MANG** `label`/`hint`/`errorMessage`/`isRequired` (thầy chốt 2026-07-25 — tầng
`Field.*` cũ đã **XOÁ**, §12e/§13c). Không có component nào để "đắp nhãn quanh một field".

| Tôi đang có | Chọn | Đường vào nội dung | Đừng chọn |
|---|---|---|---|
| Một chuỗi NGẮN một dòng | **`InputText`** | `value` + `onValueChange` | `InputSearch` nếu là truy vấn |
| Một khối chữ DÀI nhiều dòng | **`InputTextarea`** | `value` + `rows` | `InputText` |
| Một SỐ đếm được, có stepper | **`InputNumber`** | `value: number` + `min`/`max`/`step` | `InputCurrency` nếu là tiền |
| Một số TIỀN người dùng nhập | **`InputCurrency`** | `value: number` + `currency` | `PricePoint` — đó là atom trưng bày |
| Một NGÀY (segment + popover lịch) | **`InputDate`** | `value: DateValue\|null` | `InputTime` |
| Một GIỜ trong ngày, không lịch | **`InputTime`** | `value: TimeValue\|null` | `InputDate` |
| Một chuỗi TRUY VẤN, kết quả hiện ở NƠI KHÁC | **`InputSearch`** | `value` + `onValueChange` | `SelectCombobox`/`SearchAutocomplete` nếu cần dropdown |
| Một chuỗi BÍ MẬT, che ký tự + nút mắt | **`InputPassword`** | `value` | `InputText` |
| Mã xác thực gõ từng ký tự vào từng ô | **`InputOtp`** | `value: string` + `length` | `InputNumber` |
| MẢNG nhãn TỰ DO người dùng tự nghĩ ra | **`InputTags`** | `value: string[]` | `SelectMulti` nếu tập là cố định |
| Tập option CỐ ĐỊNH, chốt ĐÚNG MỘT, thu vào trigger gọn | **`SelectSingle`** | `options[]` + `value` | `ChoiceRadioGroup` nếu 2-4 lựa chọn cần thấy hết |
| Tập option cố định, chọn NHIỀU | **`SelectMulti`** | `options[]` + `value: string[]` | `InputTags` nếu không có danh sách |
| Danh sách dài ĐÃ NẰM SẴN client, gõ để lọc rồi chốt một | **`SelectCombobox`** | `options[]` + `value`; react-aria **TỰ lọc** | `SearchAutocomplete` — nó KHÔNG lọc |
| Gợi ý FETCH theo từng ký tự, mỗi dòng có mô tả, cần spinner | **`SearchAutocomplete`** | `inputValue` + `items[]` + `onSelect` + `isLoading`; **cha lo lọc/fetch** | `SelectCombobox` — nó tự lọc tại chỗ |
| Một BOOLEAN người dùng đánh dấu rồi mới submit | **`ChoiceCheckbox`** | `isSelected` + `label` | `ChoiceSwitch` |
| 2-5 lựa chọn LOẠI TRỪ nhau, thấy hết cùng lúc | **`ChoiceRadioGroup`** | `options[]` + `value` + `groupLabel` | `ButtonRadioGroup` nếu là hàng nút cấu hình |
| Một thiết đặt bật/tắt có hiệu lực NGAY | **`ChoiceSwitch`** | `isSelected` + `label` | `ChoiceCheckbox` |
| MỘT tệp bất kỳ loại, tôi tự khai mime + dung lượng | **`Dropzone`** | `file` + `acceptedMimeTypes` + `maxSizeInBytes` + `hint` | `ImageDropzone` nếu chắc chắn là ảnh |
| MỘT file ẢNH, luật ảnh đã biết trước | **`ImageDropzone`** | `onFile` + `label` + `hint` + `icon` (component) | `Dropzone` — nó bắt khai lại luật |
| Cụm field cần submit bằng Enter + khoá cả cụm khi gửi | **`Form`** | `body` (`children`) + `actions` + `gap` + `onSubmit` | ⛔ đừng mong nó lo validation |
| Form dài cần chia NHÓM field có tiêu đề | **`FormSection`** | `title` + `description` + `body` | dùng làm card trưng bày — nó không có mặt |
| Hàng nút CUỐI form, cần căn phải hoặc dính đáy modal | **`FormActions`** | `items[]` (cùng shape `ButtonGroup`) + `align` + `sticky` | `ButtonGroup` nếu hàng nút nằm giữa nội dung |
| Đang viết một ATOM FORM MỚI | **`FieldFrame`** | `label`/`hint`/`errorMessage` + `children` (control) | ⛔ đừng dùng ở tầng block/page |

### Vạch cấm của mục này

- ⛔ **Đừng bọc thêm khung nhãn quanh một atom form** — atom đã tự mang, bọc thêm là **hai lớp
  nhãn** (§12e).
- ⛔ **`Form.*` CHỈ lo bố cục.** Không validation, không giá trị, không lỗi field: nhãn-mô-tả-lỗi
  thuộc atom, luật nghiệp vụ thuộc tầng block.
- ⛔ **`ChoiceRadio` không tự đứng được** — source ghi: *"a lone radio can't stand on its own —
  description · error · required are the GROUP's business"*. Cần cả nhóm ⇒ `ChoiceRadioGroup` +
  `options`.
- ⛔ **`SearchAutocomplete` KHÔNG lọc local** — prop doc ghi thẳng *"this block does NOT filter
  locally"*; cha chịu trách nhiệm lọc/fetch. Đây là ranh giới duy nhất với `SelectCombobox`.
- ⛔ **`items` bắt buộc cho mọi danh sách LẶP** ở mục này: `FormActions` · `ChoiceRadioGroup` ·
  `Select*`. `children` chỉ hợp lệ ở `FieldFrame` (bọc control) và khung bọc `Form`/`FormSection`.
- ⚠️ `ImageDropzone` mở `isDragActive?: boolean` (2026-07-26) để ghim state kéo-thả từ ngoài — hình
  đó vốn chỉ sống trong `useDropzone` nên story không ép được.

---

## 13. Nút và hành động

| Tôi đang có | Chọn | Đường vào nội dung | Đừng chọn |
|---|---|---|---|
| ĐÚNG MỘT việc người dùng bấm để làm | **`Button`** (atom) | `label` (cấm children) + `prefixIcon`/`suffixIcon` (**component**) + `onPress` | `ButtonGroup` nếu có N việc cùng hàng |
| Một nút chỉ có icon | **`Button`** + `isIconOnly` | `prefixIcon` + `ariaLabel` (cả hai bắt buộc), bỏ `label` | đừng tìm `Button.Icon` — XOÁ 2026-07-26 |
| Hàng 2-3 việc RỜI RẠC cạnh nhau (Huỷ · Lưu) | **`ButtonGroup`** | `items[]` + `size` ở cấp CỤM | `ButtonRadioGroup` nếu hàng mang trạng thái ĐANG CHỌN |
| Hàng nút CẤU HÌNH/BỘ LỌC bấm-để-CHỌN, wrap dòng | **`ButtonRadioGroup`** | `items[]` + `value`/`onChange` (hoặc `values`/`onToggle`) + `itemAction` | `ChoiceRadioGroup` nếu đây là field có nhãn/lỗi |
| DÃY gợi ý bấm được cùng hình (chip câu hỏi mẫu, quick-ask) | **`ChipButtonList`** (`composites/buttons`) | `items[]` + `direction: wrap\|column` | `ButtonGroup` — đây là dãy đồng dạng, không phải 2-3 vai khác nhau |
| Nút tròn NỔI góc dưới-phải mở overlay | **`FloatingActionButton`** | `icon` (trần) + `ariaLabel` + `onPress` | `Button isIconOnly` — FAB khoá cứng fixed + shadow + z-index |
| Ô TRÔNG như field nhưng bấm là mở command palette | **`InputButtonLike`** | `placeholder` + `icon` + `suffix` + `onPress` | `InputSearch` — cái này không giữ giá trị nào |
| "Xem thêm →" / "Tiếp tục →" cạnh tiêu đề nhóm | **`LinkSeeMore`** (atom) | `label` + `onPress`/`href` + `decorative` | `Button` — đây là text-link, không phải nút |
| ĐÚNG MỘT lối quay lại ở góc trên-trái | **`LinkBack`** (atom) | `label` hoặc `target` + `onPress` | `Breadcrumbs` nếu cần cả vệt tổ tiên |

### Vạch cấm của mục này

- ⛔ **`ButtonRadioGroup` cấm tuyệt đối `primary`** — chọn = `tertiary` NEUTRAL, không chọn =
  `ghost`. Hàng cấu hình thường nằm cùng bề mặt với **CTA accent duy nhất** của trang.
- ⛔ **`ButtonGroup` ≠ `ButtonRadioGroup` là khác HÌNH THÁI THẬT, không phải prop mới:** Group = N
  hành động rời vô-state (chỉ `onPress`); RadioGroup = một CONTROL CÓ STATE (`role="group"` +
  `aria-pressed`).
- ⛔ **Đừng hand-roll lại dãy chip gợi ý** — `ChipButtonList` gom từ 4 call-site gần y hệt trong
  `ContentAiChat`; mọi nơi cần hình đó compose composite NÀY.
- ⛔ **Đừng để `LinkSeeMore` tự làm `<a>` khi nó nằm TRONG một card đã bấm được cả khối** — bật
  `decorative` thay vì lồng hai press target.
- ⚠️ **`isPending` của react-aria KHÔNG tự vẽ spinner** — atom render tay. Neo: đây là bẫy lặp lại,
  kèm nút thì luôn `{isPending ? <Spinner/> : <Icon/>}`.
- ⚠️ Variant nút có **7** giá trị (`button-tokens.ts`, §15, thêm 2026-07-29): `tertiary` là hành
  động PHỤ và là variant dùng **NHIỀU NHẤT** trong `src` thật (77 call-site) nhưng atom trước đó
  chưa có; `outline` hiếm (6 call-site).
- ⚠️ Nợ còn treo: `ChipButtonList` và `FloatingActionButton` vẫn import `Button` từ
  `_legacy/designs/buttons/Button/Button`, không phải atom hiện hành.

---

## 14. Điều hướng

Bốn nấc của **cùng một** bài toán tab: `items` thuần dữ liệu → caller dựng cây khi từng tab cần
chrome riêng → hàng có HAI nhóm tab hai bên → hàng đó nằm trong mặt card.

| Tôi đang có | Chọn | Đường vào nội dung | Đừng chọn |
|---|---|---|---|
| 2-5 panel NGANG HÀNG, tab chỉ cần chữ (+ icon/số) | **`Tabs`** (atom) | `items[]` + `selectedKey` + `ariaLabel` | `TabsExtended` nếu tab không cần chrome riêng |
| Tab mà TỪNG tab mang thứ riêng của bề mặt (tone muted, ẩn nhãn mobile) | **`TabsExtended`** (atom) | `children` = cây `Tabs.ListContainer > Tabs.List > Tabs.Tab` | `Tabs` — `TabItem` không chở nổi ba trục của caller |
| HAI nhóm tab hai đầu một hàng (+ một cụm hành động) | **`Toolbar`** (`composites/navigation`) | `leftTabs`/`rightTabs` (dữ liệu) + `leftEnd` (node) | đừng chờ nó có nền/viền/bo — nó là hàng flex TRẦN |
| Hàng tab đó NẰM TRONG một mặt card | **`DoubleTabsCard`** | như Toolbar + `children` là thân card | ⛔ đừng tự ghép `SurfaceCard` + `Toolbar` tay |
| Chuỗi TỔ TIÊN gốc → hiện tại, bấm ngược lên được | **`Breadcrumbs`** (atom) | `items[]` + `maxItems`/`collapseOnMobile`/`collapseFrom` | `LinkBack` nếu chỉ cần MỘT đích quay lại |
| Danh sách chia trang, BIẾT tổng số trang | **`Pagination`** (atom) | `currentPage` + `totalPages` + `siblings` | `Stepper` — đó là luồng có thứ tự |
| Luồng nhiều BƯỚC tuần tự, chỉ ra đang ở bước mấy | **`Stepper`** (`composites/navigation`) | `steps[]` + `currentIndex`; `onStepPress` chỉ ở bước ĐÃ XONG | `Tabs` — các bước không chuyển tự do |
| MỘT huy hiệu bước đánh số lẻ giữa nội dung | **`StepBadge`** (atom) | `number` + `state: done\|active\|muted` | `Badge` — đó là số chưa-đọc treo góc |
| Tập HÀNH ĐỘNG rời rạc thu vào một nút bấm ra | **`Menu`** (atom) | `items[]` hoặc `sections[]` + `onAction` + `triggerLabel` | `Popover` nếu thứ bung ra là panel nội dung |
| Một khối nội dung phụ chỉ hiện khi BẤM | **`Popover`** (atom) | `content` (node) + `heading` + `triggerLabel` | `Tooltip` — đó là hover, không nhận tương tác |
| Một câu chú giải ngắn khi HOVER/focus trên phần tử đã có | **`Tooltip`** (atom) | `children` = TRIGGER + `label` | `Popover` — tooltip max-width 260px |

### Vạch cấm của mục này

- ⛔ **`Toolbar` KHÔNG có nền/viền/bo/đệm.** Tên cũ `TabsCard` bị **đổi 2026-07-25** chính vì đó là
  một lời nói dối: không có card nào trong nó.
- ⛔ **Đừng ép `Tooltip` thành `triggerLabel`** — react-aria phải gắn hover/`aria-describedby` thẳng
  lên chính phần tử caller đưa. `Tooltip` và `Badge` là **HAI atom DUY NHẤT** được giữ `children`.
- ⛔ **Đừng dùng `Tabs` khi các mục là BƯỚC có thứ tự (`Stepper`) hay đường dẫn tổ tiên
  (`Breadcrumbs`).** Chọn sai làm cả cấu trúc điều hướng nói sai quan hệ giữa các mục.
- ⚠️ `TabsExtended` **không phải nợ §12b** mà là **ngoại lệ có tên** (thẩm tra lại 2026-07-26): ép
  sang `items` sẽ nhồi ba trục của caller vào atom — vi phạm theo chiều ngược lại, nặng hơn.
- ⚠️ `TabsExtended variant="secondary"` phụ thuộc class **GLOBAL** `.extended-tabs` ở
  `src/app/globals.css` ⇒ sửa hình phải sang `src` (§0 `boundary.md`).
- ⚠️ `StepBadge` neo 2026-07-26 — ca **NGƯỢC** với lỗi thường gặp: trước đó `weight="bold"` ép cứng
  cả hai size khiến nấc `md` **đậm hơn** mọi glyph `size-5` khác. Quét theo hướng "thiếu bold" sẽ
  không thấy.
- ⚠️ `::::accordion` của markdown trước đây đi qua **atom `Accordion`** — sai primitive, không có
  hook surface chrome; nay dùng HeroUI Accordion compound trực tiếp với `variant="default"` để giữ
  separator full-bleed.
- ⚠️ `InfoTooltip` đã bị **LOẠI** khỏi họ Feedback theo §13c — dùng atom `Tooltip` trực tiếp; quy
  ước gạch-chân-nét-đứt cho thuật ngữ là component ở **tầng design** (kiểu `GlossaryTerm`).

---

## 15. Danh tính · ảnh · dấu hiệu nhỏ

| Tôi đang có | Chọn | Đường vào nội dung | Đừng chọn |
|---|---|---|---|
| Khuôn mặt MỘT người, không chắc có ảnh | **`Avatar`** (atom) | `src` + `seed`/`name` + `icon`; chuỗi rớt ảnh→DiceBear→initials→icon | `UserCell` nếu cần cả hàng tên + handle |
| NHIỀU mặt chồng mép + đếm phần dư | **`AvatarGroup`** (atom) | `items[]` + `max` + `total`; `size` ở cấp CỤM | đừng đặt `size` lên từng item (§12d) |
| HÀNG danh tính một người trong danh sách (+ nút/chip phải) | **`UserCell`** (atom) | `username` + `displayName`/`avatar`/`handle` + `trailing` | `Avatar` nếu chỉ cần mặt |
| Một URL ảnh có thể thiếu/lỗi, cần shimmer + fallback | **`Image`** (atom) | `src` + `alt` + `ratio` + `fallbackSrc` | `CoverImage` nếu chắc chắn là bìa 16:9 |
| Ảnh BÌA của một thực thể, khung chuẩn hệ | **`CoverImage`** (atom) | `src` + `alt` (khoá cứng 16:9 + `rounded-2xl`) | `Image` — CoverImage không nhận `ratio`/`fallbackSrc` |
| Ô vuông nền tint làm dấu hiệu LOẠI/chủ đề | **`IconTile`** (atom) | `icon` (component) hoặc `src` + `tone` + `size` | `Avatar` nếu là khuôn mặt người |
| Một payload chuỗi cần quét bằng điện thoại | **`QRCode`** (atom) | `data` + `size` + `icon` | ⚠️ bitmap do CDN ngoài sinh, cần MẠNG |
| Dấu hiệu thương hiệu StarCi | **`Logo`** (atom) | chỉ `className` (cỡ + vị trí) | đừng truyền màu/biến thể — một màu duy nhất |
| Số chưa-đọc / chấm hiện diện treo góc một phần tử | **`Badge`** (atom) | `children` (phần tử được treo) + `count`/`dot` + `placement` | `StepBadge` — đó là số BƯỚC có state |
| Một đường ngăn giữa hai khối (hoặc dòng "HOẶC") | **`Divider`** (atom) | `label` (tuỳ chọn) + `orientation` | `ThreadConnector` nếu là đường cong nối avatar |
| Đường dẫn cong nối avatar cha xuống ô trả lời | **`ThreadConnector`** (atom) | chỉ `className` (vị trí); cao khoá cứng `h-4` | ⚠️ đừng đổi sang `self-stretch` |
| Một dòng ngắn cần copy nhanh (lệnh, API key) | **`SnippetIcon`** (atom) | `copyString` + `isCopied` (ghim) | đừng dùng trong khối code nhiều dòng — ở đó cần Toast |
| Giá của một GÓI/BẬC, đã format sẵn | **`PricePoint`** (atom) | `amount` + `original` + `period` + `size` | `InputCurrency` — đó là ô nhập |
| Một cụm KHÔNG phải `SurfaceCard` cần vòng sáng quét | **`HighlightCard`** (composite) | `children` (bọc nguyên cây đã dựng) | ⛔ nếu thứ tôi bọc LÀ `SurfaceCard` ⇒ prop `isHighlight` |

### Vạch cấm của mục này

- ⛔ **TÍN HIỆU TỪ DATA vs TRANG TRÍ, đừng đổi chỗ.** Dải 2px mép TRÁI (`verdictBandClassName`,
  `withVerdict` — dùng ở item của `SurfaceCardList` và tile của `SurfaceCardPressableGroup`) là tín
  hiệu **từ DATA**. Vòng sáng quét (`isHighlight`/`HighlightCard`) là **trang trí thuần**, không
  được dùng làm tín hiệu.
- ⛔ **Đừng bọc `HighlightCard` quanh một `SurfaceCard`** — thầy 2026-07-26 *"just add
  isHighlight"*: bọc hai lớp cho một việc là sai, và xếp một decorator vào họ Cards là xếp sai họ.
  Và **đừng làm nổi bật hai card trên cùng một mặt** — hai cái nổi bật thì triệt tiêu nhau.
- ⛔ **Đừng mở cửa hậu cho caller bôi class vào icon nội bộ của atom** — neo 2026-07-26: xoá
  `classNames.copyIcon`/`checkIcon` của `SnippetIcon`, trái §4.
- ⚠️ Hiệu ứng `isHighlight` nằm ở class **GLOBAL** `.highlight-card-sweep` trong
  `src/app/globals.css` ⇒ sửa hiệu ứng phải sang `src`. `isSkeleton=true` thì **TẮT** lớp sweep
  (skeleton chưa có verdict nên không được đọc thành nổi bật). Neo thầy 2026-07-29: nhánh
  không-pressable thiếu `relative` nên sweep phủ LÊN nội dung, cắt ngang nút CTA.
- ⚠️ **`Avatar` phải nghe `onLoadingStatusChange`, không phải `onError`** — HeroUI chỉ mount `<img>`
  **sau khi** load xong nên `onError` không bao giờ bắn. `UserAvatar` đã gộp vào `Avatar`
  2026-07-26, DiceBear là mặt MẶC ĐỊNH.
- ⚠️ `IconTileTone` là **ALIAS** của `AlertStatus` (trung lập gọi là `default`, không khai lại
  `neutral` riêng) — thầy chốt 2026-07-29. Cùng luật với `InlineIconLabel.tone` và
  `SurfaceCardListItem.leadingIconColor`.
- ⚠️ `Divider` và `ThreadConnector` **không có** `isSkeleton` — chúng là vạch tĩnh.
  `Spinner` cũng không, vì nó **CHÍNH LÀ** chỉ báo tải.
- ⚠️ Chú ý `href` vs `onPress` là **hai ngôn ngữ hover khác nhau** (thầy 2026-07-29): `href` = LINK
  (chỉ `.group` + underline-on-group-hover, KHÔNG ripple/press-scale); `onPress` = ACTION (ripple +
  `active:scale-[0.97]`).

---

## Không phải cửa của người dựng màn

Có tên export nhưng **chỉ chạm khi đang sửa chính tầng đó**. Chọn một trong những cái này ở tầng
block/page nghĩa là đang đi vòng qua một ràng buộc:

| Tên | Thuộc | Chỉ chạm khi |
|---|---|---|
| `Flex` | frame | đang sửa `frames/Stack` |
| `SurfaceCardHeader`, `surfaceFrame`, `surfaceSectionGap` | composite | tự dựng một cụm không-phải-card mà vẫn phải khớp hàng nhãn |
| `FieldFrame` | atom | viết một ATOM FORM MỚI |
| `ProgressMeterTargetMark` | composite | tự dựng một track khác cần đúng vạch mốc |
| `buildMarkdownRenderers`, `TabsBlock`, `TabPane`, `MarkdownTable*`, `flattenMarkdownTableHeaderChildren`, `isMarkdownHeaderTableRowNode` | composite | sửa NGỮ PHÁP markdown trong `map.tsx` |
| `MarkdownMeasure`, `FLOW_DIAGRAM_CARD_NODE_TYPE`, `FlowDiagramCardNodeData` | type/hằng | khai prop hoặc dựng data — **đừng hardcode chuỗi** thay chúng |

---

## Bằng chứng dùng thật — đọc số 0 cho đúng

Đếm file có import trong `components/starci/{blocks,pages,overlays,layouts}`:

`Typography` 93 · `SurfaceCard` 54 · `MarkdownContent` 19 · `SurfaceCardList` 17 · `AsyncContent` 13
· `EnumChip` 11 · `AsyncContentEmpty` 7 · `ListRow` 6 · `SurfaceCardAccordion` 4-6 · `Disclosure` 4
· `SurfaceCardPressableGroup` 3 · `SurfaceCardCrossList` 1 · `ListMeta` 1 · `RichText` 1.

**ZERO call-site thật:** `SurfaceCardNested` · `SurfaceCardSelectableGroup` ·
`SurfaceCardPlaceholder` · `ListLabeled` · `ListToggleRow`.

Ba cái đầu có lý do rõ (nested đi bằng prop `variant`; Selectable/Placeholder là ca hiếm).
`ListLabeled`/`ListToggleRow` là vùng chưa có màn nào cần. **Đừng đọc số 0 thành "component sai"** —
nhưng cũng **đừng chọn chúng mà không kiểm lại phép phân định** ở mục 1 và 2.

---

## Hai drift đã được FLAG, cố tình chưa sửa

Ghi ở đây để không ai "sửa hộ" rồi tưởng mình dọn nợ, và cũng để không ai chép chúng làm khuôn:

1. **`SurfaceCardSelectableGroup`** gọi TRỰC TIẾP HeroUI `Radio`/`RadioGroup` thay vì đi qua atom
   `ChoiceRadio`/`ChoiceRadioGroup` — thành viên duy nhất của họ chọc thẳng xuống HeroUI. Thầy dặn
   để nguyên pass này.
2. **`ListToggleRow`** — nhánh thật dùng HeroUI `Switch` trần, nhánh `isSkeleton` lại đi qua atom
   `ChoiceSwitch`: hai nhánh của **cùng một dòng** đi hai cửa khác nhau. Chưa có comment nào flag.

Cùng loại: `HighlightChip` gọi thẳng HeroUI `Chip` với `size="sm"` và tự vẽ skeleton `h-6 w-20`,
không đi qua atom `Chip` như `EnumChip`. `MetricCard` có một bản COPY nội bộ tên `SectionCard` ở đầu
file, kèm TODO đổi sang local thật khi mảng cards port xong.

---

## Luật chung của cả bảng

1. **TRA BẢNG NÀY TRƯỚC KHI DỰNG**, không phải sau khi dựng xong rồi soi lại. Không dòng nào khớp
   ⇒ mới tính mở rộng component, và đó là **quyết định của THẦY** (`boundary.md` §2.3).
2. **HÌNH DỮ LIỆU quyết định component, không phải nội dung cụ thể.** "Một đoạn văn" và "một bài
   markdown 200 dòng" cùng chọn `SurfaceCard`; "một dòng" và "tám dòng" cùng chọn `SurfaceCardList`.
   Chọn bằng **phép thử**, không bằng mắt — `SurfaceCardList` và `SurfaceCardAccordion` cùng một
   DA (cùng `surfaceFrame` + kẻ chia full-bleed + label/description ngoài) nên nhìn ảnh không phân
   biệt được: có `body` ẩn thì Accordion.
3. **TÊN COMPONENT PHẢI KHỚP KHÁI NIỆM ĐANG RENDER.** `items` luôn-một-phần-tử · `List` cho một đoạn
   văn · `Accordion` cho thứ không cần mở · `Chip` cho một số tự do · `Toolbar` tên cũ là
   `TabsCard` mà không có card nào — đều là sai khái niệm **ngay ở kiểu dữ liệu**, dù render ra vẫn
   "trông được" và mọi cổng vẫn xanh.
4. **KIỂU DỮ LIỆU LÀ MỘT LỜI MỜI.** Prop tên `title` khai `ReactNode` là đang mời caller nhét
   markdown; `items` mở `content: ReactNode` là đang mời mất kiểm soát. Siết kiểu là cách chặn rẻ
   nhất, và siết thì phải kiểm ca thật đang dùng (3/3 ca nhét icon vào `title` ⇒ thêm `titleStart`,
   không giữ `ReactNode`).
5. **THÊM DÒNG MỚI PHẢI KÈM NEO** (ngày + file + câu thầy nói nếu có). Một ví dụ không thành luật:
   muốn nâng thành luật chung phải có **ĐỦ HAI nguồn độc lập**, không thì ghi rõ đó là neo vào đúng
   ca đó (`principles/INDEX.md`).
