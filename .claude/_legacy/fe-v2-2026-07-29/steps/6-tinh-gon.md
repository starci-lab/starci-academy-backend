# BƯỚC 6 — TINH GỌN (lập 2026-07-28, chờ thầy fixback)

> Danh sách việc còn lại sau khi cây `CourseContents` đã sạch. Đọc `continue.md` trước.
>
> ⚠️ **PHÉP ĐO PHẢI LÀM TRƯỚC MỌI VIỆC XOÁ:** đếm call-site của từng member. Scanner đếm
> `Object.assign` viết 2026-07-28 **hỏng** (ra 0 gần như toàn bộ, còn liệt `props` như một
> member), nên **chưa có số nào đáng tin về cái gì đang chết**. Xoá khi chưa đo là đoán.

---

## 0. Luật nền của bước này

> **Namespace chỉ hợp lệ khi các member là những HÌNH THÁI của cùng một thứ.**
> Gom vì cùng một chủ đề là gom sai.

`Button.Base/.Group/.RadioGroup` hợp lệ, đều là nút.
`Feedback.Callout/.Empty/.Confirm` SAI: một dải trong dòng, một khối canh giữa, một hộp
thoại. Chỉ chung nhau chữ "feedback".

---

## 1. Cổng TRƯỚC, dọn sau

Làm cổng trước vì các bước dưới đụng rất nhiều file, và không có cổng đếm-theo-STATE thì
lại báo xanh trên một phép đo hụt.

### 1a. `check-structure` — gộp ba câu hỏi, đếm theo STATE

| Hỏi | Hiện đang hụt |
|---|---|
| mỗi STATE có bật `showAnatomy`? | `List.Meta` 3/6 state trống, mà đếm theo FILE thì thấy "có" |
| component compose thứ khác có PHÁT part? | **9 component phát 0 part, trong đó 5/6 FRAME** |
| part phát ra có VÀO ĐƯỢC cây? | (`check-orphan-parts` hiện tại đã hỏi) |

> **Vì sao phải gộp:** `check-orphan-parts` chỉ hỏi *"badge sai chỗ nào"*, nên nó **thưởng
> cho việc không badge**. Component im lặng hoàn toàn thì không có gì để mồ côi, cổng xanh.
> Đó là lý do thầy phải nhắc bằng mắt nhiều lần.

Thay luôn `check-deps-coverage` ("import gì mà không khai") — nó là tập con của câu
"badge gì mà không khai".

### 1b. Tách `check-padding`
Nó đang giữ HAI luật (padding lệch thang · margin của con) nên lúc đỏ không biết đỏ vì gì.
Vế padding nay compiler lo ở tầng frame ⇒ bỏ, giữ vế margin.

### 1c. Siết nhánh fallback của `check-orphan-parts`
`if (!mine.length) mine = stories` cho phép một part khai ở BẤT KỲ đâu cũng tính là đã khai
cho component không có story. Siết lại: chỉ áp cho module `_`-prefixed (atom-internal).
Negative control hiện tại KHÔNG phủ nhánh này.

---

## 2. Phá namespace gom theo chủ đề

| Bỏ | Thành | Vì sao |
|---|---|---|
| `Feedback.Callout` | **`Callout`** | dải cảnh báo trong dòng |
| `Feedback.Confirm` | **`ConfirmDialog`** | hộp thoại, hình khác hẳn |
| `Feedback.Empty` | gộp vào **`AsyncContent`** | nó chỉ tồn tại để async gọi |
| `AsyncContent.Empty` / `.Error` | **xoá** | lớp mỏng chỉ gắn icon mặc định: hai component cho một giá trị mặc định |

Soi tiếp cùng khuôn: **`Stats`** gom `ProgressMeter`/`ProgressRing`/`StatPair`/`StatGridCard`/
`StatRibbon`/`SegmentBar` — sáu thứ vẽ khác nhau hoàn toàn.

---

## 3. Cắt trùng lặp ở ba tầng dưới `design`

Con số bất thường: **composites 37 component vs frames 6**. Composite đang là bãi chứa của
BỐN loại khác hẳn nhau.

### 3a. Lớp bọc mỏng — 15 component render ≤1 loại con và <90 dòng
`ButtonGroup` [Button] 67 dòng · `FloatingActionButton` [Button] 33 · `HighlightCard`
**14 dòng, 0 con**.
⚠️ `ButtonGroup` bọc `Button`, mà hệ **đã có** `Button.Group` ở tầng atom ⇒ nghi **hai
component cho một khái niệm**. Đo call-site rồi xoá một.

### 3b. F3 — năm atom cùng trả lời "chọn 1 trong N"
`Tabs` · `ExtendedTabs` · `SegmentedToggle` · `FlexWrapButtonRadio` · `SelectableCardGroup`.
**3/5 tự khai là block cũ bê thẳng vào `atoms/`.** Năm cửa cho một câu hỏi là bốn cửa thừa.

### 3c. F4 — atom mang nội dung DOMAIN, phải tụt xuống `design`
`PricePoint` biết tiền + kỳ · `UserCell` biết user (lại còn là một cụm).

### 3d. `Input` 10 member — có phải 10 HÌNH THÁI?
`Number`/`Currency` khác nhau ở **format**, `Search` khác `Text` ở **icon**. Nghi vài cái là
PROP chứ không phải member (§6b).

---

## 4. Bỏ đường thứ hai

| Bỏ | Giữ | Vì sao |
|---|---|---|
| prop `parts` | `annotate` | `parts` KHÔNG dựng cây nữa, chỉ bị rút phẳng thành chú giải; cây lồng nhau trong nó là **lời mời hiểu sai** |
| `Container.body` | `children` | Container còn MỘT vùng ⇒ hai tên cho một thứ |

---

## 5. Đổi tên tầng `heroui` → `vendor`

Phosphor cũng là thư viện ngoài, cũng không có story của ta, nhưng không lọt vào `heroui`.
Tên đang hẹp hơn thực tế nó phải phủ.

---

## 6. Nợ kỹ thuật còn treo (không thuộc tinh gọn)

- **`Stepper`** 3 margin `mt-3`/`mb-3`: bù canh lề theo chiều cao vòng tròn `size-8`, hàng
  đang `items-start`. Sửa đúng luật phải TÁCH SUB-ROW `items-center` cho circle + connector,
  tức đổi cấu trúc chứ không đổi class.
- **16 file** import HeroUI mà story chưa khai `tier: "heroui"`. Đáng chú ý: `RichText` lấy
  `Typography` thẳng từ HeroUI trong khi hệ đã có atom.
- **`_legacy`**: 5 link Deps gãy + 378 leaf thiếu `code`; 4 file story lỡ dịch sang English
  trước khi thầy bảo dừng, chưa revert.
- **16 file ngoài closure** còn tiếng Việt trong chuỗi hiện UI.
- **`BlockAnatomy` không quét được PORTAL** ⇒ `KeyValue.List` khai đúng vẫn không hiện.

---

## Thứ tự

**1 → 3a/3b (cắt trùng, rẻ, không đổi hình) → 3c (đổi tier = đổi import) → 2 (đụng nhiều
tên nhất) → 4 → 5.**

Cắt trùng lặp trước khi di chuyển tầng, di chuyển tầng trước khi đổi tên: mỗi bước sau đắt
hơn bước trước, và bước trước làm giảm số thứ bước sau phải đụng.
