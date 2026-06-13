# question
<!-- @starci/seperator -->
Inventory service của bạn xử lý an toàn được khoảng 5.000 lượt checkout mỗi giây, nhưng flash sale sẽ ném một triệu người dùng đồng thời vào nó. Hãy thiết kế một lớp admission-control (virtual waiting room kết hợp token bucket) đảm bảo backend không bao giờ bị giẫm đạp.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Admission Control
## 1
<!-- @starci/seperator -->
Rate Limiting
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Đặt một cổng trước buy path để inventory service chỉ bao giờ thấy lượng traffic mà nó hấp thụ được. Một virtual waiting room cho người dùng vào với tốc độ được kiểm soát: khi đến, mỗi người nhận một queue token đã ký và một vị trí, client poll hoặc giữ một connection, và một dispatcher xả ra một dòng đều — ví dụ 5.000 mỗi giây — vào checkout thật. Phía sau cổng, áp một token bucket theo từng node (và toàn cục trong Redis) để cả những request đã được admit cũng được làm mượt về mức an toàn của service, loại bỏ hoặc trả 429 cho mọi thứ vượt ngưỡng. Vì tồn kho thật chỉ 1.000 suất, bạn thậm chí có thể ngừng admit khi đã có khoảng chừng đó người vào checkout, biến phòng chờ thành một tín hiệu hết hàng sớm thô bảo vệ backend khỏi tải vô ích.
:::

:::muted
**Trade-off** — Phòng chờ đánh đổi tính tức thời lấy sự ổn định: người dùng phải xếp hàng và trải nghiệm bớt tức thời, nhưng backend khỏe mạnh và những lượt chuyển đổi thực sự xảy ra thì đáng tin. Throttle bằng token bucket đánh đổi một số request được admit-nhưng-bị-từ-chối (429) lấy một trần cứng bảo vệ dòng tồn kho nóng. Bạn cũng chọn nơi đặt cổng — tại CDN/edge là rẻ nhất và chặn tải sớm nhất, nhưng một counter phân tán (Redis) cho tốc độ toàn cục chính xác với cái giá là một round-trip phối hợp; nhiều hệ thống làm admission thô ở edge cộng với token bucket Redis chính xác ngay trước lời gọi inventory.
:::

:::muted
**Cạm bẫy & Failure-mode** — Cạm bẫy lớn nhất là biến chính phòng chờ thành nút thắt cổ chai: nếu mỗi client trong hàng đợi poll mỗi giây, một triệu người tạo ra một triệu RPS poll, nên hãy dùng connection sống lâu, exponential backoff kèm jitter, hoặc một token "quay lại lúc T" đã ký để dàn trải tải. Rate limit chỉ-theo-node không bao được traffic toàn cục — hai mươi node mỗi cái cho 5.000/s sẽ admit 100.000/s, nên bạn cần một limiter chia sẻ cho trần thật. Cuối cùng, một queue ngây thơ có thể bị gian lận: nếu token không được ký và gắn với người dùng, bot sẽ giả vị trí và chen hàng, nên token phải được xác thực, dùng-một-lần, và có giới hạn thời gian.
:::
<!-- @starci/seperator -->
