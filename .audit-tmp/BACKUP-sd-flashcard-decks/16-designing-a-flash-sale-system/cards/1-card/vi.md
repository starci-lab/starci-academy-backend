# question
<!-- @starci/seperator -->
Trong một flash sale, service của bạn bán ra 1.043 suất cho một đợt drop chỉ có 1.000 suất. Hãy giải thích tại sao cách làm ngây thơ "đọc stock, kiểm tra > 0, ghi stock - 1" gây oversell dưới điều kiện concurrency, và thiết kế một atomic decrement khiến oversell trở nên bất khả thi.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Concurrency
## 1
<!-- @starci/seperator -->
Inventory
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Luồng ngây thơ có một race read-check-write: hai request cùng đọc stock = 1, cả hai cùng qua được kiểm tra `> 0`, và cả hai cùng ghi 0, nên hai đơn hàng được tạo trên cùng một suất. Cách sửa là biến phần kiểm tra và decrement thành một thao tác atomic duy nhất được storage engine tuần tự hóa. Trong SQL đó là conditional update, `UPDATE inventory SET stock = stock - 1 WHERE id = ? AND stock > 0`, và bạn coi "rows affected = 0" là hết hàng — row lock của database đảm bảo chỉ một writer thắng cho mỗi suất. Trong Redis cũng làm tương tự với `DECR` được bọc bởi một Lua script (hoặc `DECRBY` kèm kiểm tra) để phần đọc và ghi chạy như một bước không thể chia cắt, thường nạp sẵn counter vào Redis trước đợt bán để giữ hot path hoàn toàn tách khỏi database.
:::

:::muted
**Trade-off** — Atomic decrement trên Redis cực nhanh và hấp thụ được spike, nhưng khi đó Redis là nguồn sự thật trong một khoảng thời gian, nên bạn cần một đường reconciliation bền (write-behind xuống database, AOF/replication) nếu không sẽ mất count khi crash. Conditional update trên SQL thì bền và đơn giản hoàn hảo nhưng bị tuần tự hóa trên một dòng nóng duy nhất, giới hạn bạn ở throughput lock của dòng đó — ổn với vài nghìn mỗi giây, không phải vài triệu. Nhiều thiết kế kết hợp cả hai: Redis làm cổng admission và reserve, database là sổ cái thẩm quyền, và bạn chấp nhận một cửa sổ eventual-consistency nhỏ để đổi lấy cả tốc độ lẫn độ bền.
:::

:::muted
**Cạm bẫy & Failure-mode** — Một cái bẫy tinh vi là làm decrement trong code ứng dụng bên trong một transaction nhưng dùng `SELECT` rồi `UPDATE` mà không có `FOR UPDATE` hay `WHERE` điều kiện; bản đọc optimistic vẫn race trừ khi chính câu ghi thực thi predicate đó. Một lỗi khác là decrement trước rồi mới insert đơn hàng sau, và crash ở giữa — bạn có stock bị reserve ảo không bao giờ chuyển thành đơn, nên phải ghép decrement với tạo đơn idempotent và một đường release. Với Redis, quên biến check-and-decrement thành một Lua script duy nhất (gọi `GET` rồi `DECR` từ client) tái tạo lại đúng cái race bạn đang cố diệt, và một `DECR` không chặn đáy thậm chí có thể xuống âm, oversell trong âm thầm.
:::
<!-- @starci/seperator -->
