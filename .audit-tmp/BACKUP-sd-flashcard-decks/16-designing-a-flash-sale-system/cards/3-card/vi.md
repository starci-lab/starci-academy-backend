# question
<!-- @starci/seperator -->
Người dùng sốt ruột bấm "Mua" liên tục hai lần, và mạng di động chập chờn khiến client tự retry cùng một request checkout. Một số người mua kết thúc với hai đơn cho một món giới hạn một-trên-mỗi-khách. Hãy thiết kế một checkout idempotent để một request bị retry hoặc nhân đôi không bao giờ tạo ra đơn thứ hai.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Idempotency
## 1
<!-- @starci/seperator -->
Checkout
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Yêu cầu một idempotency key trên request checkout: client sinh một key duy nhất cho mỗi ý định mua (ví dụ một UUID gắn với lần tải trang, không sinh lại khi retry) và gửi kèm trong mọi lần thử. Server lưu key đó với một ràng buộc unique — `INSERT ... ON CONFLICT DO NOTHING` trên bảng `idempotency_keys`, hoặc `SET key value NX` trong Redis — để request đầu tiên giành được key và làm việc thật, còn bất kỳ request đồng thời hay đến sau mang cùng key đều được nhận diện và trả về kết quả đã lưu thay vì chạy lại. Quan trọng là decrement và tạo đơn xảy ra dưới cùng key đó, nên một retry thấy đơn đã tạo chứ không reserve một suất thứ hai.
:::

:::muted
**Trade-off** — Idempotency thêm một lượt ghi và một lượt tra cứu trên hot path và cần một nơi bền để nhớ key, tốn latency và bộ nhớ; bạn cũng phải quyết một cửa sổ lưu giữ, vì giữ key mãi thì lãng phí nhưng cho hết hạn quá sớm sẽ để một retry muộn lọt qua thành đơn mới. Bạn đánh đổi một chút phức tạp để có ngữ nghĩa exactly-once-effect trên nền một thế giới giao nhận at-least-once. Cũng có lựa chọn giữa trả về response đã cache ngay lập tức và chặn bản nhân đôi cho tới khi bản gốc đang chạy hoàn tất — chặn thì đúng nhưng cần cẩn thận tránh deadlock và giữ khóa quá lâu.
:::

:::muted
**Cạm bẫy & Failure-mode** — Lỗi phổ biến nhất là sinh idempotency key theo từng request thay vì theo từng ý định, nên mỗi retry mang một key mới và lớp bảo vệ vô tác dụng. Một lỗi khác là tách phần kiểm tra key và phần insert đơn thành hai bước không atomic, tái tạo một race nơi hai bản nhân đôi cùng qua được kiểm tra; phần giành key và phần làm việc phải là một transaction hoặc được bảo vệ bởi cùng một ràng buộc unique. Team cũng hay quên cache và replay response gốc, nên một bản nhân đôi đến sau khi thành công lại nhận lỗi hoặc một thông báo "đã mua rồi" khó hiểu thay vì xác nhận gốc, và client khi đó retry còn dữ hơn. Cuối cùng, chỉ dựa vào một rule DB một-trên-mỗi-khách mà không có idempotency vẫn để các bản nhân đôi đồng thời lọt qua trước khi dòng tồn tại để xung đột.
:::
<!-- @starci/seperator -->
