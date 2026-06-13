# question
<!-- @starci/seperator -->
Mỗi ứng viên match cần một ETA, mỗi chuyến đang chạy cần một tuyến đường, và bản đồ render cho hàng triệu người dùng — đó là một khối lượng tính toán định tuyến khổng lồ. Làm sao bạn thiết kế ETA/định tuyến: tính trước hay theo nhu cầu, và làm sao cache dữ liệu bản đồ và tuyến đường ở quy mô lớn?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
ETA
## 1
<!-- @starci/seperator -->
Caching
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Chia mạng đường thành các tile/vùng và tính trước phần chậm, ổn định một cách offline — các cấu trúc contraction-hierarchy hoặc shortest-path đã phân vùng trên một đồ thị mà trọng số cạnh là thời gian di chuyển, làm mới định kỳ và cập nhật bằng traffic trực tiếp. Lúc request bạn chỉ chạy một truy vấn rẻ trên các cấu trúc dựng sẵn này thay vì một Dijkstra nguội trên cả bản đồ. Với matching, bạn không cần tuyến chính xác cho mọi ứng viên: ước lượng ETA một cách rẻ (haversine điều chỉnh bởi một road-factor, hoặc một ma trận thời gian di chuyển vùng-tới-vùng thô) để xếp hạng ứng viên, và chỉ tính một tuyến chính xác cho tài xế được chọn và chuyến đang chạy. Cache mạnh tay ở nhiều tầng — map tile bất biến trên CDN, các ETA điểm-đi/điểm-đến phổ biến và thời gian cặp-vùng trong Redis với TTL ngắn, và tuyến theo từng chuyến chỉ tính lại khi tài xế đi lệch.
:::

:::muted
**Trade-off** — Tính trước cho đọc cỡ mili-giây nhưng cũ đi khi traffic thay đổi, nên bạn đánh đổi độ tươi lấy tốc độ và phải chạy lại hoặc vá các cấu trúc theo một nhịp; định tuyến hoàn toàn theo nhu cầu thì luôn cập nhật nhưng quá chậm và tốn kém để làm cho mỗi ứng viên lúc match. Ước lượng ETA thô thì rẻ và mở rộng tới mọi ứng viên nhưng kém chính xác hơn, trong khi định tuyến chính xác thì chính xác nhưng dành cho số ít request xứng đáng. Cache ETA với TTL dài tối đa hóa tỷ lệ hit nhưng phục vụ thời gian lỗi thời trong các sự cố; TTL ngắn giữ tươi nhưng tăng tải tính toán, nên TTL được tinh chỉnh theo mức độ biến động của traffic ở khu vực đó.
:::

:::muted
**Cạm bẫy & Failure-mode** — Chạy một tìm kiếm đồ thị đầy đủ cho mỗi ứng viên lúc điều phối là vụ nổ kinh điển: độ trễ tăng vọt và tầng định tuyến trở thành nút thắt dưới tải. Phục vụ ETA cache cũ qua một sự cố đột ngột (một vụ va chạm đóng một đường cao tốc) dẫn tài xế vào kẹt xe và báo sai thời gian đến, làm xói mòn niềm tin — bạn cần vô hiệu hóa theo traffic trực tiếp, không chỉ hết hạn theo thời gian. Một thundering herd trên một tuyến phổ biến sau khi cache bị đẩy ra có thể nện vào dịch vụ định tuyến; hãy dùng request coalescing hoặc stale-while-revalidate. Và nhầm khoảng cách đường thẳng với ETA để xếp hạng sẽ chọn các tài xế gần về hình học nhưng xa về đường, nên việc cắt ứng viên có thể dùng khoảng cách nhưng xếp hạng cuối phải dùng một ước lượng thời gian.
:::
<!-- @starci/seperator -->
