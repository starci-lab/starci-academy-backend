# question
<!-- @starci/seperator -->
Một người dùng giành được một suất và chuyển sang thanh toán, nhưng thanh toán mất từ 30 giây tới vài phút và nhiều người thắng lại bỏ giữa chừng. Hãy thiết kế luồng reservation-và-payment: bạn giữ stock trong lúc thanh toán, hết giờ chờ, và release các reservation chưa trả tiền về lại pool như thế nào?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Reservation
## 1
<!-- @starci/seperator -->
Payment
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Mô hình hóa stock thành hai pha: một reservation giữ suất trong khi thanh toán đang chờ, và một confirmation chuyển reservation thành đơn đã bán. Khi một người thắng, atomic decrement stock khả dụng và tạo một reservation kèm thời điểm hết hạn (ví dụ hai phút) — đây chính là cùng atomic decrement chống oversell, chỉ được gắn nhãn "đang giữ". Khi thanh toán thành công bạn confirm reservation; nếu thanh toán thất bại hoặc bộ đếm hết giờ, bạn release suất bằng cách cộng lại stock khả dụng và đánh dấu reservation đã hết hạn để người khác mua được. Một sweeper nền (một job định lịch hoặc một Redis key TTL kèm keyspace notification, hoặc một delay queue) lo phần hết hạn để các reservation bị bỏ không khóa tồn kho vĩnh viễn.
:::

:::muted
**Trade-off** — Reserve-rồi-confirm đánh đổi tính khả dụng thực tế lấy trải nghiệm mua tốt: trong khi các suất bị giữ ở trạng thái chờ thanh toán, chúng không khả dụng với người khác dù một số thanh toán đó sẽ không bao giờ hoàn tất, nên timeout ngắn tối đa hóa throughput nhưng rủi ro cắt mất người trả chậm-nhưng-thật, còn timeout dài làm mắc kẹt tồn kho và có thể khiến một đợt bán chưa thực sự hết hàng trông như hết hàng. Bạn cũng chọn giữa release ngay khoảnh khắc đồng hồ chạm và một sweep định kỳ — release ngay thu hồi tồn kho nhanh nhất nhưng phức tạp và ồn ào hơn, còn sweep đơn giản hơn nhưng thêm độ trễ trước khi stock quay lại. Giữ state trong Redis kèm TTL thì nhanh và tự hết hạn nhưng cần reconcile với bản ghi đơn hàng bền.
:::

:::muted
**Cạm bẫy & Failure-mode** — Race nguy hiểm là giữa hết hạn và một thanh toán thành công muộn: nếu sweeper release một reservation đúng lúc webhook thanh toán confirm nó, bạn có thể hoặc oversell (release cho người khác đồng thời cũng confirm) hoặc mất một đơn đã trả tiền. Hãy bảo vệ phần confirm bằng một conditional update chỉ thành công nếu reservation còn ở trạng thái đang giữ, và làm phần release cũng có điều kiện tương tự, để hai bên không thể cùng thắng. Một lỗi khác là release stock nhưng quên vô hiệu hóa luôn checkout session của người dùng, để họ trả tiền cho một suất họ không còn giữ. Cuối cùng, nếu release cộng thẳng stock mà không idempotent, một lần hết hạn bị retry hoặc bắn đôi có thể cộng dư counter và tái tạo oversell từ chiều ngược lại.
:::
<!-- @starci/seperator -->
