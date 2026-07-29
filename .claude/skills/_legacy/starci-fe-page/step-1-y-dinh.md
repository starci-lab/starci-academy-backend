# BƯỚC 1 — Ý ĐỊNH

> **Trục nạp:** [`reading-flow`](../../fe/principles/reading-flow/context.md) ·
> [`prominence`](../../fe/principles/prominence/context.md) ·
> [`async`](../../fe/principles/async/context.md)
> **Phạm vi:** cả màn, chạy MỘT lần. Read-only, chưa nghĩ tới pixel nào.

Bước này **chưa từng tồn tại trong luồng cũ** — cả `story-generate` lẫn `screen-audit` đều
không có chỗ nào hỏi *"trên màn này cái gì quan trọng nhất"*. Đó là lý do màn dựng ra phẳng:
mọi thứ ngang nhau vì chưa ai quyết cái gì hơn cái gì. Ba trục ở đây là **quyết định về sản
phẩm**, không suy ra được từ code.

---

## VÀO

Tên màn + nhánh đã chọn (A từ source · B sáng tạo · C soi). Với nhánh A và C: đường dẫn màn thật.
Với nhánh B: mô tả biz của thầy.

## LÀM

**1. Danh sách chức năng, bằng LỜI.** Màn là một danh sách chức năng, mỗi chức năng sẽ thành một
block. Viết ra trước khi nghĩ tới hình.

> 🧭 Phép thử: dòng nào **không nói được nó phục vụ việc gì cho người dùng** thì nó là trang trí,
> không phải chức năng. Bỏ khỏi danh sách.

**2. Xếp hạng — trục `prominence`.** Trên màn này cái gì quan trọng nhất, cái gì phụ, cái gì là
nền. Đây là chỗ quyết sau này accent tô vào đâu, nút nào `primary`, chữ nào Tier A — nên quyết
sai ở đây thì bước 4 sai theo mà không có cách nào phát hiện.

> ⚠️ **Đúng MỘT thứ được xếp hạng nhất.** Xếp hai thứ cùng "quan trọng nhất" nghĩa là chưa quyết,
> không phải màn này đặc biệt.

**3. Thứ tự đọc — trục `reading-flow`.** Người đọc gặp gì trước, gì sau. Thứ tự đọc **không bắt
buộc trùng** thứ tự quan trọng: thứ quan trọng nhất có thể cần một câu dẫn đứng trước nó.

**4. Đường async — trục `async`.** Với mỗi chức năng: nó có thể **rỗng** không · có thể **lỗi**
không · có quãng **đang tải** không. Chức năng nào có thì ghi rõ lúc đó màn hiện gì.

> Trả lời ở đây chứ đừng để tới lúc dựng, vì rỗng/lỗi/tải là **cấu trúc**, và cấu trúc phải nằm
> trong cây ở bước 2. Nghĩ ra muộn thì nó rơi ra thành một card trắng chắp vá.

Nhánh **C (soi)** làm ngược: đọc màn đã dựng, **rút ngược** ra bốn thứ trên, rồi trình cho thầy
xem *"tôi đọc màn này ra ý định thế này, có đúng không"*. Màn đã dựng mà không rút ngược được ý
định là một phát hiện, không phải một trở ngại — ghi lại.

## CỔNG ĐO

- Mọi dòng chức năng nói được việc nó phục vụ ⇒ không còn dòng trang trí lẫn trong danh sách.
- Đúng một thứ mang hạng cao nhất.
- Mọi chức năng đều có ô trả lời cho rỗng · lỗi · đang tải (kể cả ô "không có").

## RA

Một bảng, bốn cột: **chức năng · hạng · thứ tự đọc · đường async**.

Bảng này đi thẳng vào tài liệu barrier của bước 2 — **không hỏi thầy duyệt riêng ở đây**, vì nó
quá nhỏ để chặn một lượt, và cây chỉ chấm được khi nhìn cùng ý định sinh ra nó.

## DỪNG KHI

- Nhánh **B** mà thiếu thông tin để trả lời một trong bốn mục ⇒ **HỎI THẦY**, đừng bịa view hay
  state. Bịa ở bước này là bịa cả cây.
- Nhánh **A/C** mà đọc `src` xong vẫn không rút ra được hạng ⇒ nói thẳng là màn gốc chưa có
  trọng tâm, và hỏi thầy muốn đặt trọng tâm vào đâu. Đừng tự gán rồi đi tiếp.
