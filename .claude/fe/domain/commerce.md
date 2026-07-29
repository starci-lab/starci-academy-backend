# THƯƠNG MẠI (commerce)

> Miền này lo việc người học chọn khóa, trả tiền, và giữ quyền truy cập sau khi trả — từ giỏ hàng, cổng thanh toán, trả góp, cho tới gói membership.

## 1. THỰC THỂ

| Thực thể | Là gì | Trạng thái thật (enum) |
| --- | --- | --- |
| Cart item | Một dòng giỏ = một cặp (người dùng, khóa học). Không có "giỏ" như một thực thể riêng; giỏ chính là tập các dòng của người đó. | không có trạng thái |
| Transaction | Một lần trả tiền. Nó ôm cả tiền, cổng thanh toán, và mục đích trả (mua khóa, mua gói AI, mua membership, trả một kỳ trả góp). | `pending` · `succeeded` · `cancelled` · `failed` · `unpaid` |
| Transaction item | Một dòng khóa học bên trong đơn nhiều khóa. Đơn mua một khóa lẻ KHÔNG sinh dòng này. | không có trạng thái |
| Installment plan | Kế hoạch trả góp của một lần mua. Có hai kiểu: lịch cố định 3/6/12 kỳ, hoặc hũ nợ cũ trả linh hoạt. | trạng thái: `active` · `overdue` · `defaulted` · `completed` — kiểu: `fixed` · `flexible_pool` |
| Pricing phase | Bậc giá của một khóa. Mỗi khóa có đúng ba bậc, mỗi bậc có giá VND, giá USD, và số suất còn lại. | `pioneer` · `earlyBird` · `regular` |
| Course voucher | Mã giảm giá đúc ra từ cửa hàng Coin, dùng được một lần, có hạn dùng. | `unused` · `reserved` · `used` · `expired` — kiểu giảm: `percent` · `flat` |
| Membership | Gói cộng đồng theo tháng của một người. Nó mở blog premium, cộng đồng riêng, và mức giảm giá khóa học. | `active` · `cancelled` · `expired` |
| Advertisement | Banner quảng cáo đặt vào một ô cố định trên giao diện. | vị trí: `dashboard_right` · `lesson_interstitial` · `course_detail` · `lesson_inline` · `practice_rail` · `leaderboard_rail` — media: `image` · `video` · `carousel` |

Bổ sung cho người dựng UI: cổng thanh toán là enum riêng `payos` · `sepay` · `stripe` · `paypal` · `crypto`; lý do được giảm giá là enum `none` · `enrolledCount` · `diligent` · `both`.

## 2. MÀN HÌNH PHỤC VỤ

| Màn | Phục vụ việc gì | Thực thể chính |
| --- | --- | --- |
| `/[locale]/cart` | Trang giỏ đầy đủ: soi lại danh sách khóa, xem tổng tiền thật, gợi ý trả góp, bấm thanh toán hoặc dọn giỏ. | Cart item, Pricing phase |
| `/[locale]/checkout/sepay` | Trang QR SePay: quét mã, chép số tài khoản và nội dung chuyển khoản, chờ hệ thống xác nhận. | Transaction |
| `/[locale]/profile/settings/installments` | Danh sách kế hoạch trả góp chưa tất toán, và nút trả kỳ hiện tại. | Installment plan |
| `/[locale]/profile/settings/membership` | Trang bán gói cộng đồng: quyền lợi, giá, nút đăng ký. | Membership |
| `/[locale]/profile/settings/ai-subscription` | Trang bán gói AI (`plus` · `pro` · `max`), mở cùng một modal thanh toán. | Transaction |
| `/[locale]/courses/[courseId]` | Cột giá của trang khóa học: bậc giá đang chạy, thang giá, số suất còn lại, nút thêm giỏ và nút mua. | Pricing phase |
| `/[locale]/rewards` | Tab "Ví của tôi": danh sách voucher đã đúc kèm trạng thái và hạn dùng. | Course voucher |

Hai bề mặt phủ không phải route nhưng chiếm phần lớn nghiệp vụ: **modal thanh toán** (`components/modals/PaymentModal`) dùng chung cho cả bốn luồng mua, và **ngăn kéo giỏ nhanh** (`components/drawers/MiniCartDrawer`) mới là lối vào chính của giỏ. Ngoài ra có **modal quảng cáo chen ngang** (`components/modals/AdModal`) bật lên khi người chưa mua mở một bài học.

## 3. STATE PHẢI VẼ

| Vùng/màn | State | Điều kiện nghiệp vụ | Hình đổi gì |
| --- | --- | --- | --- |
| Giỏ (trang + ngăn kéo) | đang tải | lần đầu chưa có cache | khung xương ba dòng khóa + một thanh nút; ngăn kéo còn thêm khung xương thanh combo |
| Giỏ | rỗng | không có dòng nào | bỏ hẳn danh sách và cả chân trang tổng tiền; hiện icon giỏ, câu gợi ý, nút "Xem khóa học" |
| Giỏ | lỗi | query giỏ hỏng và không có cache | thay danh sách bằng khối lỗi có nút thử lại |
| Giỏ | đang ghi | đang thêm/xóa/dọn | khóa nút thùng rác từng dòng, khóa nút thanh toán và nút dọn giỏ |
| Giỏ · tổng tiền | đang tải riêng | giỏ đã có dòng nhưng preview giá chưa về | chỉ chân trang chuyển khung xương, danh sách khóa vẫn hiện bình thường |
| Giỏ · tổng tiền | preview lỗi | preview giá hỏng | vẫn hiện tổng, nhưng là tổng cộng thô từ entity; giấu dòng tiết kiệm, chip combo, gợi ý trả góp |
| Giỏ · combo | chưa đạt bậc | dưới 3 khóa | thanh combo chưa đầy, câu nhắc "thêm khóa để lên bậc"; chưa có chip phần trăm |
| Giỏ · combo | đã đạt trần | từ 3 khóa | thanh đầy, chip phần trăm hiện, câu nhắc đổi sang câu đã kịch trần |
| Giỏ · trả góp | có mời trả góp | preview trả về ít nhất một kỳ hạn | thêm một dòng chữ nhỏ "chỉ từ X/tháng" dưới tổng tiền |
| Nút thêm giỏ | ẩn hoàn toàn | khóa miễn phí, hoặc đã sở hữu | không render gì cả, không phải nút mờ |
| Nút thêm giỏ | đã có trong giỏ | khóa đang nằm trong giỏ | đổi thành nút gỡ, icon X, màu `danger-soft`, bất kể caller truyền variant gì |
| Nút thêm giỏ | chưa đăng nhập | khách vãng lai bấm thêm | không gọi mutation; mở modal đăng nhập và ghi nhớ ý định, đăng nhập xong tự thêm rồi bật ngăn kéo |
| Modal thanh toán | đang tải giá | preview giá chưa về | khung xương đúng chỗ dòng giá; với đơn nhiều khóa thì khung xương từng dòng khóa cộng dòng tổng |
| Modal thanh toán | lỗi giá | preview giá hỏng | khối lỗi thay chỗ giá; danh sách cổng thanh toán vẫn còn |
| Modal thanh toán | có giảm giá trung thành | phần trăm giảm lớn hơn 0 | giá gốc bị gạch, thêm các dòng lý do theo `discountReason`: dòng "đã sở hữu N khóa" cho `enrolledCount`, dòng "chăm chỉ" cho `diligent`, cả hai dòng cho `both` |
| Modal thanh toán | không có giá USD | đơn không có giá USD, hoặc đang chọn trả góp | ẩn hẳn nút chuyển VND/USD, chỉ còn nhóm cổng nội địa |
| Modal thanh toán | chọn trả góp | người mua bật "Trả góp" | ép về VND, ẩn nút chuyển tiền tệ, hiện dòng kỳ hạn cố định và số tiền mỗi kỳ; cột tiền bên mỗi cổng đổi thành số tiền THÁNG chứ không phải tổng |
| Modal thanh toán | đang chạy mutation | vừa bấm một cổng | dòng cổng đó đổi mũi tên thành spinner, mọi dòng cổng còn lại bị khóa |
| Modal thanh toán | đã sở hữu khóa | backend trả mã `COURSE_ALREADY_ENROLLED_ERROR` | không hiện lỗi đỏ; hiện toast cảnh báo kèm nút nhảy vào khóa, và KHÔNG chuyển sang cổng |
| Trang SePay | chờ trả | chưa có ghi nhận đã trả | hai cột: QR bên trái với spinner "đang chờ" và nút kiểm tra tay, tóm tắt đơn bên phải với các dòng chép nhanh |
| Trang SePay | thiếu QR | tham số `qr` rỗng | ô vuông 300×300 chứa spinner thay cho ảnh QR |
| Trang SePay | đã trả xong | trạng thái ghi danh trở thành đã mua | thay TOÀN BỘ trang bằng màn thành công, rồi sau hai giây tự nhảy vào trang khóa |
| Giao dịch | `pending` | vừa tạo, cổng chưa xác nhận | mọi màn chờ phải chịu được trạng thái này lâu, không được coi là thất bại |
| Giao dịch | `succeeded` | cổng xác nhận đã trả | mở quyền, dọn dòng giỏ tương ứng |
| Giao dịch | `unpaid` | hết hạn mức dò lại mà vẫn chưa trả | coi như trả hụt; voucher đã giữ được nhả về `unused`, người mua nhận email báo hụt |
| Giao dịch | `cancelled` / `failed` | cổng báo hủy hoặc lỗi | như trên, đơn không mở quyền |
| Trả góp · danh sách | đang tải | lần đầu | hai khối xương cao 40 |
| Trả góp · danh sách | rỗng | không có kế hoạch chưa tất toán | khối rỗng kèm nút đi xem khóa học |
| Trả góp · danh sách | lỗi | query hỏng | khối lỗi kèm nút tải lại |
| Trả góp · thẻ | kiểu `fixed` | lịch cố định | hiện số tiền mỗi kỳ và thanh tiến độ "đã trả N/M kỳ"; KHÔNG có ô nhập tiền |
| Trả góp · thẻ | kiểu `flexible_pool` | hũ nợ cũ | hiện dư nợ còn lại, công thức mức tối thiểu, và một ô nhập tiền tự kẹp không cho xuống dưới mức tối thiểu |
| Trả góp · thẻ | `active` | chưa tới hạn | chip xanh, nút chính "Trả kỳ này" |
| Trả góp · thẻ | `overdue` | quá hạn nhưng còn trong thời gian ân hạn | chip vàng, quyền học VẪN mở, nút vẫn là nút trả bình thường |
| Trả góp · thẻ | `defaulted` | quá hạn hết ân hạn, khóa đã bị khóa | chip đỏ, thêm khối cảnh báo đỏ, nút đổi thành nút `danger` với chữ "Mở khóa" |
| Trả góp · thẻ | `completed` | đã trả hết | không xuất hiện trong danh sách vì backend đã lọc bỏ |
| Trả góp · nút trả | đang chạy | vừa bấm trả một kế hoạch | riêng nút của kế hoạch đó đổi thành spinner, ô nhập tiền của kế hoạch đó bị khóa |
| Membership | luôn là màn bán | trang hiện chỉ dựng một thẻ giới thiệu và nút đăng ký | KHÔNG có nhánh nào cho `active` / `cancelled` / `expired` — xem mục "khác biệt" ở §4 |
| Bậc giá | còn suất | bậc đang chạy có `slotAvailable` khác null | thêm một dòng chữ vàng "còn N suất giá <bậc>", kèm câu giá sẽ tăng lên bao nhiêu |
| Bậc giá | không giới hạn suất | `slotAvailable` là null | KHÔNG render dòng khan hiếm nào cả |
| Bậc giá | đang tải giá cá nhân | người đã đăng nhập, preview giảm giá chưa về | khung xương ngay dòng giá; cấm hiện giá bậc rồi mới nhảy sang giá đã giảm |
| Voucher | `unused` | chưa dùng, chưa hết hạn | thẻ voucher bình thường, chip trung tính |
| Voucher | `reserved` | đang bị một đơn chưa xong giữ | vẫn hiện nhưng phải cho biết là đang bị giữ, không rủ người dùng đi dùng lại |
| Voucher | `used` / `expired` | đã tiêu hoặc quá hạn | chip mờ, mã coi như chết |
| Quảng cáo | có banner trả tiền | có banner đang bật cho ô đó | render theo `mediaType`: một ảnh, một video, hoặc băng chuyền nhiều ảnh |
| Quảng cáo | không có banner trả tiền | chỉ còn banner nhà | render banner "đặt quảng cáo tại đây" |
| Quảng cáo | người đã mua khóa | đã ghi danh hoặc là member | backend trả null, phía giao diện không được chừa chỗ trống |

## 4. LUẬT NGHIỆP VỤ ĐÁNG NHỚ

- Số dòng trong giỏ KHÔNG bằng số khóa bị tính tiền. Khi định giá, backend bỏ hẳn những khóa người mua đã sở hữu, nên tổng tiền có thể ứng với ít khóa hơn danh sách đang hiện. Chân giỏ phải chịu được cảnh "3 dòng nhưng chỉ tính 2". `src/features/api/core/graphql/mutations/courses/courses-checkout/courses-checkout-pricing.service.ts:98-125`
- Giá hiển thị và giá bị tính là MỘT. Truy vấn preview gọi đúng service mà checkout gọi, nên đừng bao giờ tự nhân chia lại ở phía giao diện; mọi con số từ preview đã sẵn sàng để in ra. `src/features/api/core/graphql/queries/courses/courses-checkout-preview/courses-checkout-preview.service.ts:21-25`
- Preview giá đòi đăng nhập. Khách chưa đăng nhập không lấy được giá cá nhân hóa, nên mọi lối vào giỏ phải rẽ qua modal đăng nhập trước, và nhớ lại ý định để phát lại sau khi đăng nhập xong. `src/features/api/core/graphql/queries/courses/courses-checkout-preview/courses-checkout-preview.service.ts:47-51` và `starci-academy/src/components/features/cart/hooks/useCartEntry.ts:52-62`
- Giảm giá cộng dồn hai tầng và có trần: mỗi khóa đã sở hữu cộng 5%, chăm chỉ cộng 5%, trần riêng 30%; bonus mua gộp cộng thêm 5% cho 2 khóa và 10% từ 3 khóa, trần chung 40%. Đừng dựng thanh tiến độ ngụ ý còn tăng mãi. `src/modules/bussiness/loyalty/loyalty-discount.service.ts:27-45`
- Đơn nhiều khóa tạo MỘT giao dịch với `course` để trống cộng N dòng `transaction_items`; đơn một khóa thì gắn thẳng khóa vào giao dịch và KHÔNG có dòng con. Màn nào đọc lịch sử mua phải xử được cả hai hình. `src/modules/databases/postgresql/primary/entities/transaction-item.entity.ts:32-38`
- Trả tiền luôn rời khỏi trang. Mutation chỉ trả về `checkoutUrl` (và `checkoutFields` cho cổng phải POST form như SePay); phía giao diện gọi `submitCheckout` để đẩy người dùng sang cổng. Không có luồng nào trả tiền tại chỗ. `starci-academy/src/components/modals/PaymentModal/index.tsx:397-399`
- Không có xác nhận đồng bộ. Trang SePay dò lại trạng thái ghi danh mỗi 5 giây và chỉ đổi màn khi ghi danh về, rồi đợi thêm 2 giây mới chuyển trang. Màn phải sống được ở trạng thái "đang chờ" vô thời hạn. `starci-academy/src/components/features/checkout/SepayCheckout/index.tsx:33-36,60-74`
- `pending` không phải là hỏng. Một tiến trình nền dò lại nhiều lượt rồi mới hạ xuống `unpaid`; riêng crypto thì KHÔNG BAO GIỜ bị hạ, cứ để treo `pending` chờ cổng báo muộn. Đừng vẽ màn "thất bại" chỉ vì chờ lâu. `src/features/api/processors/reconcile-transaction/reconcile-transaction.worker.ts:113-124,169`
- Voucher bị giữ chỗ ngay khi tạo đơn và chỉ thành `used` khi đơn thành công; đơn hụt sẽ nhả mã về `unused`. Nghĩa là một mã đang `reserved` không phải mã đã mất. `src/modules/databases/postgresql/primary/entities/course-voucher.entity.ts:36-40` và `src/features/api/processors/reconcile-transaction/reconcile-transaction.worker.ts:173`
- Trả góp tính trên tổng ĐƠN sau giảm, không tính từng khóa, và chỉ thu được bằng VND. Chọn trả góp thì phải ép về cổng nội địa và ẩn nút chuyển sang USD. `src/features/api/core/graphql/queries/courses/courses-checkout-preview/courses-checkout-preview.service.ts:79-82` và `starci-academy/src/components/modals/PaymentModal/index.tsx:225-237`
- Một kế hoạch trả góp khóa cả CỤM khóa cùng lúc. Danh sách khóa bị khóa được chụp lại lúc tạo kế hoạch; vỡ nợ thì khóa hết, trả bù thì mở hết. Đừng dựng giao diện trả góp theo từng khóa lẻ. `src/modules/databases/postgresql/primary/entities/installment-plan.entity.ts:119-136`
- Vòng đời trả góp do một cron ngày chạy: tới hạn thì `active` sang `overdue` và VẪN cho học, quá 14 ngày mới sang `defaulted` và khóa. Nghĩa là "quá hạn" và "bị khóa" là hai màn khác nhau, không được gộp. `src/modules/bussiness/installment-plan/installment-plan-enforcement.cron.ts:49-51,127-140`
- Mức trả tối thiểu mỗi kỳ khác nhau theo kiểu kế hoạch: `fixed` là con số cố định đã chốt lúc mua, `flexible_pool` là phần trăm của dư nợ HIỆN TẠI nhưng không bao giờ thấp hơn mức sàn. Ô nhập tiền phải tự kẹp lên, không được để người dùng nhập thấp hơn rồi mới báo lỗi. `src/modules/bussiness/installment-plan/installment-plan.service.ts:97-116`
- Membership KHÔNG mở nội dung khóa học, chỉ mở blog premium, cộng đồng, và mức giảm. Đừng dựng giao diện gợi ý mua membership để học một khóa. `src/modules/databases/postgresql/primary/entities/membership.entity.ts:30-32`
- Bậc giá chỉ có `slotAvailable` là số thật thì mới được vẽ khan hiếm; null nghĩa là không giới hạn và phải im lặng. Con số suất và giá bậc kế tiếp đều lấy từ backend, cấm bịa đồng hồ đếm ngược. `src/modules/databases/postgresql/primary/entities/pricing-phase.entity.ts:115-125`
- Ở môi trường không phải production, giá hiển thị bị chia cho một số chia thử nghiệm. Đừng ngạc nhiên khi số trên màn nhỏ hơn dữ liệu, và đừng tự tính lại giá bằng tay ở nơi khác. `starci-academy/src/components/features/cart/hooks/useCourseDisplayPrice.ts:26-29`
- Thêm giỏ là thao tác không sinh trùng: backend trả lại dòng cũ nếu đã có, và ném lỗi riêng nếu đã ghi danh. Nút thêm giỏ vì thế được phép bấm nhiều lần mà không cần chặn phía giao diện. `src/features/api/core/graphql/mutations/courses/add-to-cart/add-to-cart.handler.ts:30-34`

### Chỗ backend và giao diện đang nói khác nhau

- Tên trạng thái trả góp trên đường truyền là chữ thường (`active`, `overdue`, `defaulted`, `completed`, `fixed`, `flexible_pool`) vì lớp đăng ký enum GraphQL lấy chính giá trị làm tên. Nhưng màn trả góp lại so sánh với chữ hoa đầu (`"Fixed"`, `"Defaulted"`). Ghi cả hai ở đây; khi dựng lại màn phải kiểm tra bằng dữ liệu thật chứ đừng chép nhánh cũ. `src/modules/common/utils/enum.ts:1-12` và `starci-academy/src/components/features/profile/InstallmentPlans/index.tsx:42-47,168-170`
- Giao dịch có ô mã voucher và cả một vòng đời giữ chỗ, nhưng modal thanh toán hiện KHÔNG có ô nhập mã; voucher chỉ được xem trong ví ở trang phần thưởng. Nếu dựng lại modal thanh toán thì đây là mảng còn thiếu, không phải mảng đã bỏ. `src/modules/databases/postgresql/primary/entities/transaction.entity.ts:203` và `starci-academy/src/components/modals/PaymentModal/index.tsx:294-400`
- Membership có ba trạng thái trong dữ liệu nhưng trang membership chỉ dựng đúng một hình bán hàng, không đọc trạng thái. Người đang có gói vẫn thấy nút "đăng ký" như người chưa có. `src/modules/databases/postgresql/primary/entities/membership.entity.ts:38-52` và `starci-academy/src/components/features/profile/Membership/index.tsx:66-116`
