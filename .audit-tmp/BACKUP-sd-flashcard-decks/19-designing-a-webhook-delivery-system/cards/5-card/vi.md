# question
<!-- @starci/seperator -->
Một subscriber sập sáu giờ trong lúc deploy và làm cạn ngân sách retry trên hàng nghìn delivery, nên các sự kiện đó giờ thất bại vĩnh viễn. Hãy thiết kế xử lý dead-letter và một cơ chế replay để subscriber có thể phục hồi những sự kiện đã bỏ lỡ khi họ khỏe mạnh trở lại.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Dead Letter
## 1
<!-- @starci/seperator -->
Replay
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Khi một delivery làm cạn số lần retry, đừng vứt bỏ nó: chuyển nó vào một kho dead-letter giữ trọn delivery (event id, payload, subscriber, lịch sử các lần thử, lỗi cuối) và đánh dấu bản ghi delivery là `failed` để có thể truy vấn. Phơi bày các thất bại này cho subscriber qua một dashboard và một API list/get, và phát một cảnh báo hoặc bản tổng hợp hằng ngày để thất bại hiện ra chứ không âm thầm. Cung cấp một thao tác replay — theo từng delivery id, theo khoảng thời gian, hoặc theo loại sự kiện — để đẩy lại các delivery gốc qua pipeline bình thường, dùng lại delivery id gốc để vẫn dedupe được. Replay nên idempotent ở phía consumer và được rate-limit để một đợt replay hàng loạt không nhấn chìm endpoint vừa mới phục hồi.
:::

:::muted
**Trade-off** — Giữ một kho dead-letter giàu thông tin, truy vấn được với payload đầy đủ giúp replay tự phục vụ và debug rất tốt, nhưng nó làm phình storage và có thể lưu payload nhạy cảm lâu sau khi sự kiện xảy ra, đặt ra lo ngại về retention và tuân thủ. Replay tự động (tự retry toàn bộ DLQ khi breaker đóng) tiện lợi nhưng có nguy cơ gửi lại các sự kiện subscriber không còn muốn hoặc làm họ giẫm đạp; replay thủ công do vận hành viên hay subscriber kích hoạt thì an toàn hơn nhưng chậm hơn và cần công cụ tốt. Dùng lại delivery id gốc giữ cho dedupe hoạt động nhưng nghĩa là một consumer có cửa sổ lưu id ngắn có thể coi một sự kiện được replay là hoàn toàn mới.
:::

:::muted
**Cạm bẫy & Failure-mode** — Thất bại lớn nhất là một dead-letter âm thầm: các sự kiện hết hạn vào một queue chẳng ai theo dõi, và subscriber phát hiện mất dữ liệu vài ngày sau. Replay không rate-limit tái tạo lại đúng sự cố ban đầu bằng cách dội toàn bộ backlog cùng lúc vào endpoint vừa phục hồi. Replay lệch thứ tự có thể phá vỡ các consumer phụ thuộc vào sequence theo từng entity, nên replay phải giữ ordering key hoặc gửi version number. Cuối cùng, replay với một delivery id mới sẽ vô hiệu hóa dedupe và làm subscriber xử lý lặp — hãy luôn replay với id gốc.
:::
<!-- @starci/seperator -->
