# B1 — Ý ĐỊNH

> **Trục nạp:** [`reading-flow`](../../fe/principles/reading-flow/context.md) ·
> [`prominence`](../../fe/principles/prominence/context.md) ·
> [`async`](../../fe/principles/async/context.md)
> **Phạm vi:** cả màn, một lần. Read-only, chưa nghĩ tới pixel nào.

Bước này **chưa từng có trong luồng cũ** — không chỗ nào hỏi *"trên màn này cái gì quan trọng
nhất"*. Đó là lý do màn dựng ra phẳng: mọi thứ ngang nhau vì chưa ai quyết cái gì hơn cái gì.

Ba trục ở đây là **quyết định về sản phẩm**, không suy ra được từ code. Đó cũng là lý do chúng
phải đứng trước: mọi trục sau (`color` tô vào đâu, nút nào `primary`, chữ nào Tier A) đều đọc
kết quả của `prominence`.

---

## VÀO

`session.md` từ B0, kèm nhánh nguồn đã chốt.

## LÀM

**1. Danh sách chức năng, bằng LỜI.** Màn là một danh sách chức năng, mỗi chức năng sẽ thành
một block. Viết ra trước khi nghĩ tới hình.

> 🧭 Phép thử: dòng nào **không nói được nó phục vụ việc gì cho người dùng** thì nó là trang
> trí, không phải chức năng. Bỏ khỏi danh sách.

**2. Xếp hạng — trục `prominence`.** Cái gì quan trọng nhất, cái gì phụ, cái gì là nền.

> ⚠️ **Đúng MỘT thứ được xếp hạng nhất.** Xếp hai thứ cùng "quan trọng nhất" nghĩa là **chưa
> quyết**, không phải màn này đặc biệt. Đây là chỗ dễ né nhất và cũng là chỗ tốn nhất khi né.

**3. Thứ tự đọc — trục `reading-flow`.** Người đọc gặp gì trước, gì sau. Thứ tự đọc **không bắt
buộc trùng** thứ tự quan trọng: thứ quan trọng nhất có thể cần một câu dẫn đứng trước nó.

**4. Đường async — trục `async`.** Với mỗi chức năng: có thể **rỗng** không · có thể **lỗi**
không · có quãng **đang tải** không. Chức năng nào có thì ghi rõ lúc đó màn hiện gì.

> Trả lời ở đây chứ đừng để tới lúc dựng, vì rỗng/lỗi/tải là **CẤU TRÚC**, và cấu trúc phải nằm
> trong cây ở B2. Nghĩ ra muộn thì nó rơi ra thành một card trắng chắp vá.

### Theo nhánh

| Nhánh | Làm gì ở bước này |
|---|---|
| **A · từ source** | đọc `src/app/**/page.tsx` + `src/components/features/**` của đúng màn, rút ra bốn mục trên. ⛔ chỉ ĐỌC |
| **B · sáng tạo** | viết BIZ SPEC trước (màn làm gì · switch giữa cấu trúc nào · dữ liệu gì), rồi mới rút bốn mục |
| **C · soi** | đọc màn đã dựng, **rút ngược** bốn mục, rồi trình thầy: *"em đọc màn này ra ý định thế này, đúng không"* |

Nhánh C mà **không rút ngược được ý định** thì đó là **một phát hiện**, không phải một trở ngại
— ghi vào `session.md`. Màn không rút ra được trọng tâm nghĩa là nó chưa có trọng tâm.

## CỔNG ĐO

- Mọi dòng chức năng nói được việc nó phục vụ ⇒ không còn dòng trang trí lẫn trong danh sách.
- Đúng một thứ mang hạng cao nhất.
- Mọi chức năng đều có ô trả lời cho rỗng · lỗi · đang tải, kể cả ô "không có".

## RA

Một bảng bốn cột: **chức năng · hạng · thứ tự đọc · đường async**. Ghi vào `session.md`.

Bảng này đi thẳng vào tài liệu duyệt của B2 — **không hỏi thầy duyệt riêng ở đây**, vì nó quá
nhỏ để chặn một lượt, và cây chỉ chấm được khi nhìn cùng ý định đã sinh ra nó.

## DỪNG KHI

- Nhánh **B** mà thiếu thông tin để trả lời một trong bốn mục ⇒ **HỎI THẦY**, đừng bịa view hay
  state. Bịa ở bước này là bịa cả cây.
- Nhánh **A/C** mà đọc xong vẫn không rút ra được hạng ⇒ nói thẳng là màn gốc chưa có trọng
  tâm, hỏi thầy muốn đặt trọng tâm vào đâu. Đừng tự gán rồi đi tiếp.
