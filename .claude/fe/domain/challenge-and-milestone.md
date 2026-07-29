# THỬ THÁCH VÀ CỘT MỐC

> Miền này lo phần người học tự tay làm ra sản phẩm: nộp link repo hoặc tài liệu cho một thử thách gắn với bài học, hoặc làm từng nhiệm vụ của đồ án cá nhân theo cột mốc, rồi được AI chấm và trả về góp ý.

## 1. THỰC THỂ

| Thực thể | Là gì | Trạng thái thật (enum) |
| --- | --- | --- |
| Challenge | Một thử thách thực hành treo dưới một bài học, có điểm, độ khó, mô tả và gợi ý. | `difficulty`: `easy` · `medium` · `hard` · `insane` · `expert` |
| ChallengePrerequisite | Điều người học cần có sẵn trước khi bắt tay vào thử thách. Text theo từng ngôn ngữ lập trình. | không có trạng thái |
| ChallengeRequirement | Một yêu cầu cụ thể phải đạt, kèm điểm riêng của yêu cầu đó. | không có trạng thái |
| ChallengeStep | Một bước trong hướng dẫn làm từng bước, có tiêu đề và thân bài. | không có trạng thái |
| ChallengeOutput | Một kết quả quan sát được mà bài làm phải cho ra. | không có trạng thái |
| ChallengeSubmission | Một ô nộp bài của thử thách (deliverable): tiêu đề, mô tả, điểm tối đa, loại link. | `type`: `googleDocsUrl` · `githubUrl` |
| UserChallengeSubmission | Bài nộp của một người học vào một ô nộp: link đã điền, model chấm đã chọn, ngôn ngữ đã chọn. | không có trạng thái |
| UserChallengeSubmissionAttempt | Một lần chấm: số thứ tự lần, điểm, nhận xét ngắn, model đã chấm, thời điểm chấm xong. | không có trạng thái (điểm `score` và `processedAt` có thể null khi chưa chấm xong) |
| UserChallengeSubmissionFeedback | Một ý góp ý có cấu trúc của lần chấm: thông điệp, chi tiết, vị trí file, đề xuất sửa. | `severity`: `low` · `medium` · `high` |
| Tiến độ thử thách (projection) | Bảng tổng hợp mỗi thử thách của một enrollment: điểm mới nhất, điểm tối đa, số lần chấm, trạng thái vòng đời. | `status`: `notStarted` · `inProgress` · `failed` · `completed` |
| Milestone | Một cột mốc của đồ án cá nhân trong khóa, gom nhiều nhiệm vụ. | không có trạng thái |
| MilestoneTask | Một nhiệm vụ của cột mốc: tiêu đề, mô tả, gợi ý, điểm tối đa, phân loại, độ khó. | `type`: `design` · `techIntegrate` · `business`; `difficulty`: `easy` · `medium` · `hard` · `insane` · `expert` (có thể null) |
| MilestoneTaskBrief | Bản đề bài "làm cái gì" viết cho người học, một bản cho mỗi ngôn ngữ (hoặc `agnostic`). Markdown. | không có trạng thái |
| MilestoneTaskCriteria | Tiêu chí đạt của nhiệm vụ đời cũ, có điểm riêng, hiện công khai cho người học. | không có trạng thái |
| UserMilestoneTask | Nối enrollment với một nhiệm vụ mà người học đang làm. | không có trạng thái |
| UserMilestoneTaskAttempt | Một lần chấm nhiệm vụ: đạt hay không, điểm, nhận xét ngắn, model đã chấm. | không có enum, nhưng có cờ `passed` (boolean) |
| UserMilestoneTaskAttemptFeedback | Một ý góp ý có cấu trúc của lần chấm nhiệm vụ. | `severity`: `low` · `medium` · `high` |
| Enrollment (phần đồ án) | Chỗ giữ repo GitHub, nhánh, token repo riêng và trạng thái kế hoạch đồ án của người học trong khóa. | `taskPlanStatus`: `locked` · `in_progress` · `completed` |
| Job chấm bài | Việc chấm chạy nền, màn theo dõi qua socket. | `JobStatus`: `queued` · `processing` · `completed` · `failed` |

## 2. MÀN HÌNH PHỤC VỤ

| Màn (route thật) | Phục vụ việc gì | Thực thể chính |
| --- | --- | --- |
| `courses/[courseId]/learn/content/modules/[moduleId]/contents/[contentId]/challenges/[challengeId]` | Đọc đề thử thách và nộp bài. Cột trái đọc đề, cột phải dính (sticky) để nộp và xem điểm. | Challenge, ChallengeSubmission, UserChallengeSubmission |
| `…/challenges/[challengeId]/result` | Xem kết quả chấm của một ô nộp: chọn lần chấm qua `?submission=` và `?attempt=`, đọc điểm và toàn bộ góp ý. | UserChallengeSubmissionAttempt, UserChallengeSubmissionFeedback |
| `courses/[courseId]/learn/personal-project` | Bảng điều khiển đồ án: nhiệm vụ kế tiếp, thanh tiến độ, lưới nhiệm vụ của cột mốc hiện tại, chip trạng thái GitHub. | Milestone, MilestoneTask, tiến độ nhiệm vụ |
| `courses/[courseId]/learn/personal-project/tasks/[taskId]` | Đọc đề nhiệm vụ bên trái, panel nộp repo và chấm bên phải. | MilestoneTask, MilestoneTaskBrief, UserMilestoneTask |
| `courses/[courseId]/learn/personal-project/tasks/[taskId]/result` | Xem kết quả chấm nhiệm vụ: chọn lần chấm, điểm, phán quyết đạt/trượt, danh sách góp ý. | UserMilestoneTaskAttempt, UserMilestoneTaskAttemptFeedback |
| `profile/[username]/challenges` · `/[courseId]` · `/[courseId]/[submissionId]` | Hồ sơ công khai: khoe các bài nộp đã đạt, lọc theo khóa, xem chi tiết một bài kèm rubric góp ý. | UserChallengeSubmission, UserChallengeSubmissionFeedback |
| `profile/[username]/projects` · `/[courseId]` | Hồ sơ công khai: khoe đồ án đã làm và toàn bộ lộ trình cột mốc của một khóa. | Milestone, MilestoneTask, tiến độ nhiệm vụ |

## 3. STATE PHẢI VẼ

| Vùng/màn | State | Điều kiện nghiệp vụ | Hình đổi gì |
| --- | --- | --- | --- |
| Header đề thử thách | chưa bắt đầu | tiến độ `notStarted` (chưa có bài nộp nào) | Không có chip trạng thái, chỉ còn chip điểm và chip độ khó |
| Header đề thử thách | đang làm | tiến độ `inProgress` (đã tạo bài nộp nhưng chưa chấm lần nào) | Thêm chip vàng "đang làm" cạnh chip độ khó |
| Header đề thử thách | trượt | tiến độ `failed` (đã nộp hết nhưng có ô chưa qua ngưỡng) | Thêm chip đỏ "chưa đạt" |
| Header đề thử thách | đạt | tiến độ `completed` (mọi ô đã nộp và qua ngưỡng) | Thêm chip xanh "đạt"; vòng điểm bên phải đầy tới ngưỡng |
| Toàn màn thử thách | đang tải | entity thử thách chưa về redux | Thay bằng skeleton dựng đúng bố cục hai cột, không nháy khung rỗng |
| Đề thử thách: điều kiện tiên quyết · kết quả mong đợi · gợi ý | rỗng | mảng rỗng, hoặc mọi dòng chỉ có khoảng trắng | Cả khối biến mất hoàn toàn, không để lại tiêu đề trống |
| Đề thử thách: yêu cầu · các bước | rỗng | mảng rỗng cho ngôn ngữ đang chọn | Khối accordion tương ứng biến mất, các khối còn lại vẫn giữ nhịp cách nhau |
| Ô chọn ngôn ngữ chấm | chỉ có một ngôn ngữ | thử thách chỉ khai một bucket (thường là `agnostic`) | Dải tab trong drawer chỉ còn một tab; dòng tóm tắt vẫn hiện tên ngôn ngữ đó |
| Hàng ô nộp (accordion) | chưa nộp lần nào | không có `lastAttempt` | Icon vòng tròn rỗng, bên phải là chip điểm tối đa; hàng này được mở sẵn nếu là ô chưa đạt đầu tiên |
| Hàng ô nộp | đã nộp, chưa đạt | điểm lần mới nhất < điểm tối đa × ngưỡng đạt | Icon X đỏ, bên phải đổi thành "điểm đạt / điểm tối đa" |
| Hàng ô nộp | đã đạt | điểm lần mới nhất ≥ điểm tối đa × ngưỡng đạt | Icon tick xanh; hàng không còn được mở sẵn |
| Hàng ô nộp | đang chấm | job của hàng ở `queued` hoặc `processing` | Ô nhập link bị khóa, nút nộp vào trạng thái pending kèm Spinner, hiện dải chữ AI đang xử lý |
| Hàng ô nộp | chấm lỗi | job trả `failed` kèm `error` | Dải AI đổi sang thông báo lỗi thay vì tiến trình |
| Hàng ô nộp | link sai định dạng | đã chạm vào ô và validate không qua | Viền ô nhập đỏ, hiện `FieldError`, nút nộp bị vô hiệu |
| Hàng ô nộp | đang tự lưu | trạng thái autosave khác `idle` | Dòng chữ nhỏ phía trên accordion báo đang lưu; khi `failed` thì đổi sang màu danger |
| Panel nộp bài | hết hạn mức AI | cả cửa sổ 5 giờ hoặc cửa sổ tuần đều cạn credit | Backend ném lỗi hạn mức kèm giờ mở lại; toast lỗi, có lối rẽ sang trang mua thêm |
| Panel nộp bài | không được dùng model cao cấp | `canPremium` false | Model cao cấp trong dropdown ở dạng khóa, bấm vào thì điều hướng sang trang gói AI |
| Kết quả lần chấm gần nhất | có góp ý | lần chấm mới nhất có danh sách feedback | Chip đạt/trượt, dòng điểm kèm điểm cần đạt, rồi từng dòng góp ý với chấm màu theo `severity` |
| Kết quả lần chấm gần nhất | không có góp ý | có lần chấm nhưng danh sách feedback rỗng | Chỉ còn chip và dòng điểm, không render khối góp ý |
| Màn kết quả thử thách | chưa có lần chấm | danh sách attempt rỗng | Khối trống với tiêu đề và câu gợi ý, không hiện dải chọn lần chấm |
| Màn kết quả thử thách | đang tải | query attempt chưa có data và chưa có error | Hai skeleton hình viên thuốc thay cho dải chọn lần chấm |
| Màn kết quả thử thách | lỗi tải | query attempt trả error và không có data | Khối lỗi kèm nút thử lại |
| Màn kết quả thử thách | nhiều lần chấm | số lần chấm > 6 | Chỉ hiện 5 chip mới nhất, thêm nút "+N" mở drawer lịch sử đầy đủ |
| Màn kết quả thử thách | chưa biết ngưỡng đạt | system config chưa về (ngưỡng = 0) hoặc điểm tối đa = 0 | Coi như CHƯA đạt, không được vẽ chip đạt (nếu không sẽ ra lỗi "đạt 0/100") |
| Đồ án cá nhân, mọi màn | chỉ đang học thử | đã biết trạng thái ghi danh và người dùng chưa ghi danh | Thay toàn bộ bề mặt bằng thẻ mời ghi danh, phía sau là bản xem thử mờ dùng tên nhiệm vụ thật của khóa |
| Đồ án cá nhân, mọi màn | chưa biết ghi danh | query trạng thái ghi danh chưa xong | Giữ màn lại sau một Spinner căn giữa, tuyệt đối không nháy thẻ mời ghi danh |
| Bảng điều khiển đồ án | chưa nối GitHub | enrollment chưa có URL repo | Chip GitHub màu mặc định ghi "chưa kết nối" thay vì tên repo và nhánh |
| Bảng điều khiển đồ án | chưa có cột mốc nào | query milestone xong, danh sách rỗng, không lỗi | Khối trống thay cho thẻ tiếp tục và lưới nhiệm vụ |
| Bảng điều khiển đồ án | đang tải lần đầu | chưa có milestone trong redux và query chưa xong | Skeleton của bảng điều khiển |
| Bảng điều khiển đồ án | đã xong hết | không còn nhiệm vụ nào chưa hoàn thành (`currentTask` null) | Thẻ tiếp tục biến mất, thay bằng một dòng chữ "đã hoàn thành hết" |
| Thẻ nhiệm vụ trong lưới | bị khóa | nhiệm vụ chưa hoàn thành và không phải nhiệm vụ hiện tại | Dòng phụ đổi thành nhãn "đang khóa" |
| Đề nhiệm vụ | xem trước bản bị khóa | đang mở một nhiệm vụ bị khóa | Chèn Alert vàng ở đầu cột đọc, kèm nút nhảy về nhiệm vụ hiện tại (nút chỉ hiện khi nhiệm vụ hiện tại khác nhiệm vụ đang xem) |
| Đề nhiệm vụ | đang tải | chưa có task hiển thị hoặc query còn chạy | Skeleton của đề nhiệm vụ |
| Đề nhiệm vụ | nhiệm vụ đời cũ | không có bản brief nào | Ẩn khối brief, thay bằng khối tiêu chí công khai và hướng dẫn theo ngôn ngữ |
| Đề nhiệm vụ | nhiệm vụ đời cũ nhưng rỗng tiêu chí | danh sách tiêu chí rỗng | Khối trống tử tế dưới nhãn, không tự ẩn |
| Hàng nút hành động nhiệm vụ | bị khóa | nhiệm vụ chưa mở | Nút chấm bị vô hiệu; nút xem góp ý và nút lịch sử cũng vô hiệu |
| Hàng nút hành động nhiệm vụ | chưa từng chấm | danh sách lần chấm rỗng | Nút chính ghi "chấm bài" thay vì "chấm lại"; hai nút phụ vô hiệu |
| Hàng nút hành động nhiệm vụ | đang chấm | đang submit form, hoặc job ở `queued`/`processing` | Nút chính vào pending kèm Spinner, dưới nút hiện dải AI đang xử lý |
| Khối kết quả nhiệm vụ (panel phải) | chưa có lần chấm | query attempt xong, không có attempt nào | Khối tự ẩn hoàn toàn |
| Khối kết quả nhiệm vụ | đang tải | query attempt còn chạy | Skeleton của khối kết quả |
| Màn kết quả nhiệm vụ | chưa có lần chấm · lỗi · rỗng góp ý | tương ứng attempt rỗng, query lỗi, feedback rỗng | Ba khối trống/lỗi riêng; khi rỗng hoặc lỗi thì thẻ bọc BỎ khung (`frameless` tắt), chỉ khi có góp ý mới để accordion tự đóng khung |
| Màn kết quả nhiệm vụ | đạt | `attempt.passed` true | Chip xanh "đạt" cạnh điểm; cuối màn hiện lối đi tiếp sang nhiệm vụ kế |
| Mọi màn của miền | chưa đăng nhập | không có user | Mutation nộp bài ném lỗi không tìm thấy người dùng; màn phải chặn từ tầng route/gate chứ không để bấm nộp |
| Thử thách trong bài học trả phí | nội dung premium chưa mua | content sở hữu thử thách có `isPremium` | Backend ném lỗi khóa premium khi nộp; màn nên chặn nút nộp và mời mua khóa |

## 4. LUẬT NGHIỆP VỤ ĐÁNG NHỚ

- Chấm bài chạy NỀN, không đồng bộ. Mutation nộp trả về một `jobId`, màn tự đăng ký socket theo job đó rồi mới thấy điểm. Vì thế mọi vùng nộp bài phải chịu được đủ bốn trạng thái job `queued` · `processing` · `completed` · `failed`, và phải khóa ô nhập trong lúc đang chấm. Neo: `starci-academy/src/components/features/learn/Challenge/ChallengeSubmissionPanel/index.tsx:176` và `:326`.
- Đạt hay trượt KHÔNG phải điểm tuyệt đối mà là tỉ lệ so với ngưỡng cấu hình hệ thống. Thử thách so `điểm ≥ điểm ô nộp × challenge.passThreshold`; nhiệm vụ đồ án so `điểm ≥ maxScore × task.passThreshold`. Ngưỡng đến từ system config nên có lúc chưa về; lúc đó phải coi là chưa đạt. Neo: `src/modules/bussiness/progress/challenge.service.ts:262`, `src/modules/bussiness/progress/personal-project.service.ts:185`.
- Trạng thái vòng đời của một thử thách được suy ra, không lưu sẵn. "Đang làm" thắng mọi thứ khác khi còn một ô đã tạo mà chưa chấm lần nào; "đạt" chỉ khi TẤT CẢ ô đều đã nộp và đều qua ngưỡng. Đừng tự tính lại trên FE bằng cách khác. Neo: `src/modules/bussiness/progress/challenge.service.ts:271-277`.
- Nhiệm vụ đồ án mở TUẦN TỰ. "Nhiệm vụ hiện tại" là nhiệm vụ chưa hoàn thành đầu tiên theo thứ tự cột mốc rồi thứ tự nhiệm vụ; một nhiệm vụ chỉ mở khi nó đã hoàn thành hoặc nó chính là nhiệm vụ hiện tại. Nhiệm vụ sau vẫn ĐỌC được nhưng không chấm được. Neo: `src/modules/bussiness/progress/personal-project.service.ts:196`, `starci-academy/src/components/utils/task-lookup.ts:26`.
- Toàn bộ bề mặt đồ án cá nhân yêu cầu ĐÃ GHI DANH, còn thử thách thì không. Đây là bề mặt học duy nhất bị cổng ghi danh chặn; người học thử thấy thẻ mời ghi danh với bản xem thử dùng tên nhiệm vụ thật. Neo: `starci-academy/src/app/[locale]/courses/[courseId]/learn/layout.tsx:27`.
- Thử thách hiện chỉ mở trong nội dung MIỄN PHÍ. Nộp bài cho thử thách nằm trong content premium sẽ bị backend chặn thẳng. Neo: `src/features/api/core/graphql/mutations/challenge-submissions/submit-challenge-submission/submit-challenge-submission.handler.ts:180`.
- Nộp bài thử thách tự tạo enrollment học thử nếu người học chưa có. Vì vậy đừng giả định "có enrollment nghĩa là đã mua". Neo: `submit-challenge-submission.handler.ts:209`.
- Hạn mức chấm không phải giới hạn số lần mà là hạn mức credit AI theo hai cửa sổ trượt 5 giờ và một tuần. Cạn bất kỳ cửa sổ nào là chặn nộp, kèm mốc giờ mở lại. Không có "hết lượt" cố định cho từng thử thách. Neo: `submit-challenge-submission.handler.ts:87-105` và `:354`.
- Rubric chấm điểm là nội bộ, KHÔNG bao giờ lộ ra GraphQL: tiêu chí approach và outcome của cả thử thách lẫn nhiệm vụ đều cố tình không khai `@Field`. Màn chỉ được hiện đề bài, yêu cầu, bước, kết quả mong đợi và góp ý sau khi chấm. Neo: `src/modules/databases/postgresql/primary/entities/challenge.entity.ts:284`, `milestone-task.entity.ts:384`.
- Nội dung của thử thách và nhiệm vụ chia theo NGÔN NGỮ LẬP TRÌNH (typescript · java · csharp · go, hoặc `agnostic`), không phải theo ngôn ngữ giao diện. Đổi ngôn ngữ trong ô cài đặt chấm điểm là đổi luôn nội dung đề đang đọc. Nhớ ngôn ngữ đã chọn lần trước để mở lại đúng tab.
- Bài nộp đồ án là của CẢ ĐỒ ÁN, không phải của từng nhiệm vụ: một repo, một nhánh, một token dùng chung cho mọi nhiệm vụ trong khóa. Panel phải giữ nguyên khi đổi nhiệm vụ, chỉ cột đọc bên trái đổi.
- Token repo riêng chỉ ghi được, không đọc lại; backend chỉ trả về 4 ký tự cuối để nhận diện. Đừng dựng ô nhập kiểu "đọc rồi sửa". Neo: `src/modules/databases/postgresql/primary/entities/enrollment.entity.ts:206`.
- Góp ý AI mới là giá trị chính, không phải con số điểm. Mỗi ý có `severity`, có thể có vị trí file và đề xuất sửa; màn kết quả sắp xếp theo `severity` giảm dần rồi tới thứ tự lưu, và biến vị trí file thành link vào repo khi biết URL.
