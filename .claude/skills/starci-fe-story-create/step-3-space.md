# B3 — KHÔNG GIAN

> **Trục nạp:** [`seam`](../../fe/principles/seam/context.md) ·
> [`inset`](../../fe/principles/inset/context.md) ·
> [`surface`](../../fe/principles/surface/context.md)
> **Phạm vi:** **LẶP** theo từng component, đi `atom → frame → composite → block → page`.
> Barrier giữa mỗi tầng; trong cùng một tầng thì các component độc lập, chạy song song được.

Ba trục ở đây quyết **bộ xương của bố cục**: khoảng cách giữa hai thứ, lòng của một mặt, và
đường viền của mặt đó. Làm trước B4 vì nội dung đặt vào một cái khung, không phải ngược lại.

---

## VÀO

Cây đã được thầy duyệt ở B2.

## LÀM

Với **mỗi component**, theo đúng thứ tự ba trục:

**1. `seam` — mọi khoảng cách giữa hai thứ.** Đi qua cây quyết định của trục, không chọn theo
cảm giác. Viết bằng **CHỮ**, số là compile error:

```tsx
<Stack.V gap="grouped">   // ✅
<Stack.V gap={3}>         // ❌ compile error
```

`gap` phải vào **một khung tự sở hữu nhịp**. Neo đã cắn: màn viết `<Container gap={8}>` mà seam
thật đo ra **0px**, vì `Container` chỉ áp gap khi có slot. **Viết `gap` mà không ai nhận còn tệ
hơn không viết** — đọc code tưởng đã đặt nhịp rồi.

🧭 Chỗ hay lẫn nhất là `related` với `grouped`, có phép thử: **đổi chỗ hai con** — vẫn hiểu là
đồng hạng thì `related`, lú là có thứ tự thì `grouped`.

**2. `inset` — lòng của mỗi mặt.** Cũng viết bằng chữ, cùng thang trong `_spacing.ts`.

`inset` khác `seam` dứt khoát: **seam ở GIỮA hai thứ, inset ở TRONG một thứ**. Nên
`padding="related"` là câu vô nghĩa, hai bộ từ không dùng lẫn.

Cần một bậc không có trong thang ⇒ khai ngoại lệ **theo dòng, kèm lý do**:
`// inset-exception: <lý do>`. Khai suông không có lý do vẫn bị cổng bắt. Và ngoại lệ **hiện ra
chứ không im**: con số đó bò lên nghĩa là thang lại thiếu bậc.

**3. `surface` — bo góc, viền, đổ bóng.** Bo góc lồng nhau theo công thức đồng tâm, đừng chọn
từng cái rời.

**4. Kiểm nhịp bằng cách liệt kê.** Viết ra mọi seam theo thứ tự dọc của màn. 🧭 Dãy số **gần
đều nhau** gần như chắc chắn là sai — nhịp phải **kể ra được nhóm**, mà đều nhau thì không kể
được gì.

Chế độ **SOI**: với mỗi giá trị đang có, hỏi *"giá trị này có đi qua cây quyết định của trục
không, hay ai đó chọn theo mắt"*, và **đo DOM** để biết giá trị thật, đừng đọc source.

## CỔNG ĐO

```bash
node scripts/check-seams.mjs && node scripts/check-padding.mjs
```

Kèm **đo DOM thật** — đây mới là cổng thật của bước này:

```js
getComputedStyle(el).gap        // seam thật, không phải seam trong source
getComputedStyle(el).padding
getComputedStyle(el).borderRadius
```

⚠️ **Cổng xanh không chứng minh hình đúng.** Lỗi tầng layout không làm vỡ `tsc` vì class
Tailwind sai tên thì im lặng không sinh CSS. Neo 2026-07-29: `Container` có bug container-query
**không bao giờ fire** mà `tsc` + cả mười cổng + eslint đều xanh — chỉ `getComputedStyle` mới
lộ ra.

⚠️ Trước mọi số đo, xác nhận `document.hidden` tắt và `window.innerWidth` khác 0. Không thì mọi
rect trả 0 và code lành trông y hệt đang vỡ.

## RA

Ghi vào `session.md`: component nào đã qua, giá trị chốt cho từng trục, số đo DOM xác nhận.

## DỪNG KHI

- Một seam mà **hai khung cùng đòi sở hữu** ⇒ dừng, quyết lại ai là chủ. Một seam một chủ.
- Phân vân giữa hai bậc **cách nhau từ hai nấc trở lên** ⇒ đó là dấu hiệu **cây vẽ sai**, không
  phải chọn sai. Quay lại B2 thay vì chọn bừa.
- Thang thiếu bậc thật ⇒ đề xuất thêm bậc cho thầy, đừng khai ngoại lệ hàng loạt để né.
