# question
<!-- @starci/seperator -->
Ghép tất cả lại: thiết kế nền tảng search end-to-end cho một marketplace lớn — ingestion, indexing, query path, ranking, và autocomplete — phục vụ hàng chục nghìn query mỗi giây trên hàng trăm triệu tài liệu. Các mảnh ghép khớp với nhau ra sao, bottleneck nằm đâu, và bạn đánh đổi gì để giữ nó nhanh, tươi, và liên quan ở quy mô lớn?
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
Architecture
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Chia hệ thống thành một write path và một read path nối với nhau bởi index. Trên write path, thay đổi tài liệu chảy từ source of truth qua CDC hoặc event bus vào một pipeline indexing để chuẩn hóa, làm giàu, và phân tích tài liệu, rồi ghi chúng vào một inverted index đã shard-theo-document, được replicate, với refresh near-real-time. Trên read path, một query service phân tích query đến (tokenize, sửa chính tả, mở rộng synonym), một coordinator scatter nó tới mọi shard, mỗi shard retrieve và chấm điểm rẻ các ứng viên bằng BM25, rồi coordinator gather top-K theo từng shard và áp một learned re-ranker nặng hơn trộn relevance với tín hiệu kinh doanh trên tập ứng viên đã merge nhỏ. Autocomplete là một service riêng, đơn giản hơn, dựa trên một cấu trúc prefix in-memory của các query phổ biến với top-K đã cache, refresh từ query log theo lịch. Bọc tất cả bằng caching (cache kết quả query phổ biến, cache autocomplete), timeout hung hăng, và một coordinator trả về kết quả từng phần nếu một shard chậm. Nguyên tắc chỉ đạo là retrieval rẻ-và-rộng trước, ranking đắt-và-hẹp sau, với độ tươi được lái bất đồng bộ khỏi write path.
:::

:::muted
**Trade-off** — Mỗi tầng mã hóa một đánh đổi có chủ đích. Index là một store dẫn xuất, eventually-consistent, nên bạn chấp nhận staleness và một bề mặt consistency riêng để đổi lấy tốc độ đọc. Sharding theo document mua được indexing song song và scale corpus với cái giá fan-out tới mọi shard và tail latency. Ranking hai giai đoạn mua được retrieval high-recall rẻ cộng re-ranking chính xác với cái giá recall mất ở giai đoạn một và một ML pipeline serving/training phải duy trì. Caching mua được throughput và latency với cái giá cache staleness và độ phức tạp invalidation. Độ tươi near-real-time mua được khả năng thấy nhanh với cái giá overhead write/merge cạnh tranh với query. Nghệ thuật là chọn SLA theo từng component — độ tươi, p99 latency, chất lượng relevance — và cấp phát replica cùng refresh interval để đạt chúng mà không tiêu quá mức.
:::

:::muted
**Cạm bẫy & Failure-mode** — Ở quy mô này các failure mang tính hệ thống. Tail latency chi phối vì fan-out nghĩa là một replica chậm làm chậm mọi query, nên bạn cần hedged request, timeout theo từng shard, và khả năng chịu kết quả từng phần. Pipeline indexing là một single point of staleness âm thầm: lag hoặc một poison message làm đứng độ tươi trong khi mọi thứ trông khỏe mạnh, nên hãy giám sát latency indexing end-to-end và làm pipeline idempotent và replayable. Ranking xuống cấp do feedback loop và training/serving skew, nên A/B test thay đổi và giữ một sàn relevance chống over-tune tín hiệu kinh doanh. Hot shard và hot query (một sản phẩm viral, một tìm kiếm người nổi tiếng) dồn tải, giảm thiểu bằng sharding cân bằng cộng result caching. Và hai store (database và index) trôi lệch, nên hãy xây reconciliation và một đường full-reindex sạch bạn có thể chạy không downtime khi phát hiện index bị sai.
:::
<!-- @starci/seperator -->
