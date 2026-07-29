# CỘNG ĐỒNG, HỒ SƠ, VIỆC LÀM

> Miền này lo phần "người học lộ diện ra ngoài": nói chuyện với cộng đồng, dựng hồ sơ và CV công khai, rồi đem hồ sơ đó đi tìm việc hoặc để nhà tuyển dụng tìm tới.

## 1. THỰC THỂ

| Thực thể | Là gì | Trạng thái thật (enum) |
| --- | --- | --- |
| CommunityPost | Bài viết tự do người dùng đăng lên bảng tin cộng đồng, có bình luận lồng nhau và cảm xúc. | `CommunityChannel`: `general` · `problems` · `founderQa`. Ngoài ra hai cờ boolean `isPinned`, `isDeleted` và mốc `editedAt`. |
| CommunityPostComment | Bình luận dưới một bài cộng đồng, trả lời nhau nhiều tầng qua `parentCommentId`. | không có trạng thái (chỉ cờ `isDeleted` và `editedAt`) |
| ContentComment | Bình luận thảo luận, hoặc gắn vào MỘT bài học, hoặc là câu hỏi chung của cả khóa — không bao giờ cả hai. | không có trạng thái (chỉ cờ `isDeleted` và `editedAt`) |
| Reaction (post · comment · activity · content) | Một người thả đúng một cảm xúc lên một đối tượng; đổi cảm xúc là ghi đè, bỏ là xóa hàng. | `ReactionType`: `like` · `love` · `haha` · `wow` · `sad` · `angry` |
| Activity | Sổ ghi việc người học vừa làm, để dựng bảng tin kiểu GitHub. Hệ thống sinh ra, người dùng không viết. | `ActivityType`: `lessonRead` · `lessonBookmarked` · `challengePassed` · `codingSolved` · `milestonePassed` · `aiLabPassed` · `courseEnrolled` · `discussionCommented` · `userFollowed` |
| UserFollow | Một chiều theo dõi giữa hai người, mỗi cặp chỉ một lần. | không có trạng thái |
| ChatConversation | Phòng chat chung của cộng đồng, hoặc hộp thoại riêng với founder. | `ChatConversationType`: `community` · `founder` |
| BlogPost | Bài blog do đội ngũ viết, song ngữ, có thể để riêng cho hội viên. | `BlogCategory`: `deep-dive` · `build-in-public` · `career` · `ai` · `case-study` · `codebase`. Cờ `isPremium`, `isPublished`. |
| User (phần hồ sơ) | Danh tính công khai: tên hiển thị, ảnh, tiểu sử, chức danh, nơi ở, liên kết ngoài. | `WorkMode` (cho phép rỗng): `remote` · `hybrid` · `onsite`. Hai cờ quyết định UI: `profileLocked`, `openToWork`. |
| UserPinnedProject | Dự án người dùng ghim lên hồ sơ; tối đa sáu cái. | `ProjectPinType`: `course` · `external` |
| CvBlocks | CV người dùng tự soạn bằng trình sửa khối; một người có nhiều CV. | không có trạng thái |
| UserCvGeneration | CV do máy dựng hoặc do người dùng tải file lên, chạy nền rồi ra PDF. | `CvGenerationStatus`: `pending` · `processing` · `done` · `failed`; `CvGenerationMode`: `generate` · `revise`; `CvSource`: `generated` · `uploaded` |
| TemplateCV | Bộ luật chấm CV theo cấp bậc, dùng cho phần soi CV. | không có trạng thái |
| (thẻ tin cậy ứng viên) | Mức độ công việc thật đã chấm đứng sau CV, để nhà tuyển dụng tin. | `CvVerificationLevel`: `self_reported` · `activity_backed` · `capstone_verified` |
| (mức sẵn sàng đi làm) | Nhãn định tính cho một track của ứng viên, tính từ điểm chiều sâu. | union `UserJobReadinessBand`: `needsWork` · `building` · `jobReady` (kiểu union TypeScript, không phải enum) |
| JobPosting | Tin tuyển dụng có cấu trúc: chức danh, lương, nơi làm, cách ứng tuyển. | `JobEmploymentType`: `fulltime` · `parttime` · `internship` · `contract`; `WorkMode`: `remote` · `hybrid` · `onsite`; `JobApplyMethod`: `external_url` · `email`; `JobPostingSource`: `seeded` · `submitted` |
| HeadhuntingCompany | Công ty tuyển dụng, vừa là nơi các consultant làm việc vừa là chủ tin tuyển dụng. | không có trạng thái |
| Consultant | Người tuyển dụng của một công ty; thông tin liên hệ bị khóa sau điểm CV. | không có trạng thái lưu trong bảng; hai trường tính tại request là `contactUnlocked` và `cvScoreUnlockThreshold` |
| Notification | Một thông báo riêng gửi tới đúng một người; `readAt` rỗng nghĩa là chưa đọc. | `NotificationType`: `system` · `challengeGraded` · `codingGraded` · `milestoneGraded` · `newFollower` · `commentReply` · `communityReply` · `subscriptionGranted` · `announcement` · `streakMilestone` |
| Device | Máy hoặc trình duyệt người dùng từng đăng nhập, để liệt kê phiên và đối chiếu gian lận. | không có trạng thái (chỉ cờ `trusted`) |
| Job (hạ tầng) | Hàng đợi việc chạy nền, trong miền này là việc dựng và chấm CV. | `JobStatus`: `queued` · `processing` · `completed` · `failed` |
| Qna | Cặp hỏi đáp gắn trang giới thiệu khóa học. | không có trạng thái |

## 2. MÀN HÌNH PHỤC VỤ

| Màn | Phục vụ việc gì | Thực thể chính |
| --- | --- | --- |
| `/[locale]/community` | Bảng tin cộng đồng: lọc theo kênh, viết bài, thả cảm xúc, bình luận. | CommunityPost, CommunityPostComment, Reaction |
| `/[locale]/community/chat` | Chat: phòng chung của cộng đồng và hộp thoại riêng với founder. | ChatConversation |
| `/[locale]/blog` | Danh sách bài blog, lọc theo chuyên mục. | BlogPost |
| `/[locale]/blog/[slug]` | Đọc một bài blog, kèm cổng hội viên nếu bài để riêng. | BlogPost |
| `/[locale]/profile` | Không có giao diện riêng, chỉ chuyển hướng về hồ sơ của chính mình. | User |
| `/[locale]/profile/[username]` | Hồ sơ công khai: danh tính, huy hiệu, tổng quan. | User, UserFollow |
| `/[locale]/profile/[username]/activity` | Dòng hoạt động của người đó. | Activity |
| `/[locale]/profile/[username]/projects` | Dự án đã ghim. | UserPinnedProject |
| `/[locale]/profile/[username]/cv` | CV công khai duy nhất của người đó, nhúng dạng PDF. | CvBlocks |
| `/[locale]/profile/[username]/challenges`, `.../skills` | Bài tập đã làm và kỹ năng, cùng nằm sau cổng riêng tư từng mục. | User |
| `/[locale]/profile/cv` | Kho CV của chính mình: tạo, đổi tên, xóa, bật công khai. | CvBlocks |
| `/[locale]/profile/cv/[cvId]`, `/profile/cv/edit` | Trình sửa CV theo khối, có khung xem trước. | CvBlocks |
| `/[locale]/profile/settings/edit` | Sửa danh tính, chức danh, hình thức làm việc, cờ mở việc. | User |
| `/[locale]/profile/settings/privacy` | Khóa hồ sơ và bật tắt từng mục hiển thị. | User |
| `/[locale]/profile/settings/sessions` | Danh sách thiết bị và phiên đăng nhập. | Device |
| `/[locale]/jobs` | Bảng việc làm công khai: tìm và lọc. | JobPosting |
| `/[locale]/jobs/[displayId]` | Chi tiết một tin và nút ứng tuyển. | JobPosting, HeadhuntingCompany |
| `/[locale]/jobs/post` | Người dùng tự đăng tin tuyển dụng. | JobPosting |
| `/[locale]/talents` | Chợ ứng viên cho nhà tuyển dụng, lọc theo một track. | User, thẻ tin cậy, mức sẵn sàng |
| `/[locale]/notifications` | Trung tâm thông báo, lọc theo loại, đánh dấu đã đọc. | Notification |
| `/[locale]/courses/[courseId]/learn/headhuntings` | Lưới consultant trong phạm vi một khóa. | Consultant, HeadhuntingCompany |
| `/[locale]/courses/[courseId]/learn/headhunting-companies/[companyId]` | Chi tiết một công ty tuyển dụng và người của họ. | HeadhuntingCompany, Consultant |

Đường dẫn `/[locale]/headhunting-companies/[companyId]` vẫn còn nhưng chỉ là trang chuyển hướng về bản gắn khóa học, không có giao diện riêng.

## 3. STATE PHẢI VẼ

| Vùng/màn | State | Điều kiện nghiệp vụ | Hình đổi gì |
| --- | --- | --- | --- |
| Bảng tin cộng đồng | đang tải | lần đầu, chưa có bài nào trong bộ nhớ | thay cả danh sách bằng khung xám `CommunityFeedSkeleton`, tab kênh vẫn bấm được |
| Bảng tin cộng đồng | lỗi | truy vấn hỏng và danh sách rỗng | thẻ lỗi kèm nút thử lại, giữ nguyên tab kênh phía trên |
| Bảng tin cộng đồng | rỗng do lọc | đang đứng ở một kênh cụ thể mà kênh đó chưa có bài | thẻ rỗng riêng, nút dẫn về tab "tất cả kênh" |
| Bảng tin cộng đồng | rỗng toàn nền tảng | đang ở tab "tất cả" mà vẫn không có bài | thẻ rỗng khác hẳn, lời mời vào khóa học thay vì nút đổi kênh |
| Bảng tin cộng đồng | chưa đăng nhập | không có phiên | ẩn hẳn ô soạn bài, thanh cảm xúc chuyển sang chỉ đọc không bấm được |
| Bảng tin cộng đồng | hết hạn mức đăng bài | không phải hội viên và đã đăng đủ số bài trong cửa sổ ngày (mặc định ba bài trong bảy ngày) | máy chủ ném lỗi hạn mức, màn hiện toast, ô soạn giữ nguyên nội dung để không mất bài |
| Bảng tin cộng đồng | đang tải thêm | cuộn tới cuối, đang lấy trang kế | nút hoặc vùng cuối chuyển sang trạng thái chờ, danh sách cũ đứng yên |
| Thẻ bài viết | bài ghim | `isPinned` bật | luôn nổi lên đầu kênh, thêm dấu ghim ở đầu thẻ |
| Thẻ bài viết | bài đã xóa | `isDeleted` bật | thân bài thay bằng dòng chữ thay thế, mất nút cảm xúc và nút sửa, nhánh bình luận vẫn còn nguyên |
| Thẻ bài viết | đã chỉnh sửa | `editedAt` khác rỗng | thêm nhãn "đã chỉnh sửa" cạnh mốc thời gian |
| Thẻ bài viết | đã thả cảm xúc | có cảm xúc của chính người xem | nút cảm xúc đổi sang biểu tượng đã chọn trong sáu loại và tô màu nổi |
| Nhánh bình luận | chưa có trả lời | `replyCount` bằng không | không hiện nút xem trả lời |
| Nhánh bình luận | đang mở nhánh | bấm xem trả lời lần đầu | nút chuyển sang chờ, nhánh con đổ ra bên dưới thụt vào |
| Nhánh bình luận | bình luận đã xóa | `isDeleted` bật | thân đổi thành chữ thay thế, mất hàng nút thao tác, các trả lời con vẫn hiện |
| Chat cộng đồng | chưa đăng nhập | không có phiên | cả vùng chat thay bằng thẻ rỗng và nút mở hộp đăng nhập |
| Chat cộng đồng | chưa dựng xong hội thoại | đã đăng nhập nhưng chưa có mã hội thoại | khung xám đúng hình pane thật gồm danh sách tin và ô soạn, để không nhảy layout khi có dữ liệu |
| Chat cộng đồng | đổi tab | chuyển giữa phòng chung và hộp founder | pane bị thay khóa theo mã hội thoại, cuộn về đáy như phiên mới |
| Hồ sơ công khai | đang tải | chưa có dữ liệu người dùng | toàn trang là `ProfileLoadingState`, thanh tab chưa gắn vào navbar |
| Hồ sơ công khai | không tìm thấy | truy vấn trả về rỗng hoặc lỗi | `ProfileNotFoundState`, không dựng tab |
| Hồ sơ công khai | hồ sơ bị khóa | `profileLocked` bật và người xem không phải chủ | giữ phần đầu danh tính, bỏ toàn bộ tab, chèn thông báo hồ sơ riêng tư |
| Hồ sơ công khai | một mục bị ẩn | người xem là khách và chủ tắt mục đó | riêng panel của mục đó thành thẻ rỗng có ổ khóa; các mục khác vẫn chạy, và các truy vấn con của mục bị chặn ngay tại đây |
| Hồ sơ công khai | là chính mình | tên tài khoản trùng người xem | mất nút theo dõi, hiện nút sửa hồ sơ, các mục bị ẩn vẫn hiện đầy đủ |
| Hồ sơ công khai | đang mở việc | `openToWork` bật | thêm chip tuyển dụng cạnh tên |
| Nút theo dõi | ba trạng thái | chưa theo dõi · đã theo dõi · đang gửi | chữ và kiểu nút đổi theo giá trị thật từ máy chủ; khi đang gửi thì khóa nút và tự tay chèn spinner |
| Tab CV công khai | chưa có CV công khai | không có CV nào được bật công khai | thẻ rỗng; nếu là chủ thì thêm gợi ý dẫn sang kho CV |
| Tab CV công khai | có CV nhưng chưa dựng file | có bản ghi mà chưa có PDF | ghi chú riêng thay cho khung nhúng, không hiện khung PDF trắng |
| Tab CV công khai | có file | đã dựng xong PDF | khung nhúng dạng trang giấy, chỉ đọc |
| Kho CV | đang tải · rỗng · lỗi | ba nhánh của cùng một truy vấn | khung xám dạng lưới thẻ · thẻ rỗng mời tạo CV đầu tiên · thẻ lỗi kèm thử lại |
| Chạy dựng CV nền | `pending` · `processing` | máy chủ nhận việc rồi giao cho worker | thẻ CV hiện nhãn đang xử lý, khóa nút tải về và nút sửa, cần tự làm mới định kỳ |
| Chạy dựng CV nền | `done` | dựng xong | mở nút xem và tải PDF, hiện điểm nếu có |
| Chạy dựng CV nền | `failed` | worker hỏng, có `errorMessage` | thẻ đổi sang trạng thái lỗi, hiện thông điệp lỗi và nút chạy lại |
| Bảng việc làm | đang tải | lần đầu, chưa có tin nào | dãy hàng xám `JobListRowSkeleton` đúng số hàng của trang |
| Bảng việc làm | lỗi | truy vấn hỏng và danh sách rỗng | thẻ lỗi kèm thử lại, giữ thanh lọc |
| Bảng việc làm | rỗng toàn nền tảng | tổng số tin bằng không và người xem chưa lọc gì | thẻ rỗng dạng phễu hai chiều: vừa mời đăng tin vừa mời xem khóa học |
| Bảng việc làm | rỗng do lọc | có tin nhưng bộ lọc hiện tại không ra kết quả | thẻ rỗng khác, nút chính là xóa bộ lọc |
| Chi tiết việc làm | đang tải | chưa có tin | khung xám đủ tiêu đề, chip, thẻ công ty, hai khối mô tả và nút |
| Chi tiết việc làm | không tìm thấy | hết tải mà vẫn không có tin | thẻ rỗng "không tìm thấy tin", không dựng nút ứng tuyển |
| Chi tiết việc làm | ứng tuyển qua liên kết | `applyMethod` là `external_url` và có `applyUrl` | một nút chính mở tab mới |
| Chi tiết việc làm | ứng tuyển qua email | `applyMethod` là `email` và có `applyEmail` | nút chính đổi chữ thành gửi thư kèm địa chỉ, bấm là mở trình gửi thư |
| Đăng tin việc làm | chưa đăng nhập | không có phiên | không cho gửi biểu mẫu, đẩy sang đăng nhập trước |
| Chợ ứng viên | đang tải | danh sách khóa hoặc danh sách ứng viên chưa về, hoặc chưa chọn track | sáu thẻ xám bố cục theo container, không theo bề rộng màn hình |
| Chợ ứng viên | rỗng | track đang chọn không có ai mở việc | thẻ rỗng kèm gợi ý đổi track |
| Chợ ứng viên | ba mức sẵn sàng | `jobReady` · `building` · `needsWork` | chip đổi màu lần lượt xanh · hổ phách · trung tính, tuyệt đối không hiện số điểm |
| Chợ ứng viên | đạt chuẩn track | cờ `isQualified` | thêm chip riêng có biểu tượng tên lửa, đứng cạnh chip mức |
| Trung tâm thông báo | đang tải · rỗng · lỗi | ba nhánh của cùng một truy vấn | dãy hàng xám có tròn avatar và hai dòng · thẻ rỗng bọc trong khung thẻ · thẻ lỗi kèm thử lại |
| Trung tâm thông báo | chưa đọc | `readAt` rỗng | hàng đổi nền nổi hơn và có chấm chưa đọc; bấm vào thì đánh dấu đã đọc rồi mới điều hướng |
| Trung tâm thông báo | có thông báo chưa đọc | số chưa đọc lớn hơn không | hiện nút đánh dấu đọc hết ở đầu trang, chuông đeo huy hiệu số |
| Trung tâm thông báo | lọc theo loại | chọn một trong mười loại | mỗi loại có biểu tượng riêng, đổi tab là đổi truy vấn, phân trang về đầu |
| Bài blog | bài trả phí bị cắt | máy chủ trả về thân đã cắt và bật cờ khóa | phần cuối thân bài thay bằng thẻ cổng hội viên viền cảnh báo, không hiện phần còn lại |
| Bài blog | nhãn chuyên mục | sáu giá trị `BlogCategory` | chip chuyên mục trên thẻ danh sách và đầu bài, thêm chip trả phí nếu là bài riêng |
| Consultant | liên hệ bị khóa | điểm CV tốt nhất của người xem dưới ngưỡng, hoặc người xem chưa đăng nhập | mọi ô email, điện thoại, Zalo, LinkedIn về rỗng; thay bằng dòng "cần điểm CV từ X" với X lấy từ máy chủ, không viết cứng số |
| Consultant | liên hệ đã mở | điểm CV đạt ngưỡng | hiện đủ các ô liên hệ và nút bấm gọi, nhắn, mở LinkedIn |

## 4. LUẬT NGHIỆP VỤ ĐÁNG NHỚ

- Xóa bài và xóa bình luận là xóa mềm, hàng vẫn nằm đó. Màn phải chịu được bài có thân rỗng mà nhánh trả lời vẫn dài — đừng gấp cả nhánh lại khi cha bị xóa. `src/modules/databases/postgresql/primary/entities/community-post.entity.ts:94`, `.../community-post-comment.entity.ts:59`
- Chỉ founder mới ghim được bài, và bài ghim luôn xếp trước trong mọi kênh. Nút ghim chỉ hiện cho founder nhưng máy chủ mới là chỗ chặn thật. `src/modules/bussiness/community/community-post.service.ts:194`, `:249`
- Hạn mức chỉ áp cho việc TẠO bài gốc. Bình luận và thả cảm xúc thì ai cũng thoải mái, kể cả người chưa mua gì. Đừng khóa nút bình luận theo tư cách hội viên. `src/modules/bussiness/community/community-post-quota.service.ts:30`, `:51`
- Người không phải hội viên bị chặn sau một số bài trong cửa sổ ngày, mặc định ba bài bảy ngày và đọc từ biến môi trường. Đừng viết cứng con số vào giao diện. `src/modules/env/config.ts:33`
- Được thả cảm xúc lên bài của chính mình, nhưng KHÔNG được thả lên hoạt động của chính mình. Hai vùng cùng một hàng nút mà luật ngược nhau. `src/modules/bussiness/community/community-reaction.service.ts:42`, `src/modules/bussiness/discussion/reaction.service.ts:155`
- Mỗi người chỉ giữ một cảm xúc trên một đối tượng; đổi cảm xúc là ghi đè chứ không cộng thêm. Thanh cảm xúc phải là chọn một, không phải chọn nhiều. `src/modules/databases/postgresql/primary/entities/community-post-reaction.entity.ts:28`
- Một bình luận thảo luận hoặc gắn bài học, hoặc gắn cả khóa, không bao giờ cả hai và không bao giờ không có gì. Giao diện phải quyết định ngữ cảnh trước khi mở ô soạn. `src/modules/databases/postgresql/primary/entities/content-comment.entity.ts:28`
- Khóa hồ sơ chỉ là lớp trình bày, dữ liệu tab đã bị máy chủ giữ lại từ trước. Vẽ phần đầu danh tính rồi dừng, đừng cố gọi truy vấn tab để rồi nhận rỗng. `src/components/features/profile/PublicProfile/index.tsx:112`, `:147` (FE)
- Cổng riêng tư từng mục thất bại theo hướng MỞ: lúc còn tải hoặc thiếu cờ thì cứ hiện nội dung, máy chủ là chốt chặn cuối. `src/components/features/profile/PublicProfile/ProfileSectionGuard/index.tsx:26` (FE)
- Điểm mở khóa liên hệ consultant là điểm CV tất định tính từ capstone đã đậu, không phải điểm do AI chấm chữ trong CV. Chỉ `capstone_verified` cho điểm dương, `activity_backed` vẫn bằng không. `src/modules/bussiness/headhuntings/cv-verification.service.ts:138`
- Ngưỡng mở khóa hiện là bảy mươi và máy chủ trả về kèm mỗi consultant. Luôn lấy `cvScoreUnlockThreshold` từ dữ liệu, đừng in số cứng. `src/modules/bussiness/headhuntings/constants/index.ts:8`, `src/modules/bussiness/headhuntings/consultant-contact-gate.service.ts:81`
- Chợ ứng viên xếp hạng theo TỪNG track một, phía máy chủ. Đổi track là đổi cả thứ tự lẫn nhãn, và tuyệt đối không được hiện điểm số thô hay điểm gộp nhiều track. `src/components/features/careers/Headhunting/TalentDirectory/index.tsx:28` (FE), `src/features/api/core/graphql/queries/users/talent-candidates/talent-candidates.service.ts:375`
- Ngưỡng mức sẵn sàng là bảy mươi cho `jobReady` và bốn mươi cho `building`. Nhãn là định tính, số chỉ nằm ở backend. `src/features/api/core/graphql/queries/users/job-readiness/constants/bands.ts:1`
- Tin tuyển dụng lên sóng ngay khi gửi, không có hàng chờ duyệt. `source` chỉ nói tin từ đâu ra, không phải trạng thái kiểm duyệt — đừng vẽ chip "chờ duyệt". `src/modules/databases/postgresql/primary/entities/job-posting.entity.ts:40`, `src/modules/databases/postgresql/primary/enums/job-posting-source.ts:28`
- Nút ứng tuyển phụ thuộc hoàn toàn vào `applyMethod`, và mỗi nhánh còn phải có trường đi kèm mới hiện. Thiếu `applyUrl` hay `applyEmail` là không có nút nào cả. `src/components/features/careers/Jobs/JobDetail/index.tsx:222` (FE)
- Dựng CV chạy nền qua hàng đợi, trạng thái đi từ `pending` sang `processing` rồi `done` hoặc `failed`. Màn phải sống được ở trạng thái đang chạy và phải tự làm mới. `src/modules/databases/postgresql/primary/entities/user-cv-generation.entity.ts:51`
- Một người ghim tối đa sáu dự án, thứ tự do `orderIndex` quyết. Dự án kiểu `course` mới được gắn dấu đã xác thực, kiểu `external` thì không bao giờ. `src/modules/databases/postgresql/primary/entities/user-pinned-project.entity.ts:32`
- Thông báo là hàng riêng tư có vòng đời đọc: `readAt` rỗng là chưa đọc, và huy hiệu chuông đếm đúng các hàng đó. Nội dung chữ dựng từ khóa i18n cộng tham số, không có chữ lưu sẵn. `src/modules/databases/postgresql/primary/entities/notification.entity.ts:38`, `:54`
- Bảng tin hoạt động và trung tâm thông báo chỉ lưu tên thực thể cộng mã cộng nhãn, đường dẫn được giải ra lúc bấm. Đừng mong có sẵn URL trong dữ liệu. `src/modules/databases/postgresql/primary/entities/activity.entity.ts:20`
- Bài blog trả phí bị cắt thân ngay từ máy chủ, giao diện chỉ chèn thẻ cổng vào chỗ bị cắt. Không có chuyện tải đủ rồi mờ đi. `src/components/features/blog/BlogPost/index.tsx:109` (FE)
