# BUTTON — variant · size · vị trí trong cụm

> Trục này trả lời đúng một câu: **nút này `variant` gì, `size` gì, đứng ở đâu trong cụm.**
> Không trả lời khoảng cách giữa các nút (xem `seam/`), không trả lời icon dùng con nào
> (xem `icon/` — chưa dựng). Neo code thật: [`example.html`](example.html).
>
> ⚠️ Trục này **ĐANG TREO một phần**. Mô hình 4 tầng nhấn mạnh giảm dần (`ghost` là tầng
> thấp hơn `tertiary`, không phải "khác hình cùng cấp") đã **✅ CHỐT** (thầy chốt
> 2026-07-29, xem [`principles/button/context.md`](../button/context.md) §2 câu 3-6,
> `ghost-vs-tertiary-system.html` mục 3). Nhưng
> `button-variant-system.html` mục 6 vẫn còn 1 khoản chưa làm: **chưa có đợt quét lại
> toàn bộ `ghost`/`secondary` hiện có trên diện rộng** — luật 4 tầng chỉ áp cho việc XÂY
> MỚI, không hồi tố. Xem `choThayChot` ở cuối.

---

## 1. THANG

### 1a. `ButtonVariant` — bảy giá trị, không có giá trị thứ tám

SSOT: `button-tokens.ts:22` (`.storybook/components/atoms/buttons/Button/`), khớp đúng
`node_modules/@heroui/styles/dist/components/button/button.styles.d.ts:15-23` (HeroUI thật
khai đủ 7).

| Giá trị | HERO_VARIANT map | Ý nghĩa | Call-site trong `src` |
|---|---|---|---|
| `primary` | `primary` | CTA CHÍNH DUY NHẤT của 1 khối/trang | 136 |
| `secondary` | `secondary` | Hành động quan trọng thứ 2 — cạnh `primary` HOẶC đứng một mình khi là hành động chính của 1 cụm nhỏ | 86 |
| `tertiary` | `tertiary` | Hành động phụ, không cần nổi — phổ biến NHẤT (77) nhưng atom từng THIẾU tới 2026-07-29 | 77 |
| `outline` | `outline` | Viền rõ, nền trong suốt — hiếm, dùng khi nút đứng ĐƠN LẺ trên nền cần tách biệt | 6 |
| `ghost` | `ghost` | Không viền không nền, chỉ hiện khi hover — tầng THẤP NHẤT của thang nhấn | 38 |
| `danger` | `danger` | Phá huỷ, nổi bật (nền đỏ đặc), chưa qua bước xác nhận nào khác | 3 |
| `danger-soft` | mượn `secondary` + `VARIANT_CLS` riêng | Phá huỷ nhưng nhẹ hơn — đã/sẽ qua xác nhận riêng | 10 |

Viết `variant` ngoài 7 giá trị này là **lỗi biên dịch** (`ButtonVariant` là union literal).

### 1b. `ButtonSize` — ba giá trị (`button-tokens.ts:48`)

| Giá trị | Khi nào |
|---|---|
| `sm` | Hàng dày (toolbar, row hành động trong list), nút phụ cạnh nội dung nhỏ |
| `md` | Mặc định — CTA thường, hàng nút trong modal/drawer |
| `lg` | Nút CTA đơn độc nổi bật (hero, trang đăng ký) |

`size` KHÔNG có phép vét cạn C(3,2) riêng ở đây: chưa tìm được bằng chứng DRIFT thật nào
giữa `sm`/`md`/`lg` trong canon (khác hẳn `variant`, nơi có tới 4 lỗi thật đã cắn — xem §4).
Chọn `size` theo mật độ khung chứa nó, không phải theo cây quyết định riêng.

---

## 2. CÂY QUYẾT ĐỊNH — hỏi từ trên xuống, dừng ở câu YES đầu tiên

| # | Hỏi | Ra |
|---|---|---|
| 1 | Hành động này **phá huỷ dữ liệu hoặc không thể hoàn tác** (xoá, huỷ đăng ký, tắt vĩnh viễn)? | sang nhánh DANGER (§2a) |
| 2 | Đây là **con đường DUY NHẤT tới mục tiêu CHÍNH của cả khối/trang** đang chứa nó (không phải chỉ 1 tiện ích cục bộ)? | `primary` |
| 3 | Cụm chứa nút này có **≥3 mức nhấn mạnh cần phân biệt rõ** (một hàng nhiều hành động xếp theo độ ưu tiên)? | tầng THẤP NHẤT của cụm → `ghost`; các tầng trên áp lại từ câu 2 |
| 4 | Nút đứng **ĐƠN LẺ** (không có nút nào khác trong cùng hàng) và **cần viền rõ để tách khỏi nền** (nền màu/ảnh, không phải nền card trắng mặc định)? | `outline` |
| 5 | Đây là mức quan trọng **THỨ 2 đứng cạnh `primary`**, HOẶC là **hành động chính của 1 cụm nhỏ tự trị** (không có mục tiêu nào lớn hơn đang cạnh tranh nó ngay tại chỗ)? | `secondary` |
| 6 | Còn lại — cụm chỉ có 2 mức, nút phụ chỉ cần **RÕ RÀNG là một nút** (không tàng hình)? | `tertiary` |

**§2a — nhánh DANGER** (chỉ vào khi câu 1 = YES):

| # | Hỏi | Ra |
|---|---|---|
| a1 | Cần người dùng **DỪNG LẠI VÀ CẢNH GIÁC NGAY TẠI NÚT** (nền đỏ đặc, chưa qua bước xác nhận nào khác trước đó)? | `danger` |
| a2 | Còn lại (đã/sẽ qua modal xác nhận riêng, hoặc mức độ nhẹ hơn) | `danger-soft` |

Câu 2 dùng test của §15a (đã kiểm chứng, KHÔNG dùng giả thuyết "secondary chỉ đi kèm
primary" — xem §4.1). Câu 3-6 dùng đúng mô hình 4 tầng đã chốt của §15b.

---

## 3. VÉT CẠN CA DỄ LẪN — đủ 21 cặp

Thang 7 giá trị ⇒ `C(7,2) = 21` cặp. Bảy giá trị chia 2 HỌ khác trục: HỌ NHẤN MẠNH
(`primary`/`secondary`/`tertiary`/`outline`/`ghost`, xếp theo đúng thứ tự khai trong
`button-tokens.ts:22`) và HỌ PHÁ HUỶ (`danger`/`danger-soft`). `C(5,2)=10` trong họ nhấn
mạnh + `C(2,2)=1` trong họ phá huỷ + `5×2=10` cặp CHÉO 2 họ = 21.

### 3a. Năm cặp KỀ NHAU — đây là toàn bộ trận đánh

**Bằng chứng vì sao chỉ cần đánh ở đây**: 4/4 va chạm thật đã ghi sổ (§15b, `example.html`
§3) đều là `tertiary`↔`ghost` hoặc `secondary`↔`tertiary` — cặp kề nhau trong họ nhấn mạnh.

| Cặp | Phép phân định DỨT KHOÁT | Đã cắn thật |
|---|---|---|
| **`primary` ↔ `secondary`** | Xoá nút này, người dùng còn cách nào khác tới **mục tiêu CHÍNH của cả trang/khối lớn** không? KHÔNG còn cách nào khác ⇒ `primary`. Đây chỉ là 1 tiện ích cục bộ (refresh, reorder, xem thêm) dù đứng một mình ⇒ `secondary`. | chưa (đã kiểm chứng lý thuyết ở §15a, chưa có ca gán sai ghi sổ) |
| **`secondary` ↔ `tertiary`** | Nút phụ này **tự nó có trọng lượng quyết định ngang một lựa chọn kinh doanh thật** (vd "Try free" cạnh "Enroll") ⇒ `secondary`. Nút phụ chỉ là **thao tác lùi lại/phụ trợ** cho hành động chính cạnh nó (vd "Huỷ" cạnh "Gửi") ⇒ `tertiary`. | ✅ 2 lần — `ContentCommentComposer.tsx` (từng `ghost`), `CourseQaComposer.tsx` (từng `secondary`), cả hai đổi về `tertiary` |
| **`tertiary` ↔ `outline`** | Nút đứng **ĐƠN LẺ** trên nền cần tách biệt (không phải cạnh nút khác trong cùng hàng) ⇒ `outline`. Nút đứng **TRONG một cụm nhiều nút**, vai trò phụ ⇒ `tertiary`. | chưa |
| **`outline` ↔ `ghost`** | Nút có **viền nhìn thấy ở trạng thái tĩnh** (không cần hover mới thấy) ⇒ `outline`. Viền/nền **chỉ hiện khi hover**, thường icon-only cạnh nội dung khác ⇒ `ghost`. | chưa |
| **`danger` ↔ `danger-soft`** | Hành động cần **cảnh giác NGAY tại nút**, chưa qua xác nhận nào khác ⇒ `danger`. Đã/sẽ qua modal xác nhận riêng, hoặc mức nhẹ hơn ⇒ `danger-soft`. | chưa |

### 3b. Sáu cặp CÁCH ≥2 BẬC trong CÙNG họ nhấn mạnh — hiếm, đọc lại câu hỏi cấp trên

`primary`↔`tertiary` · `primary`↔`outline` · `primary`↔`ghost` · `secondary`↔`outline` ·
`secondary`↔`ghost` · `tertiary`↔`ghost`.

**Phân vân ở đây là dấu hiệu đã bỏ qua một câu hỏi cấp trên trong cây §2**, không phải chọn
sai bậc. Ví dụ phân vân `primary`↔`ghost`: quay lại câu 2 và câu 3 — cụm này có thật ≥3 mức
không, và nút đang xét có thật là "con đường duy nhất tới mục tiêu chính" không. Trả lời lại
2 câu đó trước, đừng chọn trực tiếp giữa 2 đầu thang.

### 3c. Mười cặp CHÉO 2 HỌ — không có phép thử, và cố ý không có

Mọi cặp {`primary`,`secondary`,`tertiary`,`outline`,`ghost`} × {`danger`,`danger-soft`}
(10 cặp). Đây là **KHÁC TRỤC hoàn toàn**: một bên là Ý ĐỊNH (phá huỷ hay không), một bên là
MỨC NHẤN MẠNH (nổi bao nhiêu). Phân vân giữa ví dụ `secondary` và `danger-soft` nghĩa là
CHƯA trả lời được câu 1 của cây (hành động này có phá huỷ không) — quay lại câu 1, đừng viết
phép phân định giữa 2 trục khác nhau.

---

## 4. BẪY CẤU TRÚC — sai không phải vì chọn giá trị, mà vì đọc sai cấu trúc

1. **Tin giả thuyết tự nghĩ thay vì đọc code thật.** Giả thuyết thầy đưa "`secondary` chỉ đi
   kèm `primary`, còn lại `tertiary`" đã bị **BÁC BỎ bằng ≥8 ca thật** (xem §2 câu 2 của
   tài liệu này) — `secondary` đứng một mình rất phổ biến (`SystemStatus/index.tsx:67-75`,
   `PinnedProjectCard/index.tsx:90-129`). Áp giả thuyết này vào câu 2 của cây sẽ chọn sai
   hàng loạt.

2. **Suy variant của component này từ 1 component "trông giống" trong `src`.** `ghost` và
   `tertiary` KHÔNG có ranh giới sạch ngay trong chính `src` thật: 2 tác giả làm CÙNG một
   pattern (nút reorder icon-only, nút "Huỷ" cạnh Confirm) nhưng chọn 2 variant khác nhau
   (`ghost-vs-tertiary-system.html` mục 1-2). Copy variant từ 1 chỗ "giống hình" là cách chắc
   chắn nhất để sai, vì bản thân nguồn đó có thể đã sai.

3. **Tưởng luật 4 tầng nghĩa là phải quét sửa lại DIỆN RỘNG.** Thầy chốt luật 4 tầng CHỈ áp
   cho công việc VỀ SAU (build/sửa block mới) — KHÔNG kích hoạt một đợt quét lại toàn bộ
   `ghost`/`secondary` hiện có (xem cảnh báo ⚠️ ở đầu tài liệu này, dòng "Luật áp dụng CHO
   CÔNG VIỆC VỀ SAU"). Chỉ 2 va chạm CỤ THỂ lộ ra ngay lúc đối chiếu đã được vá.

4. **Neo cũ đã CHẾT — code trôi nhanh hơn tài liệu.** `principles.md` §15b và
   `ghost-vs-tertiary-system.html` mục ① trích `SubmissionAttemptsDrawer.tsx` dòng 214/222
   làm ví dụ va chạm "`tertiary` cạnh `ghost`". Đọc lại file thật (2026-07-29, xác minh trong
   phiên viết trang này): file đã **REBUILT TOÀN BỘ** cùng ngày ("có trang này mà" — phát
   hiện bản trước không hề đối chiếu `src` thật), 2 nút "Xem chi tiết"/"Xem bài nộp" đó
   **KHÔNG CÒN TỒN TẠI** — đổi hẳn sang mô hình "cả hàng LÀ hành động chọn" (`onSelect` +
   đóng drawer cùng 1 gesture, không còn 2 nút riêng). Trước khi trích 1 neo từ tài liệu,
   PHẢI grep lại file thật, đừng tin số dòng cũ.

5. **Đếm `variant="…"` không lọc theo component.** Prop tên `variant` trùng tên xuất hiện ở
   nhiều component KHÔNG liên quan `ButtonVariant`: `Tabs`, `Select`, `Input`, `TextField`,
   `InputGroup` đều tự có `variant` riêng của chúng. Audit §15d phải LOẠI TRỪ tường minh các
   component này khi đếm 20 call-site `variant="secondary"` thật của `Button`
   (xem VẠCH CẤM §6 mục 3 của tài liệu này). Grep `variant="…"` không kèm ngữ cảnh import `Button`/`HeroButton`
   sẽ đếm lẫn cả trục khác.

---

## 5. NEO THẬT — thứ tự ưu tiên khi hai nguồn đá nhau

1. **`src` thật** — nhưng LƯU Ý: chính `src` KHÔNG nhất quán ở cặp `ghost`↔`tertiary`
   (§4.2), nên với CẶP NÀY, `src` KHÔNG được dùng làm neo tuyệt đối. Với các cặp khác (đặc
   biệt câu 2 cây quyết định, §15a), `src` là bằng chứng đáng tin — đọc đủ nhiều file trước
   khi kết luận.
2. **Luật 4 tầng đã chốt của thầy** (§2 câu 3-6 và case đặc biệt `example.html` mục 2 của
   tài liệu này) — dùng khi (1) tự nó lệch.
3. Cây quyết định §2 — đường lui khi không có cả (1) lẫn (2) áp được.

Neo cụ thể từng nhánh: [`example.html`](example.html).

---

## 6. VẠCH CẤM

| # | Cấm | Gate |
|---|---|---|
| 1 | Viết `variant`/`size` ngoài 7/3 giá trị của thang | ✅ `tsc` — `ButtonVariant`/`ButtonSize` là union literal |
| 2 | Dùng `ghost` cho cụm chỉ có 2 mức (đáng lẽ `tertiary` theo luật 4 tầng, §2 câu 3-6) | ⬜ **CHƯA — gate cần viết**: quét mọi hàng có ĐÚNG 2 `Button` liền kề trong cùng 1 `StackH`/`Cluster`/footer, nếu 1 trong 2 là `ghost` và cụm không có nút thứ 3 nào khác ⇒ báo đỏ |
| 3 | Đếm/gán `variant` mà không loại trừ prop `variant` trùng tên của `Tabs`/`Select`/`Input`/`TextField`/`InputGroup` (bẫy §4.5) | ⬜ **CHƯA — gate cần viết**: script phải giới hạn theo import cụ thể (`Button`/`HeroButton`/`ButtonBase`) trước khi đếm `variant="…"` |
| 4 | Quét sửa lại `ghost`/`secondary` hiện có trên diện rộng khi chưa có va chạm cụ thể (bẫy §4.3) | ⛔ không gate được — kỷ luật, phạm vi do thầy chốt |
| 5 | Suy variant từ 1 component "trông giống" trong `src` (bẫy §4.2) | ⛔ không gate được — kỷ luật |
| 6 | Trích neo từ tài liệu ([`principles/INDEX.md`](../INDEX.md)/artifact) mà không grep lại file thật trước (bẫy §4.4) | ⛔ không gate được — kỷ luật |

**Gate còn thiếu (#2, #3), mô tả để viết:** cả hai đòi hỏi phân tích JSX theo CỤM (đếm số
`Button` anh em trong cùng 1 node cha `StackH`/`Cluster`), phức tạp hơn 1 regex đơn — cần
parser AST như `check-one-instance-per-state.mjs` đã làm cho bài toán tương tự.
