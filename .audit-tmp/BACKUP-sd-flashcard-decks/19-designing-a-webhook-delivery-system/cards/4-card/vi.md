# question
<!-- @starci/seperator -->
Một subscriber than phiền rằng họ nhận `subscription.updated` trước `subscription.created` cho cùng một object, làm hỏng state machine của họ. Khi nào consumer webhook thực sự cần gửi theo thứ tự, bạn cung cấp điều đó thế nào, và ordering nghiêm ngặt khiến bạn trả giá gì?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Ordering
## 1
<!-- @starci/seperator -->
Throughput
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Thứ tự chỉ quan trọng trong phạm vi một entity (cùng một subscription, cùng một order), không phải toàn cục, nên hãy cung cấp ordering theo từng key thay vì một total order toàn cục. Phân vùng delivery theo một ordering key ổn định (ví dụ resource id) và xử lý sự kiện của mỗi key một cách tuần tự — mỗi key chỉ có một delivery đang bay, sự kiện kế tiếp của key đó chỉ được phát đi sau khi cái trước đã được ack — trong khi các key khác nhau vẫn chạy song song. Với retry, điều này nghĩa là một delivery fail của một key sẽ chặn các sự kiện sau của chính key đó tới khi nó thành công hoặc bị dead-letter. Một cách khác tránh hẳn việc tuần tự hóa là gắn một sequence number hoặc version đơn điệu vào mỗi sự kiện và để consumer tự sắp xếp lại hoặc bỏ các sự kiện cũ.
:::

:::muted
**Trade-off** — Ordering nghiêm ngặt theo từng key đơn giản để consumer suy luận, nhưng nó biến một delivery độc lập, song song được thành một chuỗi tuần tự cho mỗi key, giới hạn throughput cho một key nóng và nghĩa là một sự kiện bị kẹt sẽ head-of-line-block mọi sự kiện sau của resource đó. Cách sequence-number-rồi-để-consumer-sắp-xếp giữ delivery hoàn toàn song song và bền bỉ, nhưng đẩy độ phức tạp sang từng consumer, vốn phải lưu version cuối thấy được và xử lý việc đến lệch thứ tự. Đa số nền tảng chọn at-least-once không đảm bảo thứ tự cộng với version number, vì đảm bảo thứ tự qua một mạng không tin cậy có retry rất đắt và nhiều use case chịu được việc đảo thứ tự nếu sự kiện mang đủ trạng thái.
:::

:::muted
**Cạm bẫy & Failure-mode** — Hứa hẹn ordering toàn cục là một cái bẫy: retry, nhiều worker, và sự biến thiên của mạng làm cho thứ tự xuyên-entity thực sự gần như bất khả thi nếu không tuần tự hóa đến tê liệt. Ngay cả ordering theo từng key cũng fail một cách tinh vi nếu bạn chọn key sai (sắp theo user id trong khi entity là order id) khiến các sự kiện liên quan rải khắp các partition. Và việc tuần tự hóa theo key tạo ra một failure mode mới khi một delivery độc hại đơn lẻ làm đình trệ vĩnh viễn mọi sự kiện sau của key đó — bạn cần một lối thoát dead-letter để chuỗi tiến lên được, chấp nhận rằng consumer khi đó có thể thấy một khoảng trống.
:::
<!-- @starci/seperator -->
