# question
<!-- @starci/seperator -->
Bạn đang xây hệ thống webhook phải gửi mỗi sự kiện nền tảng (ví dụ `order.paid`) tới nhiều endpoint HTTP của bên thứ ba mà bạn không sở hữu hay kiểm soát. Vì sao "cứ gọi thẳng URL của subscriber ngay lúc sự kiện xảy ra" là thiết kế sai, và kiến trúc cốt lõi nào sửa được điều đó?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
junior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Webhooks
## 1
<!-- @starci/seperator -->
Async Delivery
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Tách việc tạo sự kiện ra khỏi việc gửi sự kiện. Khi một sự kiện xảy ra, service tạo sự kiện sẽ ghi một bản ghi delivery (event id, subscriber, payload, trạng thái) rồi đẩy một job gửi vào queue và trả về ngay; một pool worker gửi riêng sẽ lấy job ra và thực hiện lời gọi HTTP ra ngoài. Nhờ vậy giao dịch phía người dùng không phải chờ một bên thứ ba chậm hoặc không truy cập được; và queue trở thành bộ đệm bền vững cho phép bạn retry, scale, và quan sát quá trình gửi một cách độc lập với request gốc. Bản ghi delivery được lưu lại chính là nguồn sự thật cho câu hỏi "sự kiện này đã tới subscriber chưa?".
:::

:::muted
**Trade-off** — Gọi inline đơn giản hơn và cho producer tín hiệu thành công/thất bại ngay lập tức, nhưng nó gắn độ trễ và độ sẵn sàng của bạn vào những endpoint bạn không kiểm soát: chỉ cần một subscriber timeout 30 giây là làm nghẽn luồng checkout. Thiết kế async thêm nhiều thành phần (queue, worker, kho lưu delivery) và biến việc gửi thành eventually-consistent thay vì đồng bộ, nên producer không còn được phép giả định webhook đã được nhận. Tính eventual-consistency đó là cái giá phải trả để cô lập luồng lõi khỏi những endpoint ngoài không đáng tin và khó đoán.
:::

:::muted
**Cạm bẫy & Failure-mode** — Lỗi kinh điển là thực hiện lời gọi HTTP ngay bên trong cùng transaction database hay request handler đã tạo sự kiện: một subscriber bị treo sẽ giữ transaction mở, làm cạn connection pool, rồi cascade thành sập toàn hệ thống. Bẫy còn lại là fire-and-forget không lưu bản ghi nào — nếu worker crash giữa chừng bạn không có cách nào biết sự kiện đã mất. Hãy luôn lưu ý định gửi trước khi thử gửi (ý tưởng transactional-outbox) để một cú crash không bao giờ âm thầm làm rớt sự kiện.
:::
<!-- @starci/seperator -->
