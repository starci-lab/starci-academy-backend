# question
<!-- @starci/seperator -->
Hàng triệu người refresh trang sản phẩm/landing trong những giây trước giờ mở bán. Origin của bạn không phục vụ nổi lượng đó, nhưng buy endpoint lại phải nhất quán mạnh về tồn kho. Bạn tách trang ra sao để phần lớn được phục vụ từ CDN trong khi buy path vẫn đúng?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
CDN
## 1
<!-- @starci/seperator -->
Caching
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Tách phần vỏ tĩnh khỏi sự thật động. Trang landing — hình ảnh, nội dung, bố cục, kể cả logic đếm ngược — giống hệt nhau với mọi người, nên render nó thành một asset tĩnh và đẩy lên CDN với TTL dài để hàng triệu lượt tải trang được phục vụ hoàn toàn ở edge và không bao giờ chạm origin. Phần động duy nhất là "đã mở bán chưa" và "còn bao nhiêu", thứ bạn lấy bằng một request nhỏ riêng có thể cache trong một giây hoặc phục vụ từ một tầng in-memory nhanh, và được nói rõ là xấp xỉ. Còn buy/checkout endpoint thật thì không bao giờ cache: nó đi qua admission control tới inventory service và làm atomic decrement, nên tính đúng đắn chỉ sống trên cái path mỏng được bảo vệ đó trong khi mọi thứ cache được đều được đẩy ra ngoài.
:::

:::muted
**Trade-off** — Cache trang và chỉ báo tồn kho đánh đổi độ tươi lấy khả năng sống sót: số "còn lại" hiển thị có thể trễ thực tế một giây hoặc cố tình thô ("sắp hết"), điều đó ổn vì buy endpoint, chứ không phải trang, mới là nguồn sự thật. Bạn chấp nhận rằng một số người dùng bấm mua trên một trang còn hiển thị stock thực ra đã hết, và bạn xử lý điều đó một cách nhã nhặn ở checkout thay vì cố giữ trang tươi tuyệt đối. Đẩy đếm ngược về client (timer phía client đồng bộ với thời gian server) đánh đổi một rủi ro lệch đồng hồ nhỏ để loại bỏ một làn sóng poll "đã mở bán chưa" đồng loạt lên origin.
:::

:::muted
**Cạm bẫy & Failure-mode** — Lỗi kinh điển là render số tồn kho vào HTML đã cache, khiến trang hoặc không cache được hoặc đóng băng một con số cũ cho tất cả mọi người suốt cả TTL. Một lỗi khác là để endpoint "còn bao nhiêu" không cache và bị mọi client poll mỗi giây nện vào, tái tạo đúng cái overload origin bạn đã cố tránh — hãy cache nó ngắn và thêm jitter hoặc push cập nhật. Một failure tinh vi là cache stampede trên trang tĩnh tại T-zero nếu TTL của nó hết hạn đúng giờ mở bán, nên hãy pre-warm CDN và so le các thời điểm hết hạn. Cuối cùng, đừng bao giờ để buy endpoint dùng chung cache với bất cứ thứ gì: một rule CDN cấu hình sai cache response checkout có thể phục vụ xác nhận của một người dùng hoặc một trạng thái hết-hàng cũ cho hàng nghìn người, làm hỏng cả đợt bán.
:::
<!-- @starci/seperator -->
