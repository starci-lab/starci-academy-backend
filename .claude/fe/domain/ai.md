# AI — model, hạn mức, trợ giảng

> Miền này lo phần "máy giúp người học": chọn model nào chạy, còn bao nhiêu credit để chạy, và cái hộp chat trợ giảng bám theo bài đang đọc.

## 1. THỰC THỂ

| Thực thể | Là gì | Trạng thái thật (enum) |
| --- | --- | --- |
| AiModel | Một model trong catalog quay vòng. FE dùng nó để dựng danh sách chọn model: mỗi model có hạng giá, cờ bật/tắt, cờ dùng-miễn-phí, và danh sách task nó hợp. | `category`: free · economy · balanced · premium · frontier — `provider`: gemini · openai · local · openrouter · anthropic — `supportedTasks`: chatting · grading · embedding · cv_generating · task_grading · challenge_grading |
| AiSubscription | Quyền dùng AI của một người, một-đối-một với user. Giữ gói đang có, hai cửa sổ hạn mức (5 giờ và tuần), và trần model người dùng tự đặt. | `tier`: plus · pro · max (null = chưa mua) — `status`: active · cancelled · expired |
| CreditUsageHistory | Một dòng sổ: lần này tiêu bao nhiêu credit, ở bề mặt nào, model nào phục vụ. Là nguồn cho màn "Lịch sử dùng AI". | `surface`: chatbot · grading · interview — `task`: cùng bộ với `supportedTasks` (có thể null) |
| ContentAiSession | Một cuộc trò chuyện có tên với trợ giảng, neo vào đúng một chỗ học. Một bề mặt giữ được NHIỀU cuộc. | `scope`: content · task · challenge · quiz · foundation · course — lưu trữ hay không thì đọc `archivedAt` (null = đang hoạt động) |
| ContentAiMessage | Một lượt nói trong cuộc trò chuyện đó. | `role` là chuỗi `"user"` / `"assistant"`, không phải enum |
| AiLabEvalSet / AiLabEvalCase | Đề "thử tài viết prompt" gắn sau một challenge hoặc một task capstone: rubric chấm, ngưỡng đậu, và các ca kiểm. | case có `metricKind`: exact · embedding · contains · judge; eval set không có trạng thái |
| AiLabEvalRun | Một lần nộp prompt để chấm. Chấm chạy nền qua job. | `status`: pending · grading · completed · failed |
| AiLabRun | Một lần bấm chạy trong sân tập prompt. Chạy trùng y hệt thì lấy lại kết quả cũ. | `status`: streaming · completed · failed · cached |
| ChatConversation / ChatMessage | Chat cộng đồng, KHÔNG phải AI: một phòng chung và một hộp thư riêng với founder. Tin nhắn xoá mềm. | `type`: community · founderDm — message không có enum, chỉ cờ `isDeleted` |

## 2. MÀN HÌNH PHỤC VỤ

| Màn | Phục vụ việc gì | Thực thể chính |
| --- | --- | --- |
| `/[locale]/profile/settings/ai-settings` | Đặt TRẦN model cho Auto: một trần chung, cộng ba trần riêng cho chatbot / chấm bài / phỏng vấn. | AiSubscription (`ceilOverrides`) |
| `/[locale]/profile/settings/ai-subscription` | Xem gói hiện tại và mua gói trả phí. | AiSubscription |
| `/[locale]/profile/settings/ai-usage` | Xem đã tiêu bao nhiêu credit: biểu đồ theo ngày, chia theo nhà cung cấp, và danh sách từng lần tiêu. | CreditUsageHistory + AiSubscription |
| `/[locale]/courses/[courseId]/learn/**` | Nút nổi mở trợ giảng có mặt trên MỌI màn trong khu học (đặt ở `learn/layout.tsx`); khay chat thì gắn ở layout gốc `src/app/InnerLayout.tsx` nên nó sống xuyên route. | ContentAiSession + ContentAiMessage |
| `.../learn/content/modules/[moduleId]/contents/[contentId]` | Màn đọc bài. Khi bài có sân AI Lab thì mọc thêm một tab: sân tập prompt và bảng nộp bài chấm prompt. | AiLabRun + AiLabEvalRun |
| `.../contents/[contentId]/challenges/[challengeId]` | Nộp challenge, có ô chọn model chấm. | AiModel + AiSubscription |
| `/[locale]/community/chat` | Chat cộng đồng và DM founder. | ChatConversation + ChatMessage |

Ô chọn model (`GradeModelDropdown`) còn xuất hiện trong phỏng vấn thử, dự án cá nhân, sửa CV và chính khay trợ giảng — cùng một khối, khác `task` truyền vào.

## 3. STATE PHẢI VẼ

| Vùng/màn | State | Điều kiện nghiệp vụ | Hình đổi gì |
| --- | --- | --- | --- |
| Ô chọn model | model bị tắt | `enabled = false` | biến mất khỏi danh sách, không hiện xám |
| Ô chọn model | model không hợp task | `supportedTasks` không chứa task đang cần | ẩn mặc định; bật "hiện thêm" mới thấy, và thấy dưới dạng cảnh báo hổ phách |
| Ô chọn model | model bị khoá | hạng balanced/premium/frontier mà chưa mở khoá | dòng model kèm icon ổ khoá, bấm vào KHÔNG chọn mà nhảy sang trang gói |
| Ô chọn model | model dưới sàn khuyến nghị | hạng thấp hơn `floor` của task đó | vẫn chọn được, nhưng gắn cảnh báo "có thể chấm sai" |
| Ô chọn model | làn Auto | chưa ghim model nào | nhãn trigger là "Auto", không hiện tên model |
| Hạn mức (thẻ/modal) | đang tải | leaf query chưa về | skeleton: một dòng tiêu đề, một dòng phụ, hai cặp nhãn + thanh bar, một nút |
| Hạn mức (thẻ/modal) | rỗng / lỗi | chưa đăng nhập, hoặc query hỏng | widget TỰ ẨN hoàn toàn, không hiện khối lỗi |
| Hạn mức | có gói trả phí | `tier` khác null | thêm chip tên gói viết hoa, màu theo gói (plus xám, pro xanh, max cam) |
| Hạn mức | hết lượt cửa sổ 5 giờ | `remaining5h <= 0` | mọi lời gọi AI trả lỗi `AI_QUOTA_EXHAUSTED_EXCEPTION`; UI phải nói rõ cửa sổ nào hết và giờ nào reset |
| Hạn mức | hết lượt cửa sổ tuần | `remainingWeek <= 0` | như trên nhưng mốc reset là mốc tuần; nói riêng, đừng gộp một câu chung |
| Trợ giảng | chưa có cuộc nào | bề mặt này chưa từng hỏi | thread trống + hàng chip gợi ý mở màn, thứ tự chip khác nhau theo scope (scope khoá học dẫn bằng chip "tìm bài") |
| Trợ giảng | không có khoá học | không giải được course cho cuộc trò chuyện | nút nổi trả `null`, không render gì |
| Trợ giảng | khay đang mở | rail mở | nút nổi ẩn đi, nút đóng nằm trong rail |
| Trợ giảng | đang thi | màn đánh giá đang chạy | nút nổi bị gỡ khỏi layout học |
| Trợ giảng | đang tra cứu | lượt trả lời đang chạy công cụ tìm | bong bóng assistant rỗng kèm khối kết quả đang tải, chưa có chữ |
| Trợ giảng | hết hạn mức giữa chừng | lượt trả lời lỗi và thông điệp bắt đầu bằng "AI quota exhausted" | bong bóng đổi thành khối lỗi CÓ nút nâng cấp, không phải khối lỗi thường |
| Trợ giảng | cuộc đã lưu trữ | `archivedAt` khác null | mặc định không nằm trong danh sách lịch sử; phải bật công tắc "Đã lưu trữ" mới hiện |
| Trợ giảng | hỏi từ đoạn bôi đen | người dùng bôi chữ rồi hỏi | mở một cuộc phụ SINH RA ĐÃ lưu trữ; không được nối vào cuộc đang mở, cũng không hiện trong danh sách |
| Sân tập prompt | đang chạy | `status = streaming` | ô kết quả đổ chữ dần + spinner; hai ô nhập và nút bị khoá |
| Sân tập prompt | lấy lại kết quả cũ | `status = cached` | hiện kết quả ngay, kèm dấu "đã có sẵn", không đổ chữ và không tính credit |
| Sân tập prompt | chạy hỏng | `status = failed` | khối lỗi màu danger kèm `errorMessage`; chip lịch sử lần chạy đó cũng đổi sang danger |
| Sân tập prompt | hết hạn mức | phản hồi trả cờ `quotaExhausted` | không tạo run mới, đẩy về lối nâng cấp |
| Nộp prompt chấm | vừa nộp | `status = pending` | nút chuyển sang trạng thái chờ, chưa có bảng kết quả |
| Nộp prompt chấm | đang chấm | job đang queued/processing | mọi ô nhập bị khoá, nhãn nút đổi thành "đang chấm", hiện khối chờ; MÀN PHẢI ĐỨNG ĐƯỢC LÂU |
| Nộp prompt chấm | chấm xong | `status = completed` | hiện điểm tổng, số ca đậu trên tổng ca, và chip đậu/rớt màu success hoặc danger |
| Nộp prompt chấm | chấm hỏng | `status = failed` | khối lỗi, giữ nguyên prompt đã nộp để nộp lại |
| Lịch sử dùng AI | lần đầu, chưa có dữ liệu | không có dòng nào | khối rỗng thay cho cả ba khối (biểu đồ ngày, chia nhà cung cấp, danh sách) |
| Lịch sử dùng AI | đang tải trang đầu | chưa có dòng nào và đang fetch | skeleton: một khối biểu đồ cao, một thanh phân đoạn có 3 chú thích, và mấy hàng dòng |
| Lịch sử dùng AI | tải thêm | đang lấy trang kế | giữ nguyên danh sách cũ, chỉ thêm chỉ báo ở đuôi |
| Lịch sử dùng AI | không quy được model | `model` / `provider` null | dòng ghi là làn Auto miễn phí, không để trống |
| Trang trần model | chưa mua gói | trần trần-tối-đa của gói chỉ tới economy | các nấc cao hơn bị vô hiệu, và hiện lời mời nâng cấp thay cho bảng chỉnh |
| Trang trần model | trần riêng theo bề mặt | key `chatbot`/`grading`/`interview` vắng mặt | nấc đó hiện là "theo mặc định", không hiện một hạng cụ thể |
| Gói AI | gói đã huỷ hoặc hết hạn | `status = cancelled` hoặc `expired` | đối xử như chưa mua: model cao khoá lại, hạn mức về mức nền miễn phí |
| Gói AI | không tự gia hạn | `autoRenew = false` và `currentPeriodEnd` còn hạn | thẻ gói nói rõ ngày dừng, không hiện như gói vĩnh viễn |
| Gói AI | đang dùng gói này | tier trong lưới trùng tier hiện tại | ô gói đó thành "đang dùng", tắt nút mua |
| Chat cộng đồng | tin đã xoá | `isDeleted = true` | giữ chỗ dòng tin, thay nội dung bằng nhãn đã xoá, KHÔNG rút dòng khỏi luồng |
| Chat cộng đồng | phòng chung so với DM founder | `type = community` (không có member) so với `founderDm` | cùng một khối luồng tin, chỉ đổi tiêu đề và người nhận; đừng dựng hai khối khác nhau |

## 4. LUẬT NGHIỆP VỤ ĐÁNG NHỚ

- Mở khoá model cao KHÔNG chỉ do trả tiền: đã trả tiền HOẶC đang học một khoá bất kỳ đều được. Người ghi danh mà không mua vẫn chọn được model cao, chỉ là tiêu vào túi credit nền miễn phí. Đừng dựng UI kiểu "muốn model xịn thì phải mua". `src/modules/ai/ai-entitlement.service.ts:410`
- Chỉ có MỘT túi credit, nhìn qua HAI cửa sổ (5 giờ và tuần). Cạn cửa sổ nào cũng chặn, nên phải vẽ được hai thanh riêng chứ không phải một. `src/modules/ai/ai-entitlement.service.ts:277`
- Credit thưởng đổi từ shop Coin chỉ nới ĐỘ LỚN của cửa sổ hiện tại, không mở hạng model, và bị xoá về 0 khi cửa sổ lăn. UI đừng hứa "mua credit là dùng được model xịn". `src/modules/databases/postgresql/primary/entities/ai-subscription.entity.ts:184`
- Trợ giảng nội dung chạy trên tầng local miễn phí và KHÔNG ghi sổ credit. Đừng cộng lượt chat vào biểu đồ "Lịch sử dùng AI". `src/modules/databases/postgresql/primary/entities/content-ai-message.entity.ts:34`
- Một bề mặt giữ nhiều cuộc trò chuyện, mỗi scope một luồng riêng, KHÔNG mang thread từ bài này sang bài khác. Đổi bề mặt thì mở lại cuộc gần nhất của chính bề mặt đó. `src/components/features/learn/ContentAiChat/index.tsx:493` (FE)
- Cuộc sinh từ đoạn bôi đen ra đời đã ở trạng thái lưu trữ: không hiện trong danh sách nhưng vẫn tìm được. `src/modules/databases/postgresql/primary/entities/content-ai-session.entity.ts:285`
- Chấm prompt chạy nền qua job, trạng thái đi pending → grading → completed/failed. Màn phải chịu được quãng "đang chấm" kéo dài và tự cập nhật, không được coi lần nộp là xong ngay. `src/features/api/core/graphql/mutations/ai-lab/submit-eval-challenge/submit-eval-challenge.service.ts:153`
- Chạy lại y hệt trong sân tập trả về `cached` chứ không gọi model. Đừng vẽ hiệu ứng đổ chữ cho ca này. `src/modules/databases/postgresql/primary/entities/ai-lab-run.entity.ts:36`
- `supportedTasks` là thứ quyết định model nào được thấy trong ô chọn: model chỉ hợp chấm bài thì không được lộ ra ở ô chọn chat. `src/modules/databases/postgresql/primary/entities/ai-model.entity.ts:268`
- Trần người dùng đặt là chặn CỨNG: chuỗi Auto leo tới trần rồi dừng, không bao giờ vượt. Nếu người dùng hạ trần xuống thấp, đừng vẫn quảng cáo model cao ở màn đó. `src/modules/databases/postgresql/primary/entities/ai-subscription.entity.ts:211`
- Sổ credit không gắn với bài nộp nào cả, chỉ nối được bằng người + thời điểm + bề mặt. Đừng thiết kế màn lịch sử kiểu bấm vào dòng là nhảy sang bài. `src/modules/databases/postgresql/primary/entities/credit-usage-history.entity.ts:37`
