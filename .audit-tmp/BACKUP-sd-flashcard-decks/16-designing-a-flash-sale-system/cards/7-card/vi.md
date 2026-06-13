# question
<!-- @starci/seperator -->
Ghép tất cả lại: hãy thiết kế hệ thống flash-sale end-to-end ở quy mô lớn — từ CDN edge qua waiting room, inventory service, tới payment — và giải thích mỗi tầng degrade một cách nhã nhặn ra sao để khi quá tải hệ thống loại bỏ tải thay vì làm hỏng tồn kho hay sập nền tảng.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
staff
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
System Design
## 1
<!-- @starci/seperator -->
Graceful Degradation
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Phân tầng hệ thống để mỗi tầng hấp thụ phần nó làm được và bảo vệ tầng kế tiếp. CDN phục vụ trang landing tĩnh và một chỉ báo tồn kho xấp xỉ được cache ngắn, nên đại đa số traffic kết thúc ở edge. Một virtual waiting room cho các token đã ký và xác thực vào checkout với tốc độ an toàn của inventory service, với một token bucket toàn cục giữ trần, và ngừng admit khi đã có khoảng chừng số suất khả dụng đi vào. Inventory service là lõi có state mỏng: nó làm atomic decrement (counter trên Redis, có thể shard thành bucket, với database làm sổ cái bền) được bảo vệ bằng idempotency key, tạo một reservation có giới hạn thời gian. Payment chạy bất đồng bộ; khi thành công reservation được confirm thành đơn, và một sweeper release các reservation hết hạn về lại pool. Tầng web/app stateless autoscale thoải mái vì ràng buộc đúng đắn cứng chỉ sống trong cái path inventory nhỏ đó.
:::

:::muted
**Trade-off** — Kiến trúc đánh đổi sự đơn giản và cảm giác real-time hoàn hảo lấy khả năng sống sót và tính đúng đắn: waiting room, counter chia shard, reconcile eventual, và payment bất đồng bộ đều thêm bộ phận chuyển động và góc nhìn xấp xỉ, nhưng chúng bao tải lên cái nơi duy nhất không bao giờ được sai. Bạn ưu tiên loại bỏ tải sớm và rẻ hơn là phục vụ tất cả mọi người, và đếm toàn cục xấp xỉ hơn là chính xác, chấp nhận rằng "hết hàng" có thể hiện ra một khoảnh khắc trước khi reservation cuối confirm. Bạn cũng chọn payment bất đồng bộ thay vì đồng bộ để giữ hot path ngắn, với cái giá là một state machine reservation/confirmation và logic timeout nó đòi hỏi. Mỗi bước degrade — phục vụ tồn kho đã cache, queue, throttle, loại bỏ với trang hết-hàng thân thiện — là một đánh đổi có chủ ý giữa sự phong phú và việc trụ vững.
:::

:::muted
**Cạm bẫy & Failure-mode** — Failure cấp nền tảng cần tránh là sụp đổ tương quan: nếu traffic thua cuộc chạm database, hoặc hot counter là một key duy nhất, hoặc các lượt poll của waiting room nện vào origin, thì một điểm nóng kéo sập cả đợt bán và đe dọa phần còn lại của nền tảng — nên hãy cô lập path flash-sale (pool riêng, bulkhead, circuit breaker) để quá tải của nó không bỏ đói các service không liên quan. Graceful degradation phải tường minh: khi admission đầy, trả về nhanh một trang "hết hàng / thử lại" có thể cache thay vì một timeout, và đừng bao giờ để một failure mở cửa cho oversell. Bug thâm hiểm nhất là một khe hở đúng đắn dưới degrade — ví dụ release reservation và confirm payment race nhau trong một outage cục bộ — nên mọi chuyển trạng thái (decrement, reserve, confirm, release) phải atomic và idempotent, và sổ cái bền phải reconcile được sau cơn bão để chứng minh bạn đã bán đúng số suất bạn có.
:::
<!-- @starci/seperator -->
