# question
<!-- @starci/seperator -->
Hai hành khách đặt xe cùng một khoảnh khắc và cùng một tài xế là ứng viên tốt nhất cho cả hai. Hãy đi qua thiết kế matching/điều phối của bạn sao cho đúng một hành khách được tài xế đó, không tài xế nào bị gán đôi, và bạn vẫn ưu tiên match tốt (gần nhất hay ETA tối ưu).
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Matching
## 1
<!-- @starci/seperator -->
Concurrency
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Sinh một tập ứng viên từ geo-index, rồi xếp hạng theo ETA dự đoán trên mạng đường thay vì khoảng cách đường chim bay, vì một tài xế gần hơn nhưng kẹt sau xe cộ hoặc một con sông thì tệ hơn. Để ngăn gán đôi, điều phối phải chiếm tài xế một cách atomic: trước khi mời, bộ matcher giành một khóa ngắn hạn hoặc làm một chuyển trạng thái có điều kiện (ví dụ Redis `SET driver:{id}:lock req {token} NX EX 15`, hoặc một actor/queue đơn-phân-vùng cho mỗi tài xế) sao cho chỉ một request có thể giữ một tài xế tại một thời điểm. Tài xế bị khóa nhận một lời mời độc quyền có timeout; khi nhận, khóa chuyển thành một phân công, và khi từ chối/hết giờ, khóa được nhả và bộ matcher chuyển sang ứng viên kế tiếp. Định tuyến mọi request cho một tài xế qua một chủ sở hữu được tuần tự hóa (một actor khóa theo driverId, hoặc một Redis key mỗi tài xế) biến "chỉ mời cho đúng một hành khách" thành một bất biến cứng.
:::

:::muted
**Trade-off** — Gần nhất theo khoảng cách thì rẻ và đơn giản nhưng cho điểm đón tệ hơn; ETA tối ưu cần traffic trực tiếp và các lệnh định tuyến, tốn độ trễ và tiền cho mỗi match, nên nhiều hệ thống dùng khoảng cách để cắt ứng viên và ETA chỉ để xếp hạng danh sách ngắn. Khóa một tài xế trong khi một lời mời còn treo bảo đảm không đặt đôi nhưng tạm thời rút tài xế đó khỏi các pool ứng viên của hành khách khác, điều này có thể làm giảm nhẹ hiệu quả match toàn cục — một TTL khóa chặt hơn cải thiện thông lượng nhưng có nguy cơ nhả một tài xế sắp nhận. Cũng có lựa chọn batch-vs-greedy: gom các request trong một cửa sổ ngắn và giải một bài toán phân công cho ra cặp ghép tốt hơn toàn cục so với điều phối greedy first-come, đổi lại thêm thời gian chờ.
:::

:::muted
**Cạm bẫy & Failure-mode** — Không có thao tác chiếm atomic, một race kinh điển khiến cả hai request đọc tài xế là "rảnh" và cả hai gửi lời mời, nên tài xế thấy hai ping hoặc bị gán hai chuyến. TTL khóa quá dài kẹt một tài xế ở trạng thái "bận" sau khi một dispatcher sập (bạn cần expiry cộng một heartbeat để nhả), trong khi TTL quá ngắn để lời mời hết hạn giữa lúc nhận và vẫn điều phối đôi. Các thất bại khác: không xử lý nhánh từ chối/không phản hồi phía tài xế dẫn tới request kẹt; mời một tài xế có vị trí đã cũ sẽ gán người đã rời khu vực; và bỏ qua công bằng/chống đói có thể lặp lại việc bỏ qua một request không bao giờ thắng trong lượt greedy.
:::
<!-- @starci/seperator -->
