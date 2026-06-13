# question
<!-- @starci/seperator -->
Endpoint của một subscriber thỉnh thoảng trả 503 và đôi khi timeout. Hãy thiết kế chính sách retry cho việc gửi at-least-once: bạn lập lịch retry thế nào, vì sao thêm jitter, và quyết định khi nào ngừng retry rồi đưa delivery vào dead-letter ra sao?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Retries
## 1
<!-- @starci/seperator -->
Backoff
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Retry theo exponential backoff: độ trễ tăng theo cấp số nhân (ví dụ 10s, 30s, 2m, 10m, 1h…) để một endpoint đang chật vật có thêm thời gian thở thay vì bị dội liên tục. Thêm jitter ngẫu nhiên vào mỗi khoảng trễ để hàng nghìn delivery cùng fail tại một thời điểm không cùng retry tại một thời điểm và tạo ra thundering herd đồng bộ. Coi 5xx, timeout và lỗi kết nối là retryable; coi 4xx (trừ 429) là terminal vì retry một request sai định dạng hoặc không có quyền sẽ chẳng bao giờ thành công. Đặt trần số lần thử (hoặc một ngân sách tổng thời gian như 24 giờ), và khi chạm trần thì chuyển delivery sang dead-letter queue và đánh dấu delivery của subscriber là thất bại vĩnh viễn.
:::

:::muted
**Trade-off** — Retry dồn dập với backoff ngắn tối đa hóa khả năng phục hồi nhanh một trục trặc thoáng qua, nhưng nó khuếch đại tải lên một endpoint vốn đã ốm yếu và có thể giữ worker bận rộn với những delivery vô vọng. Backoff dài và ngân sách số lần thử rộng rãi cải thiện khả năng thành công về sau và sống sót qua các sự cố kéo dài nhiều giờ, nhưng làm tăng độ trễ gửi end-to-end và phình to lượng retry đang chờ mà bạn phải lưu và theo dõi. Trần số lần thử là cái núm giới hạn chi phí tài nguyên trường hợp xấu nhất: quá thấp thì bỏ cuộc với sự cố vốn có thể phục hồi, quá cao thì một subscriber chết vĩnh viễn lãng phí năng lực hàng ngày trời.
:::

:::muted
**Cạm bẫy & Failure-mode** — At-least-once cộng retry đảm bảo đôi khi bạn sẽ gửi cùng một sự kiện nhiều hơn một lần (subscriber đã nhận nhưng response 200 của nó bị mất), nên trùng lặp không phải bug cần triệt tiêu mà là một hợp đồng cần ghi rõ — consumer phải dedupe. Một lỗi thường gặp là retry các response non-idempotent hoặc non-retryable, dội mãi vào một endpoint trả 400 không dứt. Lỗi khác là retry vô hạn không có dead-letter, âm thầm làm đầy queue và bỏ đói các delivery khỏe mạnh; hãy luôn đặt trần số lần thử và phơi bày những cái đã dead-letter để vận hành viên hay subscriber có thể xử lý.
:::
<!-- @starci/seperator -->
