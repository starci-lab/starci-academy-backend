# question
<!-- @starci/seperator -->
Vì hệ thống của bạn là at-least-once, subscriber thỉnh thoảng sẽ nhận cùng một webhook hai lần, và họ cũng cần chắc chắn một request thực sự đến từ bạn chứ không bị giả mạo. Bạn thiết kế delivery id và ký chữ ký cho request thế nào để consumer vừa dedupe được vừa xác thực được tính chính danh?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Idempotency
## 1
<!-- @starci/seperator -->
HMAC
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Đóng dấu mỗi delivery bằng một id ổn định và duy nhất (ví dụ header `X-Webhook-Id`) giữ nguyên qua mọi lần retry của delivery đó, để consumer có thể lưu các id đã thấy và coi một lần lặp lại là no-op. Về tính chính danh, tính một chữ ký HMAC trên raw body của request (cộng thêm timestamp) bằng một secret dùng chung riêng cho từng subscriber, và gửi nó trong một header như `X-Webhook-Signature`. Consumer tính lại HMAC bằng bản secret của họ và so sánh bằng kiểm tra bằng nhau theo thời gian hằng số; khớp tức là payload do người nắm giữ secret tạo ra và không bị sửa trên đường truyền. Đưa timestamp vào trong phần dữ liệu được ký và từ chối các delivery có timestamp quá cũ để làm cùn các đòn replay.
:::

:::muted
**Trade-off** — HMAC đối xứng đơn giản, nhanh, và dễ cho consumer triển khai, nhưng secret dùng chung tồn tại ở cả hai phía, nên bất kỳ subscriber nào bị xâm phạm cũng buộc phải xoay secret đó và một lần rò rỉ cho phép kẻ tấn công giả mạo sự kiện. Chữ ký bất đối xứng (nền tảng ký bằng private key, consumer xác minh bằng public key) loại bỏ vấn đề secret dùng chung và tốt hơn cho nhiều consumer không đáng tin, đổi lại là phân phối và xoay khóa phức tạp hơn. Ký trên raw bytes là thiết yếu nhưng ràng buộc bạn: consumer phải xác minh trước khi re-serialize JSON, vì mã hóa lại có thể đổi bytes và làm hỏng chữ ký.
:::

:::muted
**Cạm bẫy & Failure-mode** — Bug xác minh thường gặp nhất là ký hoặc so sánh body đã parse/re-serialize thay vì đúng bytes nhận được, sinh ra những chữ ký fail một cách bí ẩn với một số payload. Dùng so sánh chuỗi không theo thời gian hằng số làm rò rỉ thông tin định thời, có thể giúp kẻ tấn công giả mạo chữ ký. Về phía dedupe, cửa sổ lưu id quá ngắn để một retry đến muộn lọt qua như một sự kiện "mới", và coi một bản trùng là lỗi thay vì no-op âm thầm sẽ phá vỡ các retry at-least-once hợp lệ — dedupe phải mang tính idempotent, không phải từ chối.
:::
<!-- @starci/seperator -->
