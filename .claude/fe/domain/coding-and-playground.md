# LUYỆN CODE VÀ PLAYGROUND

> Miền này cho người học hai thứ: một khu luyện thuật toán kiểu LeetCode (đọc đề, viết code, nộp, được chấm rồi xếp hạng), và một khu thực hành trên chính máy của họ (Docker, Kubernetes, RAG) nơi trình duyệt chỉ ra đề và soi kết quả, còn lệnh thì người học tự gõ ở terminal nhà mình.

## 1. THỰC THỂ

| Thực thể | Là gì | Trạng thái thật (enum) |
| --- | --- | --- |
| CodingProblem | Một bài luyện code: đề bài markdown, tag, giới hạn thời gian/bộ nhớ, số điểm. | `difficulty`: easy · medium · hard — `domain`: arrays · strings · hashing · twoPointers · slidingWindow · stack · queue · linkedList · trees · heap · graph · binarySearch · sorting · recursion · backtracking · dynamicProgramming · greedy · math · bitManipulation · matrix |
| CodingProblemTestcase | Một cặp input/output của bài. Cặp `isSample` được cho người học xem, cặp ẩn chỉ dùng để chấm. | không có trạng thái |
| CodingProblemStarterCode | Đoạn code mồi đổ sẵn vào editor, mỗi ngôn ngữ một bản. | `language`: python · javascript · typescript · java · cpp |
| CodingProblemSolution | Lời giải mẫu đầy đủ, mỗi ngôn ngữ một bản. Chỉ đến tay client qua mutation mở khoá. | `language`: (cùng bộ trên) |
| CodingSubmission | Một lần người học bấm nộp: mã nguồn cộng kết quả chấm, số ca đúng, thời gian, bộ nhớ. Giữ toàn bộ lịch sử. | `verdict`: pending · judging · accepted · wrongAnswer · timeLimitExceeded · memoryLimitExceeded · runtimeError · compileError · internalError |
| CodingSolutionReveal | Dấu vết rằng người học đã bấm xem lời giải bài đó. Một dòng cho mỗi cặp người-bài. | không có trạng thái |
| UserCodingProjection | Bản tổng hợp thành tích code của một người (số bài đã giải, chia theo ngôn ngữ/độ khó/chủ đề). | không có trạng thái |
| Playground | Một bài lab thực hành thuộc một khoá, có icon, mô tả và danh sách bước. | `kind` (varchar, không phải enum Postgres): `terminal` · `rag` |
| PlaygroundStep | Một bước của lab: tiêu đề, hướng dẫn markdown, gợi ý lệnh (`commandHint`) hoặc gợi ý thao tác (`actionHint`). Điều kiện xác minh nằm ở server, không bao giờ lộ ra GraphQL. | không có trạng thái |
| PlaygroundSession | Một lượt chạy lab của một người: mã ghép nối, cờ đã ghép hay chưa, bước đang làm, các bước đã qua. | `mode`: guided · free — thêm cờ boolean `connected` |
| AiLabPlayground | Sân thử prompt gắn vào một bài học: prompt mặc định, tham số, nhà cung cấp được phép, hạn mức chạy. | `kind`: prompt · rag · comparison |
| RagPlaygroundSession | Một lượt RAG công khai không cần đăng nhập: code người dùng nạp vào được đánh chỉ mục tạm. | `sourceKind`: paste · upload · sample · github |

Trạng thái một lượt chạy AI Lab (`AiLabRunStatus`) có bốn giá trị: streaming · completed · failed · cached.

## 2. MÀN HÌNH PHỤC VỤ

| Màn (route thật) | Phục vụ việc gì | Thực thể chính |
| --- | --- | --- |
| `/[locale]/practice` | Danh mục bài luyện code: rail chủ đề bên trái, cockpit thành tích, bộ lọc, danh sách bài, và bảng xếp hạng toàn hệ thống. | CodingProblem, UserCodingProjection |
| `/[locale]/practice/[slug]` | Màn làm bài hai cột kiểu IDE: cột trái đọc đề / lời giải / lịch sử nộp, cột phải editor Monaco cộng console kết quả. | CodingProblem, CodingSubmission, CodingProblemSolution |
| `/[locale]/courses/[courseId]/learn/playground` | Danh sách lab thực hành của khoá, mỗi lab một thẻ kèm số bước. | Playground |
| `/[locale]/courses/[courseId]/learn/playground/[slug]` | Màn chuẩn bị: hướng dẫn cài engine theo hệ điều hành, lệnh ghép nối agent, bảng kiểm tra sẵn sàng, nút vào lab. | PlaygroundSession, Playground |
| `/[locale]/courses/[courseId]/learn/playground/[slug]/session` | Màn làm lab: cột trái từng bước, cột phải là ảnh chụp tài nguyên trên máy người học (lab `terminal`) hoặc khung RAG nạp-hỏi-trích (lab `rag`). | PlaygroundStep, PlaygroundSession |
| `/[locale]/architecture` | Bản đồ hệ thống công khai, có khung gõ thử curl. Không thuộc dữ liệu miền này, đứng chung vì cùng tính chất "sân chơi". | không có |
| `.../learn/content/modules/[moduleId]/contents/[contentId]` | AI Lab nằm nhúng trong màn đọc bài học, không có route riêng. | AiLabPlayground |

RagPlaygroundSession chưa có màn nào trong repo FE này.

## 3. STATE PHẢI VẼ

| Vùng/màn | State | Điều kiện nghiệp vụ | Hình đổi gì |
| --- | --- | --- | --- |
| Danh mục bài | đang tải | lần fetch đầu chưa có dữ liệu | thẻ danh sách năm dòng skeleton: chấm tròn trạng thái, hai dòng chữ, hai chip, một số điểm |
| Danh mục bài | lỗi | query hỏng, kể cả khi khách chưa đăng nhập vì mọi query coding đều đòi token | khối lỗi kèm nút "Thử lại" thay cho cả danh sách |
| Danh mục bài | rỗng thật | catalog trống | khối rỗng có tiêu đề và câu gợi ý, không có nút |
| Danh mục bài | rỗng do lọc | có bài nhưng bộ lọc loại hết | khối rỗng đổi câu, nút đổi thành "Xoá bộ lọc" |
| Danh mục bài | nhóm theo chủ đề bật/tắt | người dùng bấm nút gộp | bật: nhiều section, mỗi section có tiêu đề chủ đề và chip đếm; tắt: một thẻ danh sách phẳng |
| Dòng bài | chưa làm · đã thử · đã giải | đối chiếu id bài với `solvedProblemIds` / `attemptedProblemIds` | biểu tượng trạng thái đầu dòng đổi theo ba mức |
| Dòng bài | độ khó | easy · medium · hard | chip đổi tông: xanh · vàng · đỏ, chữ đổi thành junior · mid · senior ở màn chi tiết |
| Cockpit thành tích | ẩn hoàn toàn | khách chưa đăng nhập | không render gì, không để lại khoảng trống |
| Cockpit thành tích | đang tải | chưa có progress | bốn thẻ số skeleton cộng một thanh phân bố skeleton |
| Cockpit thành tích | lỗi | query progress hỏng | khối lỗi có nút thử lại, thay cả cockpit |
| Cockpit thành tích | chưa xếp hạng | `rank` hoặc `percentile` null | bỏ hẳn thẻ hạng và thẻ phần trăm, hàng còn hai thẻ |
| Cockpit thành tích | hạng đang về sau | truy vấn hạng còn bay trong khi số bài đã hiện | riêng hai thẻ hạng/phần trăm là skeleton, hai thẻ kia đã là số thật |
| Cockpit thành tích | chưa giải bài nào | mọi mức khó đều bằng không | ẩn luôn thanh phân bố, không vẽ thanh rỗng |
| Bảng xếp hạng | đang tải · rỗng · lỗi | ba nhánh async | sáu dòng skeleton có avatar · khối rỗng · khối lỗi có nút thử lại |
| Bảng xếp hạng | dòng của chính mình | id trùng người đang xem | nền dòng tô nhạt màu nhấn, thêm chip "Bạn" |
| Màn làm bài | đang tải | chưa có đề, hoặc đề trả về null | skeleton toàn màn, không có nhánh "không tìm thấy" riêng |
| Console kết quả | chưa nộp lần nào | không có submission | một dòng chữ mờ, không vẽ khung thống kê |
| Console kết quả | pending | vừa tạo submission, worker chưa nhận | chip trung tính, khối chữ "đang xử lý", nút Nộp chuyển sang trạng thái chờ |
| Console kết quả | judging | worker đang chạy testcase | vẫn chip trung tính, khối chữ tiến trình chạy, nút Nộp vẫn khoá |
| Console kết quả | accepted | mọi testcase đúng | chip xanh, ba ô số (ca đúng/tổng, thời gian ms, bộ nhớ KB), lưới từng ca đánh dấu đúng |
| Console kết quả | wrongAnswer | có ca sai output | chip đỏ, lưới từng ca chỉ rõ ca nào sai, ca mẫu hiện input/mong đợi/nhận được, ca ẩn chỉ hiện nhãn "ẩn" |
| Console kết quả | timeLimitExceeded | vượt `timeLimitMs` | chip đỏ, ô thời gian là số đo cao nhất, không có khối compile |
| Console kết quả | memoryLimitExceeded | vượt `memoryLimitKb` | chip đỏ, ô bộ nhớ là số đo cao nhất |
| Console kết quả | runtimeError | chương trình chết lúc chạy | chip đỏ, lưới từng ca, không có khối compile |
| Console kết quả | compileError | không biên dịch được | chip đỏ, thêm khối `pre` nền đỏ nhạt in nguyên thông báo trình biên dịch |
| Console kết quả | internalError | lỗi phía hệ thống chấm | chip vàng chứ không đỏ, để phân biệt với lỗi của người học |
| Console testcase | không có ca mẫu | bài không kèm `isSample` | một dòng chữ mờ thay cho danh sách thẻ input/output |
| Nút chạy thử | luôn khoá | backend chưa có endpoint chạy riêng trên ca mẫu | nút xám cố định, câu gợi ý dưới console giải thích khác biệt Chạy và Nộp |
| Nút nộp | khoá | editor rỗng sau khi trim | nút xám, không bấm được |
| Tab lời giải | chưa mở khoá | chưa gọi mutation mở khoá | chỉ có nút "Xem lời giải" và một dòng chữ báo đang khoá, không có code |
| Tab lời giải | đang xác nhận | bấm nút xem | hộp xác nhận trình duyệt cảnh báo mất điểm; huỷ thì không đổi gì |
| Tab lời giải | đã mở khoá | mutation trả về danh sách lời giải | hàng nút chọn ngôn ngữ cộng khối code, chỉ hiện những ngôn ngữ thật sự có lời giải |
| Tab lịch sử nộp | rỗng | chưa nộp lần nào | khối rỗng một dòng |
| Tab lịch sử nộp | có dữ liệu | tối đa hai mươi lần gần nhất | danh sách dòng: thời điểm, tên ngôn ngữ, chip verdict theo bảng tông ở trên |
| Gợi ý cách làm | không có | bài không có hint | ẩn cả tiêu đề lẫn nút, không để chỗ trống |
| Danh sách lab | đang tải · rỗng | khoá chưa gắn lab nào | đang tải thì không vẽ khối rỗng; rỗng thì khối rỗng có icon terminal |
| Màn chuẩn bị | đang tải · lỗi · không tìm thấy | ba nhánh của query lab | dòng chữ giữa màn · khối lỗi có nút tải lại · khối rỗng có nút quay về danh sách lab |
| Màn chuẩn bị | mã ghép nối đang đếm ngược | mã còn hạn và agent chưa nối | hiện lệnh `npx …` kèm số giây còn lại, tick mỗi giây |
| Màn chuẩn bị | mã ghép nối hết hạn | quá ba mươi phút kể từ lúc tạo phiên, agent vẫn chưa nối | lệnh chuyển sang trạng thái vô hiệu, hiện nút xin mã mới, đồng hồ dừng hẳn |
| Màn chuẩn bị | đang xin mã mới | mutation tạo phiên đang bay | nút xin mã ở trạng thái chờ, phải tự kèm spinner |
| Màn chuẩn bị | đã ghép nối | agent báo connected | đồng hồ đếm ngược biến mất hoàn toàn, không đổi thành "hết hạn" |
| Màn chuẩn bị | chưa đủ điều kiện | còn một dòng trong bảng kiểm chưa xanh | nút vào lab khoá; mỗi dòng chưa đạt hiện câu mô tả "cần gì" chứ không phải "chưa kiểm tra" |
| Màn chuẩn bị | bảng kiểm lab máy | lab `terminal` | ba dòng: agent · engine (Docker hoặc minikube+kubectl) · thông tin máy |
| Màn chuẩn bị | bảng kiểm lab RAG | lab `rag` | bốn dòng: agent · Ollama đang phục vụ · model nhúng · model sinh; mỗi dòng tự xanh/vàng riêng |
| Màn làm lab | vào thẳng khi chưa từng ghép | deep link hoặc F5 làm mất phiên | đá về màn chuẩn bị, không render màn lab |
| Màn làm lab | từng ghép rồi rớt | đã connected một lần rồi mất | ở lại màn lab, dải trạng thái đổi sang tông cảnh báo "mất kết nối" kèm nút quay về màn chuẩn bị |
| Màn làm lab | chưa ghép lần nào nhưng còn ở màn | trạng thái chờ ngay sau khi vào | dải trạng thái tông cảnh báo "đang chờ", ngăn kéo kết nối tự bung ra |
| Màn làm lab | đã ghép | connected | dải trạng thái xanh kèm độ trễ ms, ngăn kéo tự thu lại, thân ngăn kéo hiện cấu hình máy và nhật ký agent |
| Cột phải lab máy | chưa ghép | agent chưa nối | khối rỗng khoá workspace, không vẽ khung tài nguyên |
| Cột phải lab máy | ảnh chụp rỗng | đã ghép nhưng agent báo không có tài nguyên nào | khối rỗng khác, nằm trong khung workspace đã có tiêu đề đếm số |
| Cột phải lab máy | có tài nguyên | agent báo danh sách | accordion gộp theo loại, mỗi nhóm mở sẵn, mỗi dòng có chip trạng thái xanh nếu đang chạy/sẵn sàng |
| Bước lab | đang xác minh | vừa bấm xác minh, chưa có phản hồi | nút chuyển sang chờ và tự kèm spinner |
| Bước lab | xác minh trượt | quá hai giây rưỡi mà bước không tiến | tắt spinner, thêm một dòng chữ nhỏ nhắc chạy lệnh trước |
| Bước lab | xác minh đạt | server đẩy chỉ số bước đã qua | nhảy sang bước kế, xoá cả trạng thái chờ lẫn dòng nhắc |
| Bước lab | hết bước | chỉ số vượt quá danh sách | khối rỗng "đã xong lab" kèm nút quay về danh sách |
| Bước lab | mode guided | phiên tạo ở chế độ có dẫn | hiện khối lệnh mẫu dưới phần hướng dẫn |
| Bước lab | mode free | server đã xoá `commandHint` khỏi phản hồi | không có khối lệnh mẫu; phải chịu được `commandHint` null chứ không vẽ khung rỗng |
| Bước lab RAG | lab `rag` | `kind` là rag | không có nút xác minh và không có ngăn kéo kết nối; chỉ hai nút Trước/Sau, tự đi thủ công |
| AI Lab trong bài học | hết hạn mức | phản hồi trả `quotaExhausted` | thay khu chạy bằng lời nhắc hết lượt cộng gợi ý tự mang khoá API |
| AI Lab trong bài học | streaming · completed · failed · cached | trạng thái một lượt chạy | đang chảy chữ · chốt kết quả · khối lỗi · gắn nhãn lấy từ bộ nhớ đệm, không tính lượt mới |
| Bản đồ hệ thống | chưa có kết quả dò | vòng dò đầu chưa xong | mọi chấm ở trạng thái "đang kiểm tra" màu xám nhấp nháy, tuyệt đối không tô xanh sẵn |

## 4. LUẬT NGHIỆP VỤ ĐÁNG NHỚ

- Chấm bài chạy nền, không đồng bộ. Mutation nộp chỉ tạo một dòng ở trạng thái `pending` rồi trả về một job id để client bám socket; verdict thật về sau mới có. Màn bắt buộc chịu được quãng "đang chấm" và tự làm mới lịch sử khi job kết thúc. `src/modules/bussiness/coding/coding-submission.service.ts:92`, `:125`
- Điểm chỉ trao đúng một lần, cho lần giải sạch đầu tiên. Nếu đã có một submission `accepted` trước đó thì lần sau không cộng thêm gì, nên đừng vẽ hiệu ứng "được điểm" theo verdict. `src/features/api/processors/judge-coding-submission/steps/judge-coding-submission-judge-step.service.ts:340`
- Bấm xem lời giải là mất điểm vĩnh viễn của bài đó, kể cả sau này có giải đúng. Vì vậy nút xem lời giải phải hỏi lại trước khi gọi. `src/modules/databases/postgresql/primary/entities/coding-solution-reveal.entity.ts:18`, `judge-coding-submission-judge-step.service.ts:356`
- Lời giải mẫu không nằm trong dữ liệu đề. Nó chỉ về theo phản hồi của mutation mở khoá, nên trước khi mở khoá màn không có gì để hiện, và sau khi mở khoá dữ liệu ấy chỉ sống trong state phía client. `src/modules/databases/postgresql/primary/entities/coding-problem.entity.ts:256`, `src/modules/bussiness/coding/coding-submission.service.ts:155`
- Testcase ẩn không bao giờ ra khỏi server. Đề chỉ kèm ca mẫu; phần chi tiết từng ca sau khi chấm cũng chỉ có input/output cho ca mẫu, ca ẩn chỉ có đúng/sai. `src/features/api/core/graphql/queries/coding/coding-problem/coding-problem.resolver.ts:35`
- Số điểm đi theo độ khó (easy 10, medium 15, hard 20) và nằm sẵn trên bài, đừng tự tính lại ở FE. `src/modules/databases/postgresql/primary/entities/coding-problem.entity.ts:157`
- Mọi truy vấn của khu luyện code đều đòi đăng nhập, kể cả danh mục bài. Khách vãng lai không rơi vào nhánh "rỗng" mà rơi vào nhánh "lỗi". `src/features/api/core/graphql/queries/coding/coding-problems/coding-problems.resolver.ts:46`
- Chế độ `free` khiến server xoá trắng `commandHint` của mọi bước ngay trong phản hồi. Bước vẫn còn nguyên, chỉ mất gợi ý lệnh. `src/features/api/core/graphql/mutations/playground-sessions/create-playground-session/graphql-types/response.ts:44`
- Mã ghép nối chỉ sống ba mươi phút kể từ lúc tạo phiên. Quá hạn thì cổng socket từ chối, nên màn phải nói rõ mã đã chết và cho xin mã mới, thay vì để người học dán một lệnh vô hiệu. `src/features/socketio/core/playground-byom/playground-byom.gateway.ts:62`, `:181`
- Nút xác minh bước không chạy lại lệnh. Nó chỉ yêu cầu agent chụp lại danh sách tài nguyên trên máy, rồi server đối chiếu với điều kiện của bước. Vì vậy bấm nhiều lần vô hại, và bấm khi chưa gõ lệnh thì đơn giản là không tiến. `D:/Repositories/starci-academy/src/components/features/learn/Playground/PlaygroundSession/index.tsx:180`
- Lab `rag` không dùng agent theo kiểu chấm bước: nó không có nút xác minh, người học tự đi tới lui giữa các bước, và điều kiện sẵn sàng được tách thành bốn dòng riêng chứ không gộp một dòng engine. `src/modules/databases/postgresql/primary/entities/playground.entity.ts:110`
- Một người chỉ nên có một phiên đang mở cho mỗi lab; FE hỏi phiên cũ trước rồi mới tạo mới, để F5 không sinh mã ghép nối mới trong khi agent ở terminal vẫn bám mã cũ. `D:/Repositories/starci-academy/src/components/features/learn/Playground/PlaygroundSessionProvider/index.tsx:187`
