# question
<!-- @starci/seperator -->
Khi một seller cập nhật giá sản phẩm hoặc đánh dấu hết hàng, việc đó nên hiện ra trong search nhanh đến đâu, và bạn giữ index tươi bằng cách nào? So sánh near-real-time indexing với batch rebuild, và giải thích trade-off read/write làm cho "tươi tức thì" trở nên đắt đỏ.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Index Freshness
## 1
<!-- @starci/seperator -->
NRT Indexing
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Lái indexing từ một change stream: cập nhật sản phẩm phát ra event (CDC từ database hoặc một event bus của ứng dụng), một pipeline indexing tiêu thụ chúng, phân tích lại các tài liệu bị ảnh hưởng, và ghi chúng vào index. Để có độ tươi near-real-time, các engine ghi tài liệu đến vào các segment in-memory nhỏ trở nên tìm kiếm được trong một hai giây qua một "refresh" định kỳ, trong khi các segment bền vững trên disk được merge ở background; đây là cách các hệ thống dựa trên Lucene (Elasticsearch, Solr) cho khả năng thấy được dưới một giây. Vì các segment của inverted index là bất biến, một update được hiện thực dưới dạng delete-cộng-insert: tài liệu cũ bị tombstone và một segment mới giữ phiên bản mới. Bạn chọn một freshness SLA theo từng use case — hết hàng nên lan truyền trong vài giây (một kết quả "còn hàng" cũ là trải nghiệm tệ), còn một reindex toàn bộ sau khi đổi mapping có thể chạy như một batch định kỳ.
:::

:::muted
**Trade-off** — Đây là căng thẳng read/write cốt lõi: inverted index được tối ưu cho đọc nhanh, nên mỗi lần ghi tốn analysis, tạo segment, và merge sau cùng, và đẩy độ tươi về real-time nhân lên overhead ghi và merge đó, ngốn CPU và I/O cạnh tranh với việc phục vụ query. Refresh thường xuyên tạo nhiều segment tí hon làm chậm query cho đến khi merge, còn refresh thưa tiết kiệm tài nguyên nhưng tăng staleness. Batch rebuild hiệu quả về throughput và tạo segment sạch, nén tốt (tuyệt cho read latency) nhưng để index cũ vài phút đến vài giờ. Vậy bạn đánh đổi chi phí ghi và độ phức tạp vận hành để lấy độ tươi, và bạn có thể chỉnh refresh interval và merge policy để nằm bất cứ đâu trên đường cong đó.
:::

:::muted
**Cạm bẫy & Failure-mode** — Failure chủ đạo là indexing lag: nếu pipeline tụt lại (backlog trong change stream, consumer chậm, hay một cơn bão merge), search âm thầm phục vụ dữ liệu cũ trong khi database vẫn đúng, nên bạn phải giám sát latency indexing end-to-end, không chỉ độ sâu queue. Refresh quá hung hăng gây bùng nổ số segment và merge thrash làm tụt query latency — một sự cố tự gây kinh điển. Update-dưới-dạng-delete-cộng-insert tích lũy tombstone, làm phình index cho đến khi merge thu hồi, nên workload update nặng cần một merge policy giữ tỉ lệ deleted-doc trong tầm kiểm soát. Cuối cùng, thứ tự và idempotency quan trọng: event sai thứ tự có thể hồi sinh một tài liệu đã xóa, nên hãy version mỗi tài liệu và bỏ các update cũ.
:::
<!-- @starci/seperator -->
