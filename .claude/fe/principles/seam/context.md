# SEAM — khoảng cách giữa hai thứ (`gap`)

> Trục này trả lời đúng một câu: **hai thứ này cách nhau bao nhiêu.**
> Không trả lời padding (xem `inset/`), không trả lời margin (margin bị CẤM, xem §6).
> Neo code thật: [`example.html`](example.html).

---
# PHẦN A · NHẬN BIẾT — nạp phần này khi QUÉT
---

## 1. THANG — sáu bậc, không có bậc thứ bảy

| Bậc | Class | px | Quan hệ |
|---|---|---|---|
| `flush` | `gap-0` | 0 | MỘT đơn vị nghĩa — tiêu đề và phụ đề của cùng một dòng |
| `tight` | `gap-1` | 4 | MARK gắn vào một thứ duy nhất — icon trước nhãn, đơn vị sau số |
| `related` | `gap-2` | 8 | PEER trong một tập — hàng chip, hai nút, tên và mốc thời gian |
| `grouped` | `gap-3` | 12 | HÀNG xếp chồng trong một mặt — list row, avatar cạnh cột nội dung |
| `section` | `gap-6` | 24 | VÙNG khác nhau của một khối — header, body, footer của một card |
| `page` | `gap-8` | 32 | KHỐI riêng trên trang — block cạnh block |

SSOT của thang: `SeamScale` trong `.storybook/components/frames/_spacing.ts`. Viết số
(`gap={3}`) là **lỗi biên dịch**, không phải lỗi lint.

---

## 2. CÂY QUYẾT ĐỊNH — hỏi từ trên xuống, dừng ở câu YES đầu tiên

| # | Hỏi | Ra |
|---|---|---|
| 1 | Xoá một cái thì cái còn lại **mất nghĩa hoặc mất ngữ cảnh**? (số và đơn vị, icon và nhãn) | `flush` hoặc `tight` — sang §3 cặp 1 |
| 2 | Hai thứ **cùng loại, lặp lại, không cái nào là chủ**? (hàng chip, hàng nút) | `related` |
| 3 | Hai thứ **khác vai nhưng cùng tạo một dòng nhận diện**? (tên · badge · giờ) | `related` |
| 4 | Hai thứ là **nhiều vùng khác nhau trong cùng một đơn vị lớn hơn**? (header/body/actions của một comment) | `grouped` |
| 5 | Hai thứ là **các khối chức năng riêng, tự đứng được như một tính năng**? | `section` hoặc `page` — sang §3 cặp 5 |

**Trước khi tin kết quả cây: nếu component có nguồn `src` thật, ĐO nguồn đó và dùng số đo
được.** Cây chỉ là đường lui khi không có nguồn. Xem §5.

---

## 6. VẠCH CẤM

Mỗi dòng dưới đây là một luật **máy kiểm được**. Cột cuối cho biết đã có gate hay chưa.

| # | Cấm | Gate |
|---|---|---|
| 1 | Viết SỐ cho `gap` (`gap={3}`) thay vì chữ | ✅ `tsc` — `SeamScale` là union literal |
| 2 | Con của khung mang `margin` (trừ whitelist `mt-auto` · `ms-auto` · `-mx-*`) | ✅ `check-padding.mjs` |
| 3 | Viết bố cục tay (`flex`/`grid` + `gap-*` trong `className`) từ tầng `composite` trở lên | ✅ `check-seams.mjs` |
| 4 | Con của khung mang `margin` cùng lúc parent có `gap` (hai chủ một seam) | ✅ `check-padding.mjs` (luật `child-margin`) |
| 5 | Dùng giá trị ngoài thang (`gap-1.5` · `gap-4` · `gap-5`) | ✅ `check-seams.mjs` |
| 6 | Chép seam từ component khác không cùng `src` (bẫy §4.5) | ⛔ không gate được — kỷ luật |
| 7 | Báo xong khi mới đọc code, chưa đo `getComputedStyle` | ⛔ không gate được — kỷ luật |

2026-07-29 sửa hai dòng khai sai: dòng 3 nay áp từ tầng `composite` trở lên vì `tierOf` đã
đọc đúng tên thư mục thật, dòng 4 do `check-padding.mjs` bắt chứ không phải `check-seams.mjs`.

---
# PHẦN B · TRA KHI ĐÃ THẤY LỆCH — chỉ mở khi Phần A ra kết quả lệch
---

## 3. VÉT CẠN CA DỄ LẪN — đủ 15 cặp

Thang 6 bậc ⇒ `C(6,2) = 15` cặp. Liệt kê đủ 15, không chọn lọc.

### 3a. Năm cặp KỀ NHAU — đây là toàn bộ trận đánh

**Bằng chứng vì sao chỉ cần đánh ở đây: 4/4 lỗi seam thật đã ghi sổ đều là cặp kề nhau.**
Chưa từng có lỗi nào lệch ≥2 bậc. Xem neo trong `example.html` §3.

| Cặp | Phép phân định DỨT KHOÁT | Đã cắn thật |
|---|---|---|
| **`flush` ↔ `tight`** | Hai thứ có phải **đều là CHỮ** không? Cả hai là chữ và đọc liền thành một ý (tiêu đề trên, phụ đề dưới) ⇒ `flush`. Có một cái **không phải chữ** (icon, chấm, gạch) hoặc là hậu tố dính (đơn vị) ⇒ `tight`. | ✅ 1 lần |
| **`tight` ↔ `related`** | **MARK hay PEER.** Xoá một cái: phần còn lại vẫn **đứng độc lập hoàn chỉnh** ⇒ hai PEER ⇒ `related`. Phần còn lại vẫn có nghĩa nhưng **mất ngữ cảnh mà cái kia cấp** ⇒ MARK ⇒ `tight`. | ✅ 2 lần |
| **`related` ↔ `grouped`** | **ĐẢO THỨ TỰ ĐƯỢC KHÔNG.** Đổi chỗ hai cái mà nghĩa không đổi ⇒ PEER ⇒ `related`. Thứ tự mang nghĩa, **hoặc mỗi hàng là một LOẠI khác nhau** ⇒ hàng của một mặt ⇒ `grouped`. | ✅ 1 lần |

Hai cặp kề còn lại chưa cắn thật lần nào, mới là rủi ro lý thuyết: `grouped`↔`section` · `section`↔`page`.

### 3b. Bốn cặp CÁCH MỘT BẬC — hiếm, nhưng có đường phân định

| Cặp | Đọc thế nào |
|---|---|
| `flush` ↔ `related` | Phân vân ở đây nghĩa là chưa trả lời được "hai thứ này là MỘT ý hay HAI ý". Trả lời câu đó trước, rồi mới quay lại §3a. |
| `tight` ↔ `grouped` | Gần như luôn là do đọc nhầm MARK thành HÀNG. Một MARK không bao giờ là một hàng của mặt — nó không đứng riêng được. |
| `related` ↔ `section` | Nếu đang so PEER với VÙNG thì hai thứ đang so không cùng cấp. Vẽ lại cây một tầng. |
| `grouped` ↔ `page` | Hàng trong một mặt không bao giờ tương đương block trên trang. Lẫn ở đây là cây sai. |

### 3c. Sáu cặp CÁCH ≥2 BẬC — không có phép phân định, và cố ý không có

`flush`↔`grouped` · `flush`↔`section` · `flush`↔`page` · `tight`↔`section` ·
`tight`↔`page` · `related`↔`page`

Các cặp cách từ 2 bậc trở lên: phân vân ở đó là dấu hiệu cây vẽ sai, không phải chọn sai giá trị (luật xuyên trục 3 ở INDEX.md). Quay lại §2.

---

## 4. BẪY CẤU TRÚC — sai không phải vì chọn số, mà vì đọc sai cây

Sáu bẫy dưới đây **đều đã cắn thật**. Chúng không hiện ra trong cây §2 vì chúng xảy ra
TRƯỚC bước chọn giá trị.

1. **`gap` không có ai nhận.** Truyền `gap` vào một khung mà khung đó chỉ áp gap ở nhánh khác
   thì nó bị **bỏ im lặng**: không lỗi biên dịch, không lỗi lint, không cảnh báo gì.
   ⇒ Sửa xong phải **đo `getComputedStyle`**, không đọc code rồi tin.
   Trạng thái API của từng khung là việc của trục `frame` (xem `frame/context.md` §4), trục này
   không giữ neo cụ thể nào về khung — neo như vậy trôi theo mỗi lần khung đổi prop, và đã trôi
   thật một lần: bản trước của mục này còn mô tả một prop của `Container` đã bị xoá từ 2026-07-27.

2. **Hai chủ một seam.** Parent đặt `gap` và con đồng thời mang `margin` ⇒ hai nguồn cộng dồn,
   không ai đọc ra số cuối. Seam có đúng MỘT chủ: khung cha.

3. **Đọc theo TẦNG thay vì theo QUAN HỆ.** Bảng §1 nói "vùng khác nhau ⇒ `section`" không có
   nghĩa "hai composite thì luôn `section`". Hai composite mà **một cái là caption của cái kia**
   thì chúng là một cụm ⇒ `grouped`. Quan hệ quyết định, không phải tầng.

4. **Giả định nested phải nhỏ dần đều.** Không có luật nào bắt seam con nhỏ hơn seam cha.
   **Mỗi seam là một quyết định độc lập.** Neo: `CommentItem` có cha `gap-3` mà con cũng `gap-3`.

5. **Suy seam của component này từ component "giống hình".** Neo phản chứng đo được: cùng hình
   "cột nội dung", `QuestionRow` là `gap-1` còn `CommentItem` là `gap-2` — **cả hai đều đúng**,
   vì mỗi cái neo nguồn riêng. Suy chéo là cách chắc chắn nhất để sai một nửa số chỗ.

6. **Nhịp gần-đều là dấu hiệu sai.** Liệt kê seam theo thứ tự dọc: dãy gần như đều nhau
   (`24/12/24/24`) nghĩa là nhịp không kể ra được nhóm nào. Đúng cấu trúc thì dãy phải **kể ra
   được nhóm** (`24/12/12/24`).

---

## 5. NEO THẬT — thứ tự ưu tiên khi hai nguồn đá nhau

1. **`src` thật của CHÍNH component đang sửa** (khai trong file header "ported from…") — ĐO nó.
2. Cây quyết định §2 — chỉ dùng khi (1) không tồn tại.
3. Ví dụ ngoài ngành (Facebook, GitHub…) — **chỉ là dữ liệu tham khảo** xem ngành có hội tụ
   không, **không bao giờ** thay được (1). Neo: GitHub dùng `4px` cho hàng byline, app này dùng
   `8px`, cả hai đều đúng trong ngữ cảnh của mình.

Neo cụ thể từng nhánh: [`example.html`](example.html).
