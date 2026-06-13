# question
<!-- @starci/seperator -->
Một hành khách mở app và bấm "Đặt xe." Ở mức tổng quan, hệ thống phải làm những gì để đưa một tài xế ở gần vào đón họ, trong khi cả hành khách lẫn hàng chục tài xế ứng viên đều đang di chuyển liên tục?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
junior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Matching
## 1
<!-- @starci/seperator -->
RealTime
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Hệ thống liên tục nạp các ping GPS từ tài xế đang online và giữ một góc nhìn tươi mới, có thể truy vấn được về "ai đang ở gần đâu." Khi một hành khách đặt chuyến, dịch vụ matching lấy vị trí điểm đón của hành khách, chạy một truy vấn không gian "tài xế gần tôi" để lấy tập ứng viên, xếp hạng họ (thường theo ETA chứ không phải khoảng cách thô), rồi mời chuyến cho tài xế tốt nhất. Nếu tài xế đó từ chối hoặc hết giờ, hệ thống mời ứng viên kế tiếp, và cứ thế cho đến khi có người nhận. Toàn bộ vòng lặp — đặt, tìm ứng viên, mời, nhận — thường phải xử lý xong trong vài giây để hành khách không phải nhìn vòng quay chờ.
:::

:::muted
**Trade-off** — Độ tươi mới của vị trí tài xế xung đột với chi phí: ping và lập lại chỉ mục cho mọi tài xế mỗi giây cho ra kết quả match chính xác nhưng cực kỳ tốn kém ở quy mô thành phố, trong khi cập nhật chậm hơn làm tập ứng viên cũ đi nên bạn có thể điều một tài xế đã rời đi rồi. Bạn cũng đánh đổi chất lượng match với độ trễ — mở rộng bán kính tìm kiếm hoặc tính ETA theo mạng đường thật tìm được tài xế tốt hơn nhưng lâu hơn, mà hành khách sẽ bỏ cuộc nếu thấy matching chậm. Hệ thống về bản chất là một bài toán mục tiêu di động, nên "đủ tốt, nhanh" thường thắng "tối ưu, chậm."
:::

:::muted
**Cạm bẫy & Failure-mode** — Một thiết kế ngây thơ truy vấn một bảng quan hệ chứa tất cả tài xế với bộ lọc bounding-box trên mỗi request; cách này làm chảy database dưới tải ghi từ các ping vị trí và tải đọc từ matching. Một thất bại phổ biến khác là coi khoảng cách là đường thẳng — tài xế gần nhất về mặt hình học có thể đang ở bên kia sông hoặc kẹt sau một đường một chiều với ETA thực tế tệ hơn nhiều. Bỏ quên nhánh từ chối/hết giờ cũng là chí mạng: nếu tài xế được mời đầu tiên không bao giờ phản hồi và không có phương án dự phòng, hành khách chờ mãi mãi, nên vòng lặp điều phối phải tự động chuyển sang ứng viên kế tiếp.
:::
<!-- @starci/seperator -->
