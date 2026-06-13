# question
<!-- @starci/seperator -->
Một triệu tài xế online mỗi người gửi một ping GPS mỗi 4 giây — khoảng 250k lượt ghi mỗi giây dữ liệu vị trí thay đổi liên tục. Làm sao bạn nạp và lưu trữ lượng này mà không làm chảy database, trong khi vẫn giữ chỉ mục matching đủ tươi để điều phối?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
LocationIngestion
## 1
<!-- @starci/seperator -->
Scalability
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Hãy coi vị trí hiện tại là trạng thái nóng, phù du, chứ không phải hàng quan hệ bền vững. Tài xế giữ một kết nối lâu dài (WebSocket/gRPC stream) tới tầng location-gateway; mỗi ping cập nhật một geo-index in-memory hoặc Redis (`GEOADD` vào các sorted set theo từng ô) mà bộ matcher đọc trực tiếp, nên "vị trí mới nhất" là một thao tác ghi đè, không phải nối thêm. Luồng tần suất cao này cũng được publish vào một log như Kafka, phân vùng theo tài xế hoặc theo ô địa lý, nơi nó có thể được tiêu thụ bất đồng bộ cho telemetry chuyến đi, phân tích, và một lịch sử bền vững ghi theo lô vào kho columnar/time-series. Cách này tách vòi rồng thành một đường nhanh tí hon (vị trí hiện tại cho matching) và một đường chậm có đệm (lịch sử), nên kho quan trọng cho điều phối chỉ luôn giữ một hàng mỗi tài xế.
:::

:::muted
**Trade-off** — Tần suất ping cao hơn cho match tươi hơn và animation bản đồ mượt hơn nhưng nhân lên tải ghi, băng thông, và hao pin, nên hầu hết hệ thống dùng nhịp thích nghi — ping nhanh khi đang di chuyển hoặc đang trong chuyến, chậm hơn khi rảnh. Giữ vị trí hiện tại chỉ trong Redis/memory cho đọc cỡ micro-giây nhưng nghĩa là một node hỏng sẽ mất vị trí cho đến khi tài xế ping lại (chấp nhận được, vì họ ping lại trong vài giây); persist từng ping đồng bộ thì bền vững nhưng không theo kịp ở 250k/s. Bạn cũng đánh đổi tính nhất quán lấy thông lượng: bộ matcher đọc một vị trí cũ tối đa một chu kỳ ping, điều này ổn vì vài giây cũ gần như không thay đổi ai đang "ở gần."
:::

:::muted
**Cạm bẫy & Failure-mode** — Sai lầm số một là `UPDATE drivers SET lat=?, lng=? WHERE id=?` trên một database SQL chính cho mỗi ping; khuếch đại ghi, cập nhật chỉ mục, và tranh chấp khóa sẽ làm nó bão hòa rất lâu trước khi tới quy mô thành phố. Các failure-mode khác: độ trễ Kafka không giới hạn ở consumer lịch sử âm thầm phình to đến khi đầy đĩa; kết nối sticky dồn lên vài node gateway khiến một vùng hotspot làm ngợp một máy đơn lẻ; và tin tưởng timestamp của client, vốn cho phép một app lỗi hoặc độc hại tiêm vào các ping sai thứ tự hoặc đề ngày tương lai — bạn phải loại bỏ các cập nhật cũ/phi lý (chặn theo tốc độ) và lấy độ tươi theo thời điểm server nhận, không phải thời gian thiết bị.
:::
<!-- @starci/seperator -->
