# question
<!-- @starci/seperator -->
Ghép tất cả lại: hãy thiết kế nền tảng gọi xe đầu-cuối — nạp vị trí, matching, định giá, và vòng đời chuyến đi — chạy trên nhiều thành phố ở vài châu lục. Làm sao bạn phân rã các dịch vụ và shard theo vùng để toàn bộ hệ thống mở rộng được và luôn sẵn sàng?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
staff
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Architecture
## 1
<!-- @starci/seperator -->
Sharding
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Phân rã theo năng lực: một tầng nạp vị trí (các kết nối lâu dài đẩy vào một geo-index Redis/in-memory cộng một luồng Kafka cho lịch sử), một dịch vụ matching/điều phối đọc chỉ mục và chiếm tài xế một cách atomic, một dịch vụ pricing publish surge theo từng vùng, một dịch vụ trip sở hữu máy trạng thái bền vững và tính cước, cùng các dịch vụ hỗ trợ routing/ETA, thông báo, và thanh toán. Shard toàn bộ stack theo địa lý — một chuyến đi vốn mang tính cục bộ, nên một tài xế và hành khách trong cùng thành phố chỉ chạm vào các ô, bộ matcher, và kho trip của vùng đó. Chạy các cell ghim theo vùng được định tuyến bởi một gateway nhận biết địa lý, sao cho mỗi vùng là một đơn vị gần như độc lập với chỉ mục vị trí, điều phối, và database riêng, và lưu lượng xuyên vùng là hiếm (các chuyến sân bay dài, account/config toàn cục). Dán các vùng lại bằng một service mesh toàn cục cho danh tính, thanh toán, và config, và stream các sự kiện (chuyến hoàn tất, thanh toán đã thu) lên một backbone cho phân tích và chống gian lận một cách bất đồng bộ.
:::

:::muted
**Trade-off** — Sharding theo vùng cho mở rộng ngang tự nhiên, tính cục bộ của dữ liệu, cô lập lỗi, và độ trễ thấp (request không bao giờ rời thành phố), nhưng làm phức tạp trường hợp xuyên ranh giới hiếm gặp và đòi hỏi logic định tuyến cộng cân bằng lại khi các thành phố lớn lên hoặc tách ra. Giữ đường nóng matching trong Redis/memory theo từng vùng tối đa hóa tốc độ nhưng đánh đổi độ bền — bạn chấp nhận rằng mất một node làm rớt trạng thái vị trí trực tiếp mà tài xế nhanh chóng bù lại, trong khi kho trip/billing vẫn nhất quán mạnh và bền vững. Bạn cũng chọn nhất quán mạnh theo từng vùng cho điều phối và trạng thái chuyến (không gán đôi, tính cước chính xác) so với nhất quán cuối cùng cho mặt phẳng toàn cục (phân tích, bản đồ nhiệt, đồng bộ profile xuyên vùng), giữ các bảo đảm chặt ở nơi tiền bạc và an toàn hiện diện và nới lỏng chúng ở nơi sự cũ kỹ là vô hại.
:::

:::muted
**Cạm bẫy & Failure-mode** — Thất bại lớn là một database hoặc bộ matcher toàn cục đơn lẻ trở thành điểm nghẽn và một bán kính nổ — một đỉnh tải hay sự cố của một vùng kéo sập tất cả — điều mà cô lập theo vùng đặc biệt ngăn chặn, nên một thiết kế phẳng không shard sẽ không sống sót ở quy mô đa châu lục. Các ô ranh giới giữa các vùng có thể bỏ rơi hoặc xử lý đôi các tài xế gần đường nối trừ khi quyền sở hữu là tường minh. Hotspot (sân bay, concert, đêm giao thừa) làm quá tải đường điều phối và surge của một vùng đơn lẻ, đòi hỏi autoscaling và backpressure. Và các phụ thuộc toàn cục trên đường nóng — xác thực thanh toán đồng bộ hay một lượt tra cứu config trung tâm trước một match — ghép mọi điều phối vào một dịch vụ xa; hãy giữ matching cục bộ và đẩy thanh toán, chống gian lận, và phân tích sang các luồng bất đồng bộ sao cho độ trễ hay sự cố của một phụ thuộc xa không bao giờ chặn việc đưa một hành khách lên xe.
:::
<!-- @starci/seperator -->
