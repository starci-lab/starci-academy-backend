# B1 — CHỌN VÙNG

> **Phạm vi:** một lần khi mở phiên, và mở lại bất cứ lúc nào thầy muốn thêm/bớt vùng.
> Read-only.

Vùng là **đơn vị phạm vi** của cả phiên. Bước B2 quét mười lăm trục trên **từng vùng**, nên
vùng khoanh sai thì mọi vòng sau đều lệch — quét thừa chỗ thầy không quan tâm, và bỏ sót chỗ
thầy đang khó chịu.

---

## VÀO

File phiên từ B0 + màn đang render.

## LÀM

Thầy khoanh vùng theo một trong hai đường. **Đường nào cũng được, đừng ép thầy theo đường của
mình.**

### Đường 1 — thầy đưa ảnh có khoanh màu

Thầy chụp màn hình rồi khoanh/tô lên đó. Việc của trò là **dịch vùng khoanh thành component
thật**, và dịch xong phải **nói lại cho thầy xác nhận** trước khi quét:

> "Vùng hồng em hiểu là hàng URL trong `ChallengeDeliverableList`, vùng vàng là ô brief bên
> trái. Đúng chưa ạ?"

⚠️ Ảnh chỉ nói được **chỗ nào**, không nói được **component nào**. Hai component lồng nhau
trông y hệt trên ảnh. Dịch sai ở đây là quét sai cả phiên, mà lỗi này im lặng — nên **luôn hỏi
lại**, kể cả khi thấy rõ.

### Đường 2 — trò render lớp phủ đánh số

Thầy không tiện khoanh thì trò đánh số các vùng cho thầy chọn: đọc DOM, lấy các node có
`data-anat-part`, đánh số theo thứ tự đọc, rồi liệt kê ra dạng chữ để thầy gọi tên.

```js
[...document.querySelectorAll('[data-anat-part]')]
    .map((el, i) => `${i + 1}. ${el.getAttribute('data-anat-part')}`)
```

Thầy chỉ cần nói "vùng 2 với 5". Cách này nhanh hơn khoanh tay khi màn nhiều node.

### Với mỗi vùng, ghi đủ ba thứ vào `session.md`

| Trường | Nội dung |
|---|---|
| `id` | mã bền, dùng lại suốt mọi vòng (`R1`, `R2`…). **Không đổi id giữa chừng** — round cũ trỏ vào đó |
| `component` | tên component THẬT + đường dẫn file, không phải mô tả vị trí |
| `ý định` | một dòng: thầy thấy chỗ này **sai cái gì**, hoặc "chưa biết, soi giúp" |

Cột `ý định` được phép để trống theo nghĩa "thầy chưa nói, trò tự soi" — nhưng phải ghi rõ là
trống, đừng tự bịa một ý định rồi quét theo nó.

## CỔNG ĐO

- Mỗi vùng trỏ tới một **component có thật** (mở được file, không phải mô tả chỗ trên ảnh).
- Mọi vùng đã được thầy xác nhận là dịch đúng.
- Id vùng không trùng, không đổi so với vòng trước.

## RA

Mục `## Vùng` trong `session.md` điền xong, dạng bảng.

## DỪNG KHI

- Vùng khoanh trùm nhiều component mà không rõ thầy nhắm cái nào ⇒ **hỏi**, đừng chọn cái to
  nhất cho chắc.
- Vùng rơi vào `src/` (app thật) chứ không phải `.storybook` ⇒ dừng hẳn. Lane này chỉ đụng bản
  vẽ; `src` là công trình, chỉ được đọc.
- Thầy khoanh một chỗ mà chỗ đó là **glyph của vendor** chứ không phải component của hệ ⇒ nói
  rõ giới hạn đó trước khi nhận vùng.
