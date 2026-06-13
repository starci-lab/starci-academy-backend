# question
<!-- @starci/seperator -->
Trong một cơn mưa lớn, nhu cầu ở một khu phố tăng vọt vượt xa số tài xế sẵn có. Hãy thiết kế surge pricing: làm sao bạn tính độ mất cân đối cung/cầu theo từng khu vực, và làm sao bảo đảm hệ số mà hành khách được báo giá chính là mức họ thực sự trả?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
SurgePricing
## 1
<!-- @starci/seperator -->
Consistency
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Chia thành phố thành các vùng định giá (thường là chính các geo-cell dùng cho lập chỉ mục) và, trên một cửa sổ trượt ngắn, đếm số yêu cầu chuyến đang mở so với số tài xế sẵn có theo từng vùng. Một dịch vụ pricing biến tỷ lệ đó thành một hệ số surge qua một hàm đã được tinh chỉnh có làm mượt, và publish hệ số hiện tại của mỗi vùng vào một cache nhanh. Khi một hành khách yêu cầu báo giá, hệ thống đọc hệ số hiện tại của vùng, tính cước, và — quan trọng nhất — đóng băng báo giá đó: nó lưu hệ số và giá gắn với chuyến (hoặc một token báo giá đã ký, có giới hạn thời gian) sao cho dù surge thay đổi một giây sau, hành khách vẫn bị tính đúng con số họ đã chấp nhận. Tài xế thấy một bản đồ nhiệt các vùng đang surge để nhích nguồn cung về phía nhu cầu.
:::

:::muted
**Trade-off** — Vùng nhỏ hơn và cửa sổ ngắn hơn làm surge nhạy và chính xác cục bộ nhưng giật cục — hệ số chập chờn, hành khách thấy như bị gài, và mẫu nhỏ thì nhiễu; vùng lớn hơn và cửa sổ dài hơn thì ổn định nhưng trễ so với điều kiện thật và làm mờ hotspot. Tính lại surge rất thường xuyên thì chính xác nhưng tốn kém và có thể gây dao động giá; làm mượt và giới hạn nhịp thay đổi đánh đổi tính tức thời lấy một trải nghiệm êm hơn. Đóng băng báo giá rất tốt cho niềm tin của hành khách nhưng nghĩa là giá bị tính có thể lệch khỏi điều kiện thị trường trực tiếp trong cửa sổ hiệu lực của báo giá, nên cửa sổ đó phải ngắn.
:::

:::muted
**Cạm bẫy & Failure-mode** — Lỗi nổi bật là báo một hệ số rồi tính một hệ số khác vì pricing được đọc lại lúc tính tiền thay vì được ghim vào chuyến — điều này phá hủy niềm tin và mời gọi tranh chấp. Các thất bại khác: dao động phản hồi nơi surge đẩy giá lên, nhu cầu giảm, surge tụt, nhu cầu quay lại, và hệ số đung đưa dữ dội mà không có giảm chấn; bất công ở rìa vùng nơi hai hành khách cách 50 m ở hai phía một ranh giới trả giá rất khác nhau; và số liệu cung cũ làm surge quá đà vì các tài xế vừa offline vẫn hiện là sẵn có. Dữ liệu surge cũng nhạy cảm về kinh doanh, nên rò rỉ hoặc publish sai hệ số (hoặc để client tự tính) vừa là rủi ro về tính đúng đắn vừa là rủi ro về tính toàn vẹn.
:::
<!-- @starci/seperator -->
