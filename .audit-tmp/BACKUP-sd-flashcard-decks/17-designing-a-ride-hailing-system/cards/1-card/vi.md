# question
<!-- @starci/seperator -->
Bạn cần một truy vấn "tài xế trong vòng 2 km quanh điểm đón này" trả về trong vài mili-giây trên hàng trăm nghìn tài xế đang online. Hãy đi qua việc một chỉ mục không gian địa lý (geohash, quadtree, hay S2 cell) thực sự làm truy vấn đó nhanh như thế nào, và điều gì xảy ra ở ranh giới ô?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Geospatial
## 1
<!-- @starci/seperator -->
Indexing
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Cả ba kỹ thuật đều ánh xạ tọa độ 2D xuống một khóa 1D phân cấp sao cho các điểm gần nhau chia sẻ tiền tố và có thể gom vào cùng bucket. Geohash đan xen các bit kinh độ/vĩ độ thành một chuỗi base-32, trong đó tiền tố dài hơn nghĩa là ô nhỏ hơn; S2 chiếu địa cầu lên một khối lập phương và dùng đường cong Hilbert để sinh ID ô 64-bit ở 30 cấp; quadtree đệ quy chia không gian thành bốn góc phần tư, chỉ tinh chỉnh ở nơi mật độ tài xế cao. Lúc truy vấn bạn tính ra ô (hoặc các ô) phủ bán kính tìm kiếm, rồi chỉ đọc đúng những bucket đó (thường là Redis `GEOSEARCH` / sorted set, hoặc lưới in-memory khóa theo ô), nhờ vậy bạn quét vài trăm tài xế ứng viên thay vì cả đội xe, và kết thúc bằng một bộ lọc khoảng cách chính xác để loại false positive.
:::

:::muted
**Trade-off** — Kích thước ô là núm vặn trung tâm: ô lớn nghĩa là ít bucket phải đọc nhưng mỗi bucket chứa nhiều tài xế không liên quan mà bạn phải lọc khoảng cách, trong khi ô nhỏ cho tập ứng viên gọn nhưng một bán kính giờ trải qua nhiều ô, làm tăng fan-out và sự xáo trộn lập lại chỉ mục khi tài xế vượt ranh giới. Geohash đơn giản và thân thiện với tiền tố chuỗi nhưng có ô chữ nhật bị méo gần cực và ở các đường nối ranh giới; S2 có diện tích ô gần như đồng đều và toán hàng xóm tuyệt vời nhưng nặng hơn để cài đặt; quadtree thích nghi theo mật độ (rất hợp với trung tâm đông đúc) nhưng cân bằng lại và đi theo con trỏ làm tăng độ phức tạp. Hầu hết hệ thống production chọn S2 hoặc geohash với một cấp cố định được tinh chỉnh theo mật độ từng thành phố.
:::

:::muted
**Cạm bẫy & Failure-mode** — Lỗi kinh điển là bài toán ranh giới: một tài xế cách 50 m có thể nằm trong ô liền kề, nên truy vấn chỉ ô nhà của hành khách sẽ âm thầm bỏ sót các tài xế gần nhất. Bạn phải mở rộng ra 8 ô hàng xóm (hoặc tất cả ô mà bán kính tròn chạm tới) rồi áp dụng khoảng cách haversine/đường thật — bỏ qua bộ lọc chính xác sẽ trả về các tài xế ở góc ô mà thực ra nằm ngoài bán kính. Các failure-mode khác gồm hotspot nơi một ô (sân bay, sân vận động) chứa hàng chục nghìn tài xế và trở thành nút thắt quét và khóa, và việc coi tiền tố geohash là khoảng cách chính xác, vốn không phải vậy — độ dài tiền tố chỉ chặn kích thước ô, không phải khoảng cách điểm-tới-điểm.
:::
<!-- @starci/seperator -->
