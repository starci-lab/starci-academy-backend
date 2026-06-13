# question
<!-- @starci/seperator -->
Team của bạn chuẩn bị mở flash sale: 1.000 chiếc điện thoại mở bán đúng 12:00, và marketing dự kiến hai triệu người vào trang trong phút đầu tiên. Tại sao việc này về bản chất khó hơn traffic thương mại điện tử bình thường, và đâu là mâu thuẫn cốt lõi bạn phải thiết kế xoay quanh?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
junior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Flash Sale
## 1
<!-- @starci/seperator -->
Fundamentals
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Đặc tính định nghĩa là một cú spike đồng bộ: thay vì nhu cầu trải đều cả ngày, gần như toàn bộ traffic dồn về trong vài giây, được kích bởi một bộ đếm ngược đã biết trước. Capacity planning bình thường giả định một đường cong mượt, nhưng ở đây đỉnh có thể gấp hàng trăm lần trung bình, nên bạn phải thiết kế cho burst chứ không phải cho mức trung bình. Đặc tính thứ hai là sự khan hiếm: hai triệu người tranh nhau 1.000 suất, nghĩa là 99,95% request chắc chắn không mua được, nhưng mỗi request đó vẫn tốn CPU, connection database và băng thông. Mâu thuẫn cốt lõi là bạn phải tiếp nhận và loại bỏ gần như toàn bộ traffic này một cách rẻ tiền mà vẫn phải hoàn toàn chính xác về lượng tồn kho tí hon.
:::

:::muted
**Trade-off** — Bạn đánh đổi tính công bằng và trải nghiệm phong phú lấy khả năng sống sót. Đảm bảo "first-come-first-served tới từng mili-giây" gần như bất khả thi ở quy mô này, nên đa số hệ thống chấp nhận công bằng xấp xỉ (queue, admission ngẫu nhiên) để đổi lấy việc không sụp đổ. Bạn cũng đẩy càng nhiều việc ra edge càng tốt (CDN, trang tĩnh, đếm ngược phía client) và chỉ giữ lại thao tác thực sự có state — decrement tồn kho — trên một hot path nhỏ được bảo vệ kỹ. Cái giá là độ phức tạp tăng và cảm giác kém "real-time" cho người dùng bị đưa vào phòng chờ.
:::

:::muted
**Cạm bẫy & Failure-mode** — Lỗi kinh điển là coi flash sale như traffic peak thông thường và chỉ autoscale tầng web; tầng stateless scale ổn, nhưng tất cả request đều dồn vào một dòng tồn kho và một cache key sản phẩm, và điểm nóng duy nhất đó tan chảy. Một lỗi khác là để traffic thua cuộc chạm tới database; hai triệu lượt đọc lên một dòng sẽ làm cạn connection và bỏ đói vài request thực sự có thể thành công. Team cũng hay quên cú thundering herd tại T-zero, khi mọi client poll hoặc bắn cùng một khoảnh khắc; không có jitter, admission control hay queue thì spike còn dốc hơn cả số người dùng thô gợi ý.
:::
<!-- @starci/seperator -->
