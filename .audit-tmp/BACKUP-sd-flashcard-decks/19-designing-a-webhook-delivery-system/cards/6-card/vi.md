# question
<!-- @starci/seperator -->
Một đợt bùng nổ sự kiện tạo ra 5.000 webhook cho một subscriber trong vài giây, nhưng endpoint của họ chỉ chịu được khoảng 50 request mỗi giây và bắt đầu trả 429. Bạn rate limit việc gửi theo từng subscriber thế nào để tôn trọng năng lực của mỗi consumer thay vì dội bom vào nó?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Rate Limiting
## 1
<!-- @starci/seperator -->
Backpressure
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Giới hạn tốc độ gửi ra ngoài theo từng subscriber, không chỉ toàn cục, bằng một token bucket khóa theo subscriber id: mỗi delivery tiêu một token, bucket nạp lại theo tốc độ cấu hình của subscriber (mặc định cộng với bất kỳ giới hạn nào đã thỏa thuận trong hợp đồng), và worker chặn hoặc hoãn khi bucket cạn. Queue tự nhiên hấp thụ đợt bùng nổ như backpressure, làm mượt 5.000 sự kiện thành một dòng đều mà endpoint tiêu hóa được. Coi `429 Too Many Requests` từ consumer là một tín hiệu hạng nhất: tôn trọng header `Retry-After` của nó và động thái giảm tốc độ của subscriber đó xuống, thay vì tính nó như một thất bại thường. Hãy làm giới hạn theo subscriber có thể cấu hình để các consumer năng lực cao không bị throttle một cách giả tạo.
:::

:::muted
**Trade-off** — Rate limit theo từng subscriber bảo vệ những endpoint mong manh và là một công dân tốt, nhưng nó tăng độ trễ gửi cho các sự kiện bùng nổ và thêm trạng thái (một token bucket phân tán, thường ở Redis) mà mọi worker phải tra trên hot path. Một cách thuần phản ứng — gửi nhanh rồi chỉ lùi khi gặp 429 — không cần giới hạn cấu hình trước và tự thích nghi, nhưng nó đảm bảo bạn vượt ngưỡng và dội vào endpoint trước khi học được trần của nó, vốn đúng là điều bạn đang cố tránh. Giới hạn tĩnh cấu hình sẵn thì dễ đoán nhưng có thể lỗi thời; giới hạn thích nghi bám sát năng lực thật nhưng phức tạp hơn và có thể dao động.
:::

:::muted
**Cạm bẫy & Failure-mode** — Một lỗi thường gặp là chỉ áp một rate limit toàn cục, khiến đợt bùng nổ của một subscriber ngốn hết ngân sách dùng chung và bỏ đói những subscriber khác, hoặc ngược lại để các giới hạn cục bộ theo từng worker cộng lại thành nhiều hơn nhiều so với mức subscriber chịu được vì không gì điều phối giữa các worker — bucket phải dùng chung/phân tán. Phớt lờ `Retry-After` và retry mù một response 429 biến rate limit thành một cú DoS tự gây ra. Và rate limit tương tác với retry: nếu các delivery bị throttle chất đống vô hạn thì rốt cuộc bạn vi phạm ngân sách retry và dead-letter những sự kiện vốn chỉ chậm chứ không hỏng, nên hãy ghép giới hạn với độ sâu queue hợp lý và backpressure.
:::
<!-- @starci/seperator -->
