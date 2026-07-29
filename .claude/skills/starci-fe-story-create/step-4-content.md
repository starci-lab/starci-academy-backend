# B4 — NỘI DUNG

> **Trục nạp, THEO ĐÚNG THỨ TỰ NÀY:**
> [`text`](../../fe/principles/text/context.md) → [`icon`](../../fe/principles/icon/context.md) ·
> [`color`](../../fe/principles/color/context.md) ·
> [`button`](../../fe/principles/button/context.md) → [`press`](../../fe/principles/press/context.md) ·
> [`markdown`](../../fe/principles/markdown/context.md)
> **Phạm vi:** **LẶP** theo component, cùng vòng với B3 — không gian trước, nội dung sau.

Sáu trục quyết thứ nằm **trong** cái khung mà B3 vừa dựng.

---

## Thứ tự trong bước này KHÔNG được đảo

**`text` phải chốt trước `icon`.** Cỡ icon tra theo **cỡ chữ nó đứng cạnh** — chốt icon trước
rồi chữ đổi cỡ là icon đứng lại một mình, và không cổng nào bắt.

Neo 2026-07-29, đo thật: một caret khai `size-4` trong source nhưng DOM ra **14px**, vì thư viện
`cloneElement` node đó và **ghi đè hẳn** class của mình. Cùng ngày, phép đếm *"5/5 call-site đều
`size-4`"* là đếm ĐÚNG mà đọc SAI — năm chỗ đó không cùng một loại vị trí, nên sự đồng nhất của
chúng không chứng minh được gì.

Ba trục còn lại (`color`, `button`, `markdown`) đọc kết quả `prominence` từ B1, nên B1 phải xong
trước — nếu chưa biết cái gì quan trọng nhất thì không quyết được accent tô vào đâu.

---

## VÀO

Component đã qua B3, với khung và nhịp đã chốt.

## LÀM

**1. `text`** — mỗi chuỗi: cỡ, độ đậm, màu. Mọi cỡ/độ đậm phải **truy được về một vai trò**,
không tự nâng cỡ cho "trông nổi hơn". Chữ đi qua atom `Typography`, không viết thẻ chữ trần.

**2. `icon`** — bây giờ mới chọn, vì đã biết cỡ chữ bên cạnh.

🧭 Câu hỏi phải trả lời **trước** khi mở bảng cỡ: icon này **TRẦN cạnh chữ chạy**, hay **TRONG
một ô/control có nhịp riêng**? Trần thì tra theo font-size; trong ô thì tra theo line-height.
Tra bảng trước khi biết vị trí là bẫy số một của trục này.

Rồi mới tới weight, và weight **theo từng cỡ** — ép cứng một weight cho mọi cỡ trong cùng một
bảng là bẫy đã cắn thật.

⚠️ **Slot `Indicator` của HeroUI**: bỏ trống thì vendor **tự vẽ glyph của nó** — đó là bộ icon
thứ hai lọt vào bằng cửa sau, không có `import` nào để grep. Và khi override, class phải đặt
**trên wrapper**, không đặt trên icon con, vì `cloneElement` nuốt class của con.

**3. `color`** — chỗ nào được tô accent. Trả lời được câu *"vì sao chỗ này, không phải chỗ
kia"*, và câu trả lời phải dẫn về hạng đã xếp ở B1.

**4. `button`** — mỗi nút một `variant`, truy được về **vai trò của nó trong cụm**. Một cụm có
đúng một nút chính; hai nút cùng `primary` nghĩa là chưa quyết.

**5. `press`** — cái gì bấm được thì phải **trông như bấm được**, và cái gì không bấm được thì
đừng mang affordance.

**6. `markdown`** — mỗi field chữ render markdown tới mức nào: title thuần · richtext nhỏ · bài
viết đầy đủ. Chọn sai tầng ở đây là chỗ sinh ra thẻ block nằm trong thẻ inline.

⚠️ Chuỗi phải nằm **inline** mà vẫn cần vài đoạn code (ví dụ tiêu đề trong một `<button>`) thì
không được dùng bộ render đầy đủ — nó sinh thẻ block, và thẻ block nằm trong thẻ inline là lỗi
hydration thật.

Chế độ **SOI**: mỗi giá trị đang có, hỏi *"có đi qua cây quyết định không"*, và **đo DOM** chứ
đừng đọc source — hai cái lệch nhau thường xuyên hơn tưởng.

## CỔNG ĐO

Đo DOM cho từng giá trị vừa chốt:

```js
(function () {
    const el = document.querySelector('[data-anat-part="<tên>"]')
    const cs = getComputedStyle(el)
    return JSON.stringify({ fontSize: cs.fontSize, fontWeight: cs.fontWeight, color: cs.color })
})()
// icon: đo bằng getBoundingClientRect, KHÔNG đọc className
```

Số đo phải khớp giá trị cây quyết định ra. **Lệch thì tin số đo** và đi tìm ai ghi đè.

## RA

Ghi vào `session.md`: giá trị chốt cho từng trục, kèm số đo xác nhận.

## DỪNG KHI

- Chưa biết icon **trần hay trong ô** ⇒ chưa được mở bảng cỡ.
- Hai nút cùng đòi `primary` trong một cụm ⇒ quay lại hạng ở B1, đó là dấu hiệu chưa quyết.
- Source khai một đằng DOM đo một nẻo ⇒ **báo mâu thuẫn ra**, đừng lặng lẽ sửa source cho khớp;
  thường là vendor đang ghi đè và chỗ sửa nằm ở tầng khác.
