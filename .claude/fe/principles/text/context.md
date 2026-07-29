# TEXT — cỡ chữ, độ đậm, màu chữ

> Trục này trả lời đúng một câu: **chữ này cỡ nào, đậm bao nhiêu, màu gì.**
> Hai thang GIAO NHAU: `size` và `weight` — chọn size không tự động đúng weight, và một
> vài nhánh render (icon, `isLink`, `size="code"`) **lờ hẳn weight đi** dù bạn có truyền.
> Neo code thật: [`example.html`](example.html).

---

## 1. THANG

### 1a. SIZE — 10 giá trị thật, 3 nhóm render khác cơ chế
Đọc từ `type TypographySize` trong `Typography.tsx` (dòng 43). KHÔNG có giá trị thứ 11.

| Giá trị | Nhóm render | Class/cơ chế thật | Tier vai trò (xem 1c) |
|---|---|---|---|
| `xs` | body (class) | `text-xs` (12px) | D |
| `sm` | body (class) | `text-sm` (14px) | B (kèm `medium`) hoặc C |
| `base` | body (class) | `text-base` (16px), **mặc định khi không khai `size`** | C, hoặc riêng `isLink`/`isButton` |
| `lg` | body (class) | `text-lg` (18px) | A hiếm khi đứng lẻ — chỉ 5 call-site thật toàn hệ thống |
| `h1`/`h2` | heading (bọc `HeroTypography.Heading`) | gần như KHÔNG dùng (1 lần/loại: mã lỗi trang, skeleton) | — |
| `h3`/`h4`/`h5` | heading (bọc `HeroTypography.Heading`) | `level={3,4,5}` | A |
| `code` | wrap `HeroTypography type="code"` | — | không thuộc tier nào, `weight` bị LỜ (xem §4.1) |

⚠️ **`h6` KHÔNG tồn tại trong `TypographySize`** (`HEADING_LEVEL` trong `Typography.tsx` dừng ở
`h5`, dòng 48) dù HeroUI gốc có `h6` (`typography.styles.ts:39`) và `src` thật dùng nó
(`CourseCard/index.tsx:285` là `type="h6"`). Quy ước: port `h6` thật → dùng nấc gần nhất
`size="h5"` của atom. Việc ánh xạ này mới ghi 1 dòng ví dụ trong canon, CHƯA thành luật chính
thức — xem §6 mục cần thầy chốt.

### 1b. WEIGHT — 4 giá trị hiệu lực (type chỉ khai 3, giá trị thứ 4 là KHÔNG khai)
`weight?: "medium" | "semibold" | "bold"` (`Typography.tsx` dòng 178). Bậc thứ 4 là **không
truyền prop** (regular/normal) — không nằm trong union nhưng là trạng thái thật, có render riêng.

| Giá trị | Ý nghĩa | Áp dụng thật |
|---|---|---|
| *(không khai)* | regular — văn xuôi dài | mặc định mọi nhóm |
| `medium` | nhấn LÀM VIỆC — nhãn, tên, giá trị cỡ-body | body + heading + isButton |
| `semibold` | tiêu đề CẤP KHỐI — modal header, tổng tiền, verdict | CHỈ có nghĩa riêng ở heading; ở body **FOLD về `medium`** |
| `bold` | heading/display/số lớn | CHỈ đi với heading; **KHÔNG BAO GIỜ** ở `body-sm`/`body-xs` |

### 1c. Tier vai trò (áp cây quyết định §2) + ngoại lệ có tên
| Tier | size×weight | Dùng khi |
|---|---|---|
| **A** | `h3`-`h5` (nấc gần nhất của `h6` thật) **luôn `bold`** | đứng MỘT MÌNH làm tâm điểm 1 khối/card/lưới |
| **B** | `sm` + `medium` | 1 HÀNG trong list/table dày đặc, không đứng riêng |
| **C** | `sm`/`base`, regular, thường `color="muted"` | câu/đoạn mô tả dưới 1 title |
| **D** | `xs`, regular | meta/nhãn phụ: timestamp, caption tầng 2, giá gạch |
| **Ngoại lệ (không phải tier 5)** | `base` + `weight="semibold"`, KHÔNG BAO GIỜ `h*` | Tiêu đề Modal — luật riêng, dễ lẫn Tier A nhất |

### 1d. Màu (thang phụ, phần "màu gì" của câu hỏi trục)
`color?: "default" | "muted" | "accent" | "success" | "warning" | "danger"`. `default`/`muted`
là 2 mức NỀN của chữ (§9a — không khai = `default`); 4 màu semantic còn lại là trục TRẠNG
THÁI, thuộc `color/` trục riêng (⬜ chưa dựng) — trục `text` chỉ sở hữu default/muted.

---

## 2. CÂY QUYẾT ĐỊNH — 5 bước chọn TIER, rồi 3 bước gác weight

**Bước A — chọn tier/size** (canon [`principles/text/context.md`](../text/context.md) §2, thầy chốt 2026-07-29):
1. Đây có phải **tiêu đề Modal** không? → **Ngoại lệ** (`base` + `semibold`), dừng.
2. Đứng MỘT MÌNH làm tâm điểm 1 khối/card/lưới? → **Tier A**.
3. 1 hàng trong list/table dày đặc? → **Tier B**.
4. Câu/đoạn văn xuôi mô tả? → **Tier C**.
5. Còn lại (nhãn/timestamp/giá phụ/caption) → **Tier D**.

**Bước B — weight có thật sự render như đã chọn không?** Tier chỉ là mặc định; 3 câu sau có
thể BẺ GÃY nó mà KHÔNG báo lỗi gì (xem bằng chứng ở §4):
1. Text này có `prefixIcon`/`suffixIcon` không? → CÓ ⇒ weight bị ép cứng `font-medium`, MỌI
   `weight` khác truyền vào đều vô tác dụng.
2. Text này là `isLink` không? → CÓ ⇒ `weight` không được đọc, luôn ra weight mặc định của
   `HeroLink`.
3. `size` đang là `"code"` không? → CÓ ⇒ `weight` không được đọc, không có class đậm nào áp.

Không vướng cả 3 câu trên → weight của tier ở Bước A render đúng như bảng §1c.

---

## 3. VÉT CẠN CA DỄ LẪN

### 3a. Bốn tier ⇒ `C(4,2) = 6` cặp — vét đủ theo khoảng cách trong thang A-B-C-D

**Cách 1 bậc (3 cặp, trận đánh chính):**

| Cặp | Phép phân định DỨT KHOÁT |
|---|---|
| `A ↔ B` | Text này có ĐỨNG RIÊNG được không, hay LUÔN xuất hiện kèm N hàng giống nó? Đứng riêng ⇒ A. Luôn là 1 hàng trong danh sách ⇒ B. |
| `B ↔ C` | Text này có phải là TÊN/NHÃN của một thực thể, hay là CÂU MÔ TẢ đọc liền? Tên/nhãn ngắn, nổi hơn dòng xung quanh ⇒ B (`medium`). Câu văn xuôi dài, giọng phụ ⇒ C (regular + thường muted). |
| `C ↔ D` | Xoá dòng này, phần còn lại có MẤT Ý CHÍNH không, hay chỉ mất 1 chi tiết vụn? Mất ý chính (mô tả) ⇒ C. Chỉ mất meta (giờ, nhãn phụ) ⇒ D. |

**Cách 2 bậc (2 cặp) — câu hỏi cấp trên chưa trả lời, không viết phép thử riêng:**
`A ↔ C`, `B ↔ D` — phân vân ở đây nghĩa là chưa trả lời dứt câu 2 hoặc câu 3 ở §2 Bước A;
quay lại đó, đừng so trực tiếp 2 tier cách nhau 2 bậc.

**Cách 3 bậc (1 cặp) — cố ý không có phép thử:**
`A ↔ D` — Tier A (đậm nhất, đứng riêng) và Tier D (nhạt nhất, meta phụ) không bao giờ là 2 lựa
chọn hợp lý cho CÙNG một dòng chữ. Phân vân ở đây là dấu hiệu đọc sai cấu trúc (VD tưởng nhầm
1 con số phụ là điểm nhấn của khối), không phải chọn sai tier.

### 3b. Bốn giá trị weight ⇒ `C(4,2) = 6` cặp — vét theo khoảng cách trong thang regular-medium-semibold-bold

**Cách 1 bậc (3 cặp):**

| Cặp | Phép phân định |
|---|---|
| `regular ↔ medium` | Chữ này có phải NHÃN/TÊN cần nổi hơn xung quanh không (Tier B), hay chỉ là văn xuôi/meta (Tier C/D)? Nổi hơn ⇒ `medium`. Không ⇒ không khai. |
| `medium ↔ semibold` | Đang ở cỡ HEADING (`h3`-`h5`) hay cỡ BODY? Ở BODY, `semibold` fold về `medium` — 2 giá trị này render GIỐNG HỆT nhau ở body, đừng phân vân, viết `medium` cho rõ ý. Ở HEADING, 2 giá trị khác nhau thật — `semibold` là ngoại lệ Modal-header hoặc verdict cấp khối, `medium` gần như không dùng ở heading. |
| `semibold ↔ bold` | Đây có phải Tier A (đứng riêng làm tâm điểm) không? CÓ ⇒ `bold`. Đây có phải tiêu đề Modal/verdict/tổng tiền không? CÓ ⇒ `semibold`, không bao giờ `bold`. |

**Cách 2 bậc (2 cặp) — câu hỏi cấp trên chưa trả lời:** `regular ↔ semibold`, `medium ↔ bold`.
Quay lại xác định trước: đây có phải Tier A/ngoại lệ Modal không?

**Cách 3 bậc (1 cặp) — cố ý không có phép thử:** `regular ↔ bold`. Một dòng chữ phân vân giữa
"không đậm gì cả" và "đậm nhất trang" là dấu hiệu chưa xác định được tier, không phải chọn sai
weight.

### 3c. TỔ HỢP size×weight — tiêu chí vét cạn KHÁC (không phải thang có thứ tự): liệt kê đủ MỌI NHÁNH RENDER × mọi giá trị weight
`Typography.tsx` có đúng **6 nhánh render** đọc/không đọc `weight` khác nhau (skeleton bỏ qua vì
không có `text`). 6 nhánh × 4 giá trị weight = 24 ô, dừng vét khi đủ 24:

| Nhánh render | regular | `medium` | `semibold` | `bold` |
|---|---|---|---|---|
| **body, không icon, không link/button** | ✅ không đậm | ✅ `font-medium` | ⚠️ FOLD → render y hệt `medium` | ✅ `font-bold` |
| **body, CÓ `prefixIcon`/`suffixIcon`** | ⛔ vô tác dụng — ép `font-medium` | ⛔ vô tác dụng (trùng ép) | ⛔ vô tác dụng | ⛔ **vô tác dụng — kể cả `bold` cũng bị hạ xuống `medium`, không báo lỗi** |
| **`isLink`** | ⛔ prop `weight` không được đọc trong nhánh này, render weight mặc định của `HeroLink` bất kể truyền gì | ⛔ | ⛔ | ⛔ |
| **`isButton`** | ✅ không đậm | ✅ `font-medium` | ⚠️ FOLD → `font-medium` (giống body thường) | ✅ `font-bold` |
| **heading (`h1`-`h5`)** | ✅ mặc định HeroUI của `type` đó (atom không tự set) | ✅ 3 bậc THẬT khác nhau, không fold | ✅ | ✅ |
| **`size="code"`** | ⛔ | ⛔ prop `weight` không được đọc trong nhánh này | ⛔ | ⛔ |

Đọc bảng: **CẤM có ý nghĩa** (2 ô ⛔ ở body+icon và ⛔ ở `isLink`/`code`) không phải lỗi biên
dịch — code nhận mọi giá trị, âm thầm bỏ qua. Đây chính là bẫy ở §4.

---

## 4. BẪY CẤU TRÚC — có bằng chứng thật, không phải chọn nhầm giá trị

1. **`weight` không ai nhận ở `size="code"`.** Nhánh code (`Typography.tsx` dòng 338-354) không
   đọc `weight` trong `cn(...)` — truyền `weight="bold"` cùng `size="code"` không lỗi gì, không
   đậm gì. Neo: so `INLINE_CODE_CLS` (dòng 146) cũng không có token đậm.
2. **`weight` không ai nhận ở `isLink`.** Nhánh `isLink` (dòng 372-391) build className chỉ từ
   `TEXT_CLS`/`COLOR_CLS`/underline — không có nhánh đọc `weight`. Một link "in đậm" phải tự
   quyết bằng cách khác (không phải prop `weight`), không phải bug nhưng dễ tưởng bug khi weight
   "biến mất".
3. **Có icon → `weight` truyền vào bị ĐÈ, không cảnh báo.** Dòng 417-423: `hasIcons ? "font-
   medium" : (fold theo weight)`. Việc này ĐÚNG THIẾT KẾ (comment tại chỗ: "icon strokes fit
   medium text") nhưng là bẫy thật nếu người viết code kỳ vọng `weight="bold"` render đậm cạnh
   1 icon — nó luôn ra `medium`.
4. **`semibold` ở cỡ body từng bị BUG câm hoàn toàn** (đã vá 2026-07-29, xem §1b/§3c của
   tài liệu này) — 2 nhánh render body-scale trước đó rơi `weight === "semibold"` vào `null` (MẤT đậm
   hoàn toàn) thay vì fold về `medium`, sai âm thầm ở 7 file/9 call-site trước khi bị bắt qua 1
   câu feedback. Bài học: sau khi SỬA fold logic, vẫn phải grep lại mọi call-site `weight=
   "semibold"` ở body scale để chắc chắn không còn nhánh thứ 3 sót fold.
5. **"To đậm" ⇒ bản năng chọn heading, nhưng Modal header KHÔNG BAO GIỜ là heading.** Neo
   `PaymentModal/index.tsx:460`, `CookieConsentModal/index.tsx:45` — cả hai `type="body"` +
   `semibold`. 5/5 lỗi thật ghi trong canon 2026-07-29 (`MilestoneUpNextCard`, `EnrollGate`,
   `LeaderboardBoard`, `ContentPaywall`, `VoiceHero`) đều là TỰ Ý NÂNG size so với `src`, không
   ca nào hạ nhầm — thiên lệch có hệ thống, nghi ngờ chính mình khi định chọn size to hơn.
6. **`text-xl font-semibold` viết trần ở `src` = `h4` (20px heading), KHÔNG PHẢI `lg` body
   (18px)** — 2 thang khác nhau, dễ lẫn vì cả hai "to hơn sm". Neo: `EnrollGate`
   (`type="h4"` thật), `ContentPaywall` (`text-xl font-semibold` viết trần, không qua Typography).

---

## 5. NEO THẬT — thứ tự ưu tiên khi hai nguồn đá nhau

1. **Bảng vai trò → `type` HeroUI thật**, đúc từ ~70 file `src` thật (xem §1c của tài liệu này) — ưu
   tiên cao nhất khi porting 1 dòng chữ cụ thể.
2. **Cây quyết định 4-tier + ngoại lệ Modal** (§2 Bước A của trang này) — dùng khi không có
   `src` cụ thể để soi, hoặc khi cần XẾP LOẠI một chữ mới chưa từng có trong `src`.
3. **Nghiên cứu ngoài ngành** (Dropbox mobile giảm hierarchy 5→3 bậc, +17% conversion) — CHỈ là
   lý do TỔ CHỨC LẠI cách trình bày dữ liệu thật thành 4 tier, KHÔNG PHẢI nguồn để tự thêm case
   mới ngoài dữ liệu đã đúc.

Neo cụ thể từng nhánh: [`example.html`](example.html).

---

## 6. VẠCH CẤM

| # | Cấm | Gate |
|---|---|---|
| 1 | Truyền `size`/`weight` ngoài union literal | ✅ `tsc` — `TypographySize` + `weight` là union |
| 2 | Rải `text-*`/`font-*` className khi `Typography` diễn đạt được bằng prop | ⬜ **CHƯA — gate cần viết**: quét mọi `className=` trên JSX render `<Typography`/`<span data-anat-part="Text"` chứa `text-(xs|sm|base|lg|muted|foreground)`/`font-(medium|bold|semibold)` |
| 3 | Token sai `text-muted-foreground`/`text-default`/`color="default"` thừa trên `Typography` | ⬜ **CHƯA — gate cần viết** |
| 4 | Namespace kiểu cũ `Typography.Xs`/`.Sm`/`.H3` (đã merge 2026-07-25) | ✅ `check-no-namespace.mjs` |
| 5 | `size="code"` hoặc `isLink` kèm `weight` (vô tác dụng, xem §3c/§4.1-4.2) | ⬜ **CHƯA — gate cần viết**: quét call-site vừa có `size="code"`/`isLink` vừa có `weight=` |
| 6 | Tự nâng `size` so với `src` thật ("cho card nổi bật hơn") | ⛔ không gate được — kỷ luật, phải đối chiếu `src` từng dòng (§4.5) |
| 7 | `weight="bold"` cạnh `prefixIcon`/`suffixIcon` kỳ vọng render đậm | ⛔ không gate được — đúng thiết kế atom, chỉ cảnh báo bằng tài liệu (§4.3) |
| 8 | Báo xong khi chỉ đối chiếu bảng vai trò, chưa đọc đúng DÒNG `src` (nhầm dòng số hạng ↔ dòng tên) | ⛔ không gate được — kỷ luật, đọc lại đúng dòng trước khi trích |
