# COLOR — chỗ này có được tô màu accent/semantic không, hay để mặc định

> Trục này trả lời đúng một câu: **chỗ chữ/icon này thuộc bậc màu nào trong 6 bậc, hay
> không được tô gì cả.** Không trả lời cỡ chữ (xem `text/`), không trả lời prominence
> tổng thể muted→chip→button (đó là §2 [`principles/prominence/context.md`](../prominence/context.md), trục RỘNG hơn — trục này chỉ
> khoanh vào MỘT prop `color` của `Typography`/`Alert`/`Chip`).
> Neo code thật: [`example.html`](example.html).

---

## 1. THANG — sáu giá trị, không có giá trị thứ bảy

| Giá trị | Class thật | Ý nghĩa |
|---|---|---|
| `default` | *(không khai — `null` trong `COLOR_CLS`)* | chữ CHÍNH: tiêu đề, giá trị, câu đọc, số liệu MANG giá trị thông tin thật |
| `muted` | `text-muted` | chữ PHỤ: hint/mô tả/caption/meta/nhãn-của-giá-trị/timestamp/trivia đứng riêng |
| `accent` | `text-accent` | tín hiệu THƯƠNG HIỆU/TƯƠNG TÁC: link, "của tôi", active — KHÔNG báo cáo 1 trạng thái dữ liệu |
| `success` | `text-success` (soft token: `text-success-soft-foreground`) | trạng thái ĐÚNG/hoàn tất/tích cực |
| `warning` | `text-warning` (soft: `text-warning-soft-foreground`) | trạng thái CẦN CHÚ Ý/sắp chạm ngưỡng |
| `danger` | `text-danger` (soft: `text-danger-soft-foreground`) | trạng thái LỖI/xoá/không hoàn tác |

SSOT của thang: `TypographyColor` trong `.storybook/components/atoms/text/Typography/Typography.tsx:33`
(`"default" | "muted" | "accent" | "success" | "warning" | "danger"`), map class thật ở
`COLOR_CLS` cùng file dòng 78-85. Hai atom khác lặp lại ĐÚNG 5/6 giá trị (trừ `muted`,
vì bản thân chúng đã là khối tô màu, không cần mờ thêm): `AlertStatus` (`Alert.tsx:43`,
đặt tên nhánh trung tính là `"default"`) và `ChipTone` (`ChipBase.tsx:48`, đặt tên NHÁNH
TRUNG TÍNH là `"neutral"` — khác chữ, cùng nghĩa, xem bẫy #3). Viết class màu tay
(`text-[#ff0000]`, `style={{color}}`) ngoài prop `color` là lỗi cấu trúc, không phải lỗi
biên dịch — xem §6.

---

## 2. CÂY QUYẾT ĐỊNH — hỏi từ trên xuống, dừng ở câu YES đầu tiên

| # | Hỏi | Ra |
|---|---|---|
| 1 | Chữ/icon này có đang BÁO CÁO 1 TRẠNG THÁI THẬT của dữ liệu — đổi dữ liệu thì màu **PHẢI** đổi theo (không phải do người dựng thích tô)? | sang câu 1a |
| 1a | Trạng thái đó là gì: đã ĐÚNG/hoàn tất · CẦN CHÚ Ý/sắp chạm ngưỡng · hay LỖI/không hoàn tác? | `success` · `warning` · `danger` tương ứng |
| 2 | (Nếu KHÔNG phải 1) Chữ/icon này có mang tín hiệu THƯƠNG HIỆU/TƯƠNG TÁC — link, "của tôi", đang chọn/active — mà **không** gắn với 1 kết quả dữ liệu? | `accent` |
| 3 | (Nếu KHÔNG phải 2) Chữ này có phải PHỤ — hint/mô tả/caption/meta/nhãn-của-giá-trị/timestamp, hoặc số liệu TRIVIA đứng RIÊNG không dính control nào (§9a.1 lớp 2)? | `muted` |
| 4 | Còn lại — chữ CHÍNH của hàng, hoặc số liệu MANG giá trị thông tin thật + DÍNH LIỀN 1 control đang active (§9a.1 lớp 1) | `default` — không khai `color` |

**Trước khi tin cây: nếu 1 con số đứng cạnh 1 control/hành động, PHẢI qua đủ 2 lớp câu hỏi
của §9a.1** (mang giá trị thông tin thật? + dính liền cấu trúc với control active?) — KHÔNG
được gộp thành 1 câu duy nhất "có phải lý do người đọc nhìn vào hàng". Xem bẫy #1.

---

## 3. VÉT CẠN CA DỄ LẪN — đủ 15 cặp

Thang 6 giá trị ⇒ `C(6,2) = 15` cặp. Thứ tự dùng để chia nhóm (không phải thang cường độ
tuyệt đối, mà là khoảng cách trong CÂY §2): `muted → default → accent → success → warning
→ danger` (chìm nhất → báo động nhất, đi đúng thứ tự 4 câu hỏi của cây).

### 3a. Năm cặp KỀ NHAU — đây là toàn bộ trận đánh

| Cặp | Phép phân định DỨT KHOÁT | Neo |
|---|---|---|
| **`muted` ↔ `default`** | Áp đủ 2 lớp §9a.1: con số/câu chữ có DÍNH LIỀN cấu trúc với 1 control đang active **và** mang GIÁ TRỊ THÔNG TIN thật không? Cả hai đúng ⇒ `default` (ăn theo trọng lượng control). Đứng RIÊNG + trivia ⇒ `muted`. | `ReactionButton.tsx:182` (default, "128" gắn control) ↔ `ContentReaction.tsx:84` (muted, "lượt xem" đứng riêng) |
| **`default` ↔ `accent`** | Phần tử này có BẤM ĐƯỢC/là trạng thái active-chọn (`isLink`, "của tôi") mà không phản ánh 1 outcome dữ liệu không? CÓ ⇒ `accent`. Chỉ là câu chữ đọc bình thường dù là tiêu đề/giá trị ⇒ `default`. | `Typography.tsx:381` (`isLink` mặc định tự đổ `text-accent` khi không khai `color`) |
| **`accent` ↔ `success`** | Đổi dữ liệu (thất bại thay vì thành công) thì màu có BẮT BUỘC đổi theo không? CÓ ⇒ `success` (đang báo 1 outcome thật). KHÔNG, nó luôn giữ màu này bất kể kết quả ⇒ `accent`. | `ContentCommentThread.tsx:265` (accent, toggle "xem trả lời") ↔ `ContentHeader.tsx:158,197` (success, tone/leadingIconColor) |
| **`success` ↔ `warning`** | Trạng thái đã HOÀN TẤT/ĐÚNG hẳn hay còn ĐANG TIẾN TỚI 1 ngưỡng cần lưu ý sớm? Hoàn tất ⇒ `success`. Còn cơ hội/cần chú ý ⇒ `warning`. | [`principles/prominence/context.md`](../prominence/context.md) §4 (bẫy 4) — `ContinueCard.timeLeft` leo tone `neutral→warning` khi urgent, KHÔNG nhảy sang element/màu khác |
| **`warning` ↔ `danger`** | Hậu quả đã XẢY RA/không thể hoàn tác hay còn CƠ HỘI xử lý trước khi thành lỗi? Đã xảy ra ⇒ `danger`. Còn cơ hội ⇒ `warning`. | `Alert.tsx` `STATUS_ICON`: `warning`→`WarningIcon` (tam giác, còn cảnh báo) khác hẳn `danger`→`XCircleIcon` (đã sai) |

### 3b. Bốn cặp CÁCH MỘT BẬC — chỉ ra câu hỏi cấp trên chưa trả lời

| Cặp | Đọc thế nào |
|---|---|
| `muted` ↔ `accent` | Phân vân ở đây nghĩa là câu 2 (có phải tín hiệu tương tác không) chưa được trả lời dứt khoát — quay lại câu 2 trước khi hỏi tiếp phụ hay không. |
| `default` ↔ `success` | Phân vân nghĩa là câu 1 (đây có đang báo cáo 1 trạng thái dữ liệu thật không) chưa trả lời — một câu chữ không thể vừa "chỉ là chữ chính" vừa "đang báo 1 outcome" cùng lúc. |
| `accent` ↔ `warning` | Đang so "tín hiệu chung" với "báo động cụ thể" mà chưa chốt câu 1 — nếu đã xác định KHÔNG phải trạng thái dữ liệu thì `warning` không còn là ứng viên nữa. |
| `success` ↔ `danger` | Cách nhau 1 bậc trong dải 3 semantic vì BỎ QUA mất trạng thái trung gian `warning` — hỏi lại "có mức nửa chừng không" trước khi chọn 1 trong 2 đầu mút. |

### 3c. Sáu cặp CÁCH ≥2 BẬC — không có phép phân định, và cố ý không có

`muted`↔`success` · `muted`↔`warning` · `muted`↔`danger` · `default`↔`warning` ·
`default`↔`danger` · `accent`↔`danger`

**Phân vân giữa hai giá trị cách nhau ≥2 bậc là dấu hiệu CÂU HỎI 1 (có phải trạng thái
thật không) đọc SAI**, không phải chọn nhầm. Một chữ không thể vừa "phụ mờ/chữ chính
trung tính" vừa "báo lỗi nguy hiểm" mà không đi qua câu 1-2 trước. Viết thêm phép phân
định cho sáu cặp này là hợp thức hoá một lỗi đọc cấu trúc.

---

## 4. BẪY CẤU TRÚC — sai không phải vì chọn giá trị, mà vì đọc sai cấu trúc

1. **Gộp 2 lớp câu hỏi thành 1 rổ "phụ" — canon TỰ SỬA LƯNG chính nó (2026-07-29).** Phép
   thử cũ chỉ hỏi "con số có phải LÝ DO nhìn vào hàng, hay chỉ là sự kiện phụ đi kèm 1 hành
   động khác" — công thức 1 lớp này gộp NHẦM số lượt-react ("128", mang giá trị bằng-chứng-
   xã-hội + dính control) và số lượt-xem (trivia, đứng riêng) vào CHUNG 1 rổ "phụ", vì cả
   hai đều "đứng cạnh 1 icon/hành động". Bài học: KHÔNG được rút gọn 2 lớp §9a.1 thành 1
   câu duy nhất "cạnh 1 action → muted"; phải hỏi RIÊNG "có mang giá trị thông tin thật" và
   "có dính liền control active" — thiếu 1 trong 2 câu là sai. Neo: [`principles/color/context.md`](../color/context.md) §2,
   `color-system.html` mục 2 (đánh dấu SAI) vs mục 2b (phép thử đúng).
2. **TIER (dải liên tục) bị ép nhầm vào 3 token trạng thái.** `DifficultyChip.tsx` (
   `DIFFICULTY_COLOR`) cố tình KHÔNG dùng `success/warning/danger` cho 4 bậc độ khó — vì ép
   vào chỉ 3 token thì `advanced` và `insane` phải trùng `danger`, mất phân biệt. Tier dùng
   1 dải Tailwind riêng (`emerald→amber→orange→rose`). Dấu hiệu nhận biết: thang có **≥4
   bậc THỨ TỰ liên tục** (không phải 1 trạng thái nhị/tam phân) thì đó là TIER, không đi
   qua thang 6 giá trị của trục này.
3. **`neutral` (Chip) và `default` (Alert/Typography) là CÙNG một khái niệm "không tô",
   khác TÊN.** Đọc nhầm cấu trúc dễ tưởng `ChipTone` thiếu giá trị `default` (thiếu 1
   nhánh) hoặc 2 union đá nhau — thực ra đây là 2 type RIÊNG của 2 component, `ChipBase`
   tự map `neutral → "default"` nội bộ (`TONE_COLOR`, `ChipBase.tsx:51-57`) vì đặt tên theo
   quy ước "trung tính" của chip, không phải bất nhất cần hợp nhất.
4. **Hover đổi màu KHÔNG có nghĩa màu THẬT của phần tử đổi.** `src/CommentItem.tsx:165` —
   nút xoá bình luận là `text-muted` lúc nghỉ, chỉ ĐỔI sang `hover:text-danger-soft-
   foreground` khi rê chuột. Đọc nhầm cấu trúc: tưởng nút này "màu danger" nên khai
   `color="danger"` cố định — sai, vì hành động chưa xảy ra, `danger` chỉ là XEM TRƯỚC lúc
   hover, không phải trạng thái đã có của dữ liệu (khác trọng tâm câu hỏi 1a).
5. **Icon MANG NGHĨA TRẠNG THÁI bị mặc định "theo màu label"** thay vì đi qua `AlertStatus`.
   Neo bug thật: `SurfaceCard.leadingIcon` (outcomes list `ContentHeader`) khoá cứng theo
   màu label → checkmark ra màu đen thay vì xanh; sửa bằng prop `leadingIconColor?:
   AlertStatus` riêng ([`principles/icon/context.md`](../icon/context.md) §2c).
6. **Mỗi giá trị đúng CỤC BỘ nhưng CẢ VÙNG quá nhiều điểm nổi (accent-flood, §2c).** Neo:
   `CourseCard` 2026-07-22 — 3 check xanh + chip −55% xanh + CTA hồng = 4-5 điểm nổi cùng
   lúc, không điểm nào sai giá trị nhưng cả cụm mất tác dụng "nổi". Bẫy này không sửa được
   bằng cây §2 (cây chỉ quyết 1 chỗ), phải nhìn CẢ VÙNG.

---

## 5. NEO THẬT — thứ tự ưu tiên khi hai nguồn đá nhau

1. **Luật NGỮ NGHĨA đã chốt trong canon** (§9a/§9a.1, §2c "accent ≠ status", §5a.3 "dùng lại
   `AlertStatus`, không tự chế enum hẹp hơn") — màu ở trục này mã hoá Ý NGHĨA business
   (có phải trạng thái thật hay không), không phải một phép đo hình học lấy được từ hàng
   xóm, nên luật ngữ nghĩa THẮNG trước cả `src`.
2. **Type definition thật** (`TypographyColor`/`AlertStatus`/`ChipTone`) giới hạn thang GIÁ
   TRỊ hợp lệ — không tự thêm 1 tone mới song song.
3. **`src` thật** — chỉ dùng để biết NGỮ CẢNH gốc (đây từng là control gì), KHÔNG chép y
   nguyên class nếu nó rơi đúng vào phép thử ĐÃ bị sửa lưng. Neo: `ReactionButton` — `src`
   (`ReactionBar.tsx:60,79`) là `muted`+`xs` cho cả nút lẫn số, nhưng thầy chốt **"src không
   quan trọng"** ở case này và đổi hẳn theo phép thử 2 lớp §9a.1 (số "128" bỏ `muted`).
4. Ví dụ ngành ngoài — không dùng ở trục này; màu semantic là quyết định business riêng của
   hệ thống, không tham khảo ngành ngoài.

Neo cụ thể từng nhánh: [`example.html`](example.html).

---

## 6. VẠCH CẤM

| # | Cấm | Gate |
|---|---|---|
| 1 | Viết class màu tay (`text-danger`, `text-[#hex]`, `style={{color}}`) trên `Typography`/`Alert`/`Chip` khi prop `color`/`tone`/`status` diễn đạt được | ⬜ **CHƯA — gate cần viết** (không có `check-color.mjs`; quét `.storybook/components/**` tìm `text-(muted|accent|danger|success|warning)` NGOÀI file `Typography.tsx`/`ChipBase.tsx`/`Alert.tsx` chính nó) |
| 2 | Giá trị `color` ngoài 6 giá trị thang, đi qua prop | ✅ `tsc` — `TypographyColor`/`AlertStatus`/`ChipTone` là union literal |
| 3 | Giá trị màu ngoài thang viết THẲNG bằng className (bỏ qua prop hoàn toàn) | ⬜ CHƯA — `tsc` không bắt được vì không đi qua type; cần gate quét className tay |
| 4 | Tự chế 1 enum màu hẹp hơn (vd `"ok"|"error"` riêng) thay vì dùng lại `AlertStatus`/`TypographyColor` | ⛔ không gate được — kỷ luật (§5a.3) |
| 5 | Ép 1 TIER (≥4 bậc liên tục) vào 3 token trạng thái, làm 2 bậc trùng màu | ⬜ CHƯA — gate cần viết: quét prop nhận enum >3 giá trị nhưng map trực tiếp vào `AlertStatus`/`COLOR_CLS` |
| 6 | Icon mang nghĩa trạng thái khoá cứng màu theo ngữ cảnh khác (label/parent) thay vì `AlertStatus` riêng | ⛔ không gate được — kỷ luật (§5a.3), cần đọc hiểu ngữ nghĩa icon |
| 7 | Nhiều điểm nổi cùng lúc trong 1 vùng (accent-flood, §2c) | ⛔ không gate được — kỷ luật, phán đoán thẩm mỹ theo vùng |
| 8 | Copy màu từ `src` khi `src` khớp đúng phép thử CŨ đã bị sửa lưng (§9a.1) | ⛔ không gate được — kỷ luật, phải verify lại bằng 2 lớp câu hỏi mỗi lần, không tin `src` mặc định |

**Gate còn thiếu (#1/#3/#5), mô tả để viết:** quét mọi `className`/literal string trong
`.storybook/components/**` (trừ 3 file SSOT `Typography.tsx`/`ChipBase.tsx`/`Alert.tsx`)
khớp `text-(muted|accent|danger|success|warning)(-soft-foreground)?` hoặc `bg-(accent|
danger|success|warning)-soft`, báo đỏ — vì các token này CHỈ được sinh ra từ 3 map
(`COLOR_CLS`/`TONE_COLOR`/`STATUS_TINT`), không được viết tay ở call-site.
