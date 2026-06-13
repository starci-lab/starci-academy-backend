# question
<!-- @starci/seperator -->
Một chuyến đi đi qua requested → accepted → driver-arrived → in-progress → completed. Giữa chuyến, điện thoại của hành khách mất sóng hai phút. Hãy thiết kế máy trạng thái chuyến đi sao cho chuyến sống sót qua các sự cố rớt app/mạng và cả hai phía cuối cùng đều nhất quán.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
StateMachine
## 1
<!-- @starci/seperator -->
Reliability
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Mô hình hóa chuyến đi như một máy trạng thái tường minh phía server, nơi backend là nguồn sự thật duy nhất và chỉ các chuyển trạng thái hợp lệ được phép (ví dụ chỉ có thể vào in-progress từ accepted/arrived, vào completed từ in-progress). Mỗi chuyển trạng thái là một lệnh idempotent, có xác thực (`startTrip`, `completeTrip`) mang theo ID chuyến và một request key do client sinh, được persist bền vững cùng trạng thái mới và một version tăng đơn điệu. Client là các góc nhìn mỏng chỉ render bất kỳ trạng thái nào server báo; khi kết nối lại, điện thoại fetch lại trạng thái chuyến hiện tại và tiếp tục từ đó, trong khi app của tài xế — vẫn còn sóng — tiếp tục đẩy chuyến tiến lên. Đồng hồ cước và tiến độ chuyến được điều khiển bởi luồng vị trí của tài xế và đồng hồ server, không phải kết nối của hành khách, nên việc hành khách rớt mạng không làm dừng hay hỏng chuyến.
:::

:::muted
**Trade-off** — Làm server có thẩm quyền và mọi chuyển trạng thái idempotent thì tốn thêm lưu trữ và một round trip cho mỗi thay đổi trạng thái, nhưng đó là điều cho phép một trong hai phía kết nối lại an toàn; một thiết kế "tin trạng thái cục bộ của client" thì đơn giản hơn và nhanh hơn khi offline nhưng phân kỳ ngay khi một gói tin bị mất. Persist từng chuyển trạng thái đồng bộ cho độ bền và một dấu vết kiểm toán sạch, đổi lại độ trễ ghi trên đường nóng, trong khi đệm sự kiện thì nhanh hơn nhưng có nguy cơ mất một thay đổi trạng thái khi sập. Bạn cũng cân bằng mức độ mạnh tay khi tự-hoàn-tất hay tự-hủy lúc mất kết nối kéo dài — timeout vội vàng giải phóng tài nguyên nhưng có thể kết thúc nhầm một chuyến đang chạy; timeout khoan dung tránh được điều đó nhưng để lại các chuyến zombie chiếm một tài xế.
:::

:::muted
**Cạm bẫy & Failure-mode** — Nguy cơ cốt lõi là trạng thái split-brain: app của hành khách nói "completed," app của tài xế nói "in-progress," vì mỗi bên theo dõi trạng thái cục bộ thay vì đối chiếu với server. Các chuyển trạng thái không idempotent gây tính tiền đôi hoặc hoàn tất đôi khi mạng chập chờn khiến client thử lại `completeTrip`; request key phải khử trùng lặp các lần phát lại. Cho phép các bước nhảy bất hợp lệ (hoàn tất một chuyến chưa từng được accepted) làm hỏng tính cước, nên các chuyển trạng thái phải được kiểm tra so với trạng thái hiện tại bằng optimistic concurrency để loại các lượt ghi cũ. Cuối cùng, gắn tiến độ chuyến hay đồng hồ cước vào heartbeat của hành khách nghĩa là một lần rớt sóng sẽ làm đồng hồ ngừng nhầm hoặc hủy một chuyến đang chạy — tiến độ phải đi theo tài xế và server, với việc kết nối lại chỉ đơn giản đồng bộ lại góc nhìn của hành khách.
:::
<!-- @starci/seperator -->
