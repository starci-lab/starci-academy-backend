# question
<!-- @starci/seperator -->
Endpoint của một subscriber bắt đầu mất 25 giây mỗi request rồi timeout. Đột nhiên việc gửi tới mọi subscriber khỏe mạnh khác của bạn cũng chậm như rùa bò. Vì sao điều này xảy ra với một worker pool dùng chung duy nhất, và bạn cô lập subscriber thế nào để một consumer tồi không thể chặn những consumer còn lại?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Isolation
## 1
<!-- @starci/seperator -->
Concurrency
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Phân vùng công việc để một subscriber chậm chỉ tiêu thụ đúng phần năng lực của riêng nó. Thay vì một queue FIFO toàn cục nuôi một worker pool dùng chung, hãy cho mỗi subscriber (hoặc endpoint) một queue logic riêng và một trần concurrency theo từng subscriber, để các delivery được lập lịch công bằng giữa các subscriber thay vì ai đến trước phục vụ trước. Thêm circuit breaker cho từng endpoint: sau N lần fail liên tiếp, mở breaker và ngừng gửi tới endpoint đó trong một khoảng cooldown, xả backlog của nó từ từ qua các probe half-open thay vì đốt worker vào một host đã chết. Mục tiêu là bán kính ảnh hưởng của bất kỳ consumer hư hỏng nào cũng bị giới hạn trong làn của riêng consumer đó.
:::

:::muted
**Trade-off** — Queue riêng chặt chẽ theo subscriber và trần concurrency cho cô lập và công bằng mạnh nhưng tốn nhiều tài nguyên và phối hợp hơn: hàng nghìn subscriber nghĩa là hàng nghìn queue hay partition phải quản lý, và năng lực dành riêng cho một subscriber rảnh rỗi là năng lực mà một subscriber bận rộn không mượn được. Một pool dùng chung duy nhất thì đơn giản về vận hành và dùng năng lực hiệu quả trong điều kiện bình thường, nhưng không cung cấp cô lập nào, nên head-of-line blocking bởi một endpoint chậm làm suy giảm tất cả. Nhiều hệ thống thỏa hiệp bằng một số hữu hạn worker shard dùng chung cộng với giới hạn concurrency và breaker theo subscriber, đánh đổi cô lập hoàn hảo lấy cardinality quản lý được.
:::

:::muted
**Cạm bẫy & Failure-mode** — Lỗi nổi bật là head-of-line blocking: một pool dùng chung đầy ắp worker bị kẹt vào một endpoint đang timeout, và các delivery khỏe mạnh chết đói phía sau chúng. Một bẫy tinh vi là đặt timeout HTTP ra ngoài quá cao, khiến mỗi request bị kẹt giữ worker lâu hơn cần thiết nhiều — timeout quyết liệt và hợp lý là điều kiện tiên quyết của cô lập. Lỗi khác là quên circuit breaker, nên ngay cả khi có làn riêng theo subscriber bạn vẫn trả đủ chi phí timeout cho mỗi retry tới một host rõ ràng đã sập thay vì lùi nhanh và giải phóng năng lực.
:::
<!-- @starci/seperator -->
