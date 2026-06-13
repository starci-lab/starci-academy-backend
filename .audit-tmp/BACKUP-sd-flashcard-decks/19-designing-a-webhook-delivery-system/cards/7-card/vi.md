# question
<!-- @starci/seperator -->
Hãy thiết kế nền tảng gửi webhook end-to-end vận hành một sản phẩm như của Stripe: sự kiện chảy từ các service nội bộ tới hàng nghìn subscriber bên ngoài. Đi qua ingestion, fan-out, pipeline gửi với retry và DLQ, và phần observability mà subscriber cần để tin tưởng nó. Những quyết định scaling và độ tin cậy then chốt là gì?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
staff
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Architecture
## 1
<!-- @starci/seperator -->
Observability
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Ingestion: các service nội bộ publish domain event vào một log bền vững (Kafka hoặc một topic dựa trên outbox) để việc tạo sự kiện được tách rời và không bao giờ mất. Fan-out: một router tra cứu các subscription đang hoạt động khớp với từng loại sự kiện, và với mỗi cặp (event, subscriber) nó ghi một bản ghi delivery được lưu (`pending`) rồi đẩy một job gửi — đây là nơi một sự kiện trở thành N delivery. Pipeline gửi: một worker pool scale ngang kéo job ra, ký mỗi request bằng secret của subscriber và một delivery id ổn định, áp rate limit và trần concurrency theo từng subscriber kèm circuit breaker, thực hiện lời gọi HTTP với timeout chặt, và khi fail thì lập lịch lại theo exponential backoff cộng jitter tới trần số lần thử rồi chuyển vào DLQ. Observability: dashboard theo từng subscriber về tỉ lệ thành công, độ trễ, và các thất bại gần đây, một API deliveries với lịch sử các lần thử đầy đủ, kiểm tra payload đã ký, cảnh báo, và một công cụ replay tự phục vụ trên DLQ.
:::

:::muted
**Trade-off** — Lưu mọi delivery và lịch sử các lần thử cho bạn trách nhiệm giải trình chính xác và khả năng replay, nhưng ở quy mô fan-out (một sự kiện tới hàng nghìn subscriber) sự khuếch đại ghi đó chi phối tải storage và database, đẩy bạn về phía kho delivery được partition/shard và retention quyết liệt. Worker kéo job từ queue scale co giãn và cô lập thất bại, nhưng đòi hỏi công bằng theo từng subscriber cẩn thận để một subscriber nóng hay chậm không độc chiếm pool. Bạn cũng chọn đảm bảo trung tâm của mình: at-least-once với idempotency key là mặc định thực dụng; exactly-once hay ordering nghiêm ngặt đắt hơn nhiều và thường chỉ cung cấp như một chế độ opt-in theo từng key.
:::

:::muted
**Cạm bẫy & Failure-mode** — Ở quy mô nền tảng, những thất bại nguy hiểm mang tính hệ thống: một sự kiện độc hại hay một subscriber cấu hình sai có thể bão hòa worker dùng chung (head-of-line blocking) và làm suy giảm tất cả, nên cô lập, breaker và timeout chặt là không thể thương lượng. Một cơn bão retry sau một sự cố diện rộng có thể tự-DoS chính hạ tầng của bạn và các subscriber đang phục hồi nếu retry không mang jitter và không tôn trọng rate limit theo từng subscriber. Quản lý secret và khóa ký là một khẩu súng tự bắn vào chân về bảo mật — secret rò rỉ hay không xoay cho phép kẻ tấn công giả mạo sự kiện. Và thiếu observability hạng nhất, subscriber không phân biệt nổi một sự kiện bị rớt với một sự kiện chậm, nên niềm tin xói mòn; API deliveries, tài liệu chữ ký, và replay là một phần của sản phẩm ngang với chính việc gửi.
:::
<!-- @starci/seperator -->
