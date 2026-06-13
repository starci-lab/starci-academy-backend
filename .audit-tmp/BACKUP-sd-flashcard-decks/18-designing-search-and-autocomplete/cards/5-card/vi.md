# question
<!-- @starci/seperator -->
Index không còn vừa trên một máy và lượng query đang tăng. Thiết kế cách bạn shard và replicate inverted index. Giải thích đường đi query scatter-gather, làm sao bạn merge đúng các kết quả đã xếp hạng qua các shard, và tại sao global scoring là phần khó tinh tế.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Sharding
## 1
<!-- @starci/seperator -->
Scatter-Gather
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Shard index theo document (mỗi shard sở hữu một tập con tài liệu và giữ một inverted index hoàn chỉnh chỉ trên các tài liệu đó), đây là lựa chọn chuẩn vì nó giữ mỗi shard tự-đầy-đủ và scale theo kích thước corpus. Một coordinator nhận query, scatter nó tới tất cả shard (hoặc tất cả replica của shard), mỗi shard tự retrieve và score top-K cục bộ của mình, rồi coordinator gather các list top-K theo từng shard và merge chúng thành global top-K — thường là một k-way merge các list đã sắp xếp. Replicate mỗi shard qua nhiều node để có availability và read throughput, route mỗi query tới một replica cho mỗi shard và cân bằng tải giữa chúng. Để scale đọc bạn thêm replica; để scale corpus bạn thêm shard. Việc fan-out nghĩa là tổng latency bị chặn bởi shard chậm nhất, nên bạn kích cỡ shard để mỗi cái xong local search trong ngân sách.
:::

:::muted
**Trade-off** — Sharding theo document làm indexing và lưu trữ song song một cách tầm thường nhưng biến mỗi query thành một fan-out tới mọi shard, nên tail latency bị chi phối bởi replica chậm nhất và thêm shard làm tăng khả năng có một cái chậm (vấn đề tail-amplification). Phương án thay thế, term sharding (mỗi shard sở hữu một số term), tránh fan-out cho query một-term nhưng làm phép giao đa-term phải di chuyển dữ liệu cross-shard và tạo hot shard cho các term phổ biến, nên hiếm khi dùng. Replication đánh đổi lưu trữ và write amplification (mọi replica phải được cập nhật) để lấy khả năng scale đọc và chịu lỗi. Nhiều shard hơn nghĩa là song song hơn nhưng cũng nhiều overhead điều phối hơn và chi phí fan-out cố định mỗi query cao hơn.
:::

:::muted
**Cạm bẫy & Failure-mode** — Bẫy đúng đắn tinh tế là global scoring: BM25 và IDF phụ thuộc vào thống kê term toàn corpus (document frequency), nhưng mỗi shard chỉ thấy tài liệu của mình, nên IDF tính cục bộ khác nhau theo từng shard và merge ngây thơ các điểm cục bộ tạo ra ranking toàn cục không nhất quán — bạn cần thống kê term phân tán hoặc một cách tiếp cận hai-pass để làm điểm so sánh được. Failure vận hành kinh điển là slow-shard / straggler: một replica suy giảm làm mọi query chậm, giảm thiểu bằng hedged request, timeout theo từng shard, và health check replica. Under-fetch là bẫy khác — nếu mỗi shard chỉ trả top-K của nó nhưng global top-K thật bị dồn lệch vào một shard, bạn phải yêu cầu đủ mỗi shard để đảm bảo đúng. Cuối cùng, phân bố tài liệu không đều tạo hot shard, nên shard theo một key cân bằng, không theo thứ tương quan với query traffic.
:::
<!-- @starci/seperator -->
