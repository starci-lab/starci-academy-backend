# KHOÁ HỌC VÀ NỘI DUNG

> Miền này lo việc người học tìm ra khoá, xem thử được bao nhiêu, rồi đọc từng bài trong cây module → bài học cho tới khi hết khoá.

## 1. THỰC THỂ

| Thực thể | Là gì | Trạng thái thật (enum) |
| --- | --- | --- |
| Course | Một chương trình học bán được, có giá gốc, ảnh bìa, danh sách module xếp thứ tự, và các mục bán hàng như điều kiện tiên quyết, giá trị mang lại, hỏi đáp. | `defaultLocale`: `vi` · `en` |
| CourseMetadata | Bảng phụ một-một của khoá, chỉ giữ đúng một thứ người dựng UI cần: khoá đang ở bậc giá nào. | `currentPhase`: `pioneer` · `earlyBird` · `regular` |
| Module | Một chương trong khoá. Mang cờ khoá cứng cả chương và một nhãn bậc học để gắn chip. | `contentTier`: `foundation` · `intermediate` · `advanced` (cho phép null) |
| Content (bài học) | Một bài trong chương: tiêu đề, mô tả, thân markdown, số phút đọc, cùng các tab phụ như challenge, sandbox, code, E2E. | `difficulty`: `beginner` · `intermediate` · `advanced` (cho phép null) · `defaultLocale`: `vi` · `en` |
| ContentBody | Thân bài viết theo NGÔN NGỮ LẬP TRÌNH (typescript, java, csharp, go). Bài kiểu mới để trường `body` gốc rỗng và đổ hết vào đây. | không có trạng thái |
| ContentLearningOutcome | Một gạch đầu dòng "bạn sẽ nắm được" gắn vào bài học, có thứ tự. | không có trạng thái |
| PreviewContent | Một dòng mô tả nội dung chương, dùng cho phần xem trước ở trang bán khoá. | không có trạng thái |
| Prerequisite | Một dòng điều kiện tiên quyết của khoá. | không có trạng thái |
| Enrollment | Quan hệ người học × khoá. Cờ `isEnrolled` phân biệt ĐÃ MUA với HỌC THỬ; dòng học thử vẫn tồn tại để ghi tiến độ. | `pricingPhase`: `pioneer` · `earlyBird` · `regular` · `taskPlanStatus`: `locked` · `in_progress` · `completed` |
| UserContent | Trạng thái riêng của người học trên MỘT bài: đã đọc chưa, có lưu không. | không có trạng thái (hai cờ boolean `isRead`, `isFavorite`) |
| UserCourseProgressProjection | Bản tổng hợp tiến độ một người trong một khoá (điểm, số bài đã đọc, số challenge xong, XP) — chỉ để đọc. | không có trạng thái |
| FoundationCategory | Một nhóm kiến thức nền (docker, kubernetes, nodejs…) trong tab Foundations. | không có trạng thái |
| Foundation | Một tài nguyên nền trong nhóm: link ngoài, video, hoặc bài markdown. Có cờ "được khuyên dùng". | `kind`: `external_link` · `video` · `document` |
| FoundationTag | Nhãn gắn vào một tài nguyên nền, để lọc và hiển thị. | không có trạng thái |
| Resource | Cách người học đính kèm bài nộp: danh sách đường dẫn thư mục hoặc một URL Git. Thực ra treo dưới bài nộp challenge, không treo dưới bài học. | `type`: `driverUrl` · `gitUrl` |

## 2. MÀN HÌNH PHỤC VỤ

| Màn | Phục vụ việc gì | Thực thể chính |
| --- | --- | --- |
| `/[locale]/courses` | Danh mục khoá, có ô tìm và lưới thẻ khoá. | Course |
| `/[locale]/courses/[courseId]` | Trang bán khoá: hero, giá theo bậc, chương trình học, tiên quyết, hỏi đáp, nút mua và nút học thử. | Course · Module · Prerequisite · PreviewContent |
| `/[locale]/contents/[contentId]` | Bài viết công khai đọc không cần đăng nhập, chỉ mở cho bài KHÔNG premium. | Content |
| `/[locale]/courses/[courseId]/learn/content` | Trang chủ nội dung khoá: tiến độ tổng, nút học tiếp, và các bài của chương đang học. | Enrollment · Module · Content · UserContent |
| `…/learn/content/modules/[moduleId]` | Trang một chương: nhãn bậc, tiến độ chương, danh sách bài kèm phút đọc, độ khó, số challenge. | Module · Content |
| `…/learn/content/modules/[moduleId]/contents/[contentId]` | Trình đọc bài học: header, thanh tab, thân bài, phản ứng, bình luận, chuyển bài trước/sau. | Content · ContentBody · UserContent |
| `…/learn/foundations` | Lưới nhóm kiến thức nền. | FoundationCategory |
| `…/learn/foundations/[categoryId]` | Danh sách tài nguyên trong một nhóm, có tìm kiếm và phân trang phía máy chủ. | Foundation · FoundationTag |
| `…/learn/foundations/[categoryId]/[foundationId]` | Trang riêng của một tài nguyên nền loại video hoặc tài liệu. | Foundation |

## 3. STATE PHẢI VẼ

| Vùng/màn | State | Điều kiện nghiệp vụ | Hình đổi gì |
| --- | --- | --- | --- |
| Danh mục khoá | đang tải | lần fetch đầu, danh sách còn rỗng | lưới thẻ khoá đổi thành lưới skeleton cùng số cột |
| Danh mục khoá | rỗng (không lọc) | trả về 0 khoá, ô tìm trống | thay lưới bằng một khối rỗng một dòng tiêu đề |
| Danh mục khoá | rỗng (đang lọc) | trả về 0 khoá nhưng có từ khoá | khối rỗng đổi chữ, thêm mô tả và nút "xoá bộ lọc" |
| Danh mục khoá | lỗi | lỗi và chưa có dữ liệu cũ | khối lỗi kèm nút thử lại, không giữ lưới |
| Thẻ khoá | đã mua | `course.isEnrolled = true` | thẻ mọc thêm dấu đã ghi danh; khách vãng lai nhận `null` nên KHÔNG được vẽ dấu này |
| Trang bán khoá | đang tải · rỗng · lỗi | ba nhánh của `AsyncContent` quanh query `course` | lần lượt: skeleton toàn trang · khối "không thấy khoá" · khối lỗi kèm thử lại |
| Nút hành động trang bán khoá | chưa mua | `courseEnrollmentStatus.isEnrolled = false` (kể cả khi đã có dòng học thử) | ba nút xếp dọc: "Ghi danh" là nút chính có mũi tên, "Thêm giỏ", "Học thử" |
| Nút hành động trang bán khoá | đã mua | `isEnrolled = true` | thu về ĐÚNG một nút "Học tiếp" |
| Rail giá | bậc giá hiện tại | `metadata.currentPhase` là `pioneer`/`earlyBird`/`regular` | dòng bậc đang chạy được nhấn nổi, hai dòng còn lại chìm; kèm ghi chú số suất còn lại và giá bậc kế |
| Chương trong "chương trình học" | bậc học | `contentTier` = `foundation`/`intermediate`/`advanced` | chip đổi tông xanh / vàng / đỏ; `contentTier = null` thì KHÔNG vẽ chip |
| Trang chủ nội dung khoá | đang tải · rỗng · lỗi | outline chưa về / không có outline / query lỗi | skeleton dashboard · khối rỗng · khối lỗi có nút thử lại |
| Trang chủ nội dung khoá | đang học thử | trạng thái ghi danh đã chốt và `enrolled = false` | chèn thêm dải chuyển đổi (khoá + giá + khan hiếm + nút ghi danh) phía trên khối tiến độ |
| Trang chủ nội dung khoá | chưa chốt trạng thái | query ghi danh chưa trả lời | dải chuyển đổi và mọi banner học thử ẩn HOÀN TOÀN, không được nháy rồi biến mất |
| Trang chủ nội dung khoá | đã hết chỗ để học tiếp | không tính ra điểm học tiếp | mất nút "Học tiếp", dòng nhãn đổi sang câu "đã xong hết" |
| Hàng bài trong danh sách | chưa đọc · đã đọc · đang ở đây | `isRead` từ UserContent, so với con trỏ học tiếp | biểu tượng dẫn đầu đổi giữa vòng tròn rỗng, vòng tròn tích, và tam giác play |
| Hàng bài trong danh sách | bài khoá | `lesson.isPremium = true` | mọc thêm ổ khoá ở cụm meta bên phải |
| Hàng bài trong danh sách | có độ khó | `difficulty` khác null | thêm chip độ khó; null thì bỏ hẳn chip, không vẽ chip "không rõ" |
| Trang chương | chương bị khoá | `module.isPremium = true` VÀ chưa mua | toàn thân trang bị thay bằng thẻ mở khoá có giá và nút ghi danh, danh sách bài không render |
| Trình đọc bài | đang tải | chưa có bài trong redux lẫn cache | header và thân đổi thành skeleton, còn THANH TAB vẫn vẽ thật, không skeleton |
| Trình đọc bài | bài khoá, đọc thử | máy chủ trả `isPremium = true` kèm thân đã cắt cụt | thân bài bị cấm bôi đen, đuôi bài phủ một lớp mờ dần, dưới đó là khối paywall NẰM TRONG cùng thẻ giấy; ẩn luôn khối phản ứng, bình luận và nút chuyển bài |
| Thanh tab bài học | tab bị khoá | bài premium chưa mở khoá | tab "Challenge" chuyển sang chữ chìm và mọc ổ khoá; bấm vào KHÔNG đổi tab mà mở modal ghi danh |
| Thanh tab bài học | tab tuỳ nội dung | có sandbox / có AI Lab / có luồng E2E | thêm hoặc bớt hẳn tab tương ứng, không để tab trống |
| Trình đọc bài | đã đọc | `contentStatus.isRead = true` | mọc chip xanh "Đã đọc" ở header; chưa đọc thì không vẽ gì |
| Trình đọc bài | đổi ngôn ngữ lập trình | bài kiểu mới có nhiều `ContentBody` | thanh tab mọc thêm NHÓM TAB BÊN PHẢI cùng hàng, không đẻ thêm thanh thứ hai |
| Trình đọc bài | vượt hạn mức đọc | một tài khoản đọc quá 200 bài trong một giờ | máy chủ chặn thẳng bằng lỗi riêng; FE hiện chưa có màn riêng, sẽ rơi vào nhánh lỗi chung |
| Danh sách tài nguyên nền | đang tải · lỗi | fetch trang hiện tại | skeleton danh sách; lỗi rơi về nhánh chung |
| Danh sách tài nguyên nền | tìm không ra | có từ khoá, tổng số bằng 0 | khối "không khớp" thay danh sách, phân trang biến mất |
| Thẻ tài nguyên nền | theo loại | `kind` = `external_link` / `video` / `document` | chip loại đổi chữ; link ngoài mở tab mới, hai loại còn lại điều hướng sang trang riêng |
| Thẻ tài nguyên nền | được khuyên dùng | `isRecommended = true` | mọc thêm chip xanh thứ hai bên cạnh chip loại |
| Trang tài nguyên nền | đang tải · rỗng | lần đầu / không tìm thấy tài nguyên | skeleton tiêu đề + đoạn văn · khối rỗng một dòng |
| Mọi bề mặt học miễn phí | đang học thử | trạng thái đã chốt và chưa mua | chèn một dải callout mỏng "mở khoá khoá học" phía trên nội dung, chỉ một dòng, không phải popup |
| Bề mặt dự án cá nhân | chưa mua | route con `personal-project` và chưa ghi danh | cả bề mặt bị thay bằng cổng ghi danh có bản xem thử giả mờ phía sau |
| Bài viết công khai | không tồn tại hoặc là bài premium | truy vấn công khai từ chối bài premium y như bài không tồn tại | trả 404 của Next, KHÔNG hiện paywall |

## 4. LUẬT NGHIỆP VỤ ĐÁNG NHỚ

- Có dòng ghi danh KHÔNG có nghĩa là đã mua. Cờ `isEnrolled` mới quyết định; dòng học thử được tạo với cờ `false` ngay khi người học bấm "Học thử". Người dựng UI đọc sai chỗ này sẽ mở khoá nhầm cho người chưa trả tiền. `src/modules/databases/postgresql/primary/entities/enrollment.entity.ts:137`, `src/features/api/core/graphql/mutations/courses/start-trial/start-trial.handler.ts:115`.
- Truy vấn trạng thái ghi danh cũng trả `false` cho dòng học thử, nên nút "Ghi danh" vẫn phải hiện. `src/features/api/core/graphql/queries/courses/course-enrollment-status/course-enrollment-status.handler.ts:88`.
- Bài học premium KHÔNG bị chặn cứng: máy chủ cắt thân bài tới ngay trước mục kiểm thử rồi vẫn trả về, kèm `isPremium = true` mang nghĩa "bị khoá với bạn". Màn phải chịu được một thân bài cụt và tự làm mờ đuôi, chứ không được coi là lỗi. `src/features/api/core/graphql/queries/contents/content/content.handler.ts:179`.
- Khi bị khoá, máy chủ dọn sạch `codeExplainings` và `codeImplementations`. Mảng rỗng ở đây là do khoá, không phải bài thiếu nội dung. `src/features/api/core/graphql/queries/contents/content/content.handler.ts:350`.
- Cờ premium luôn đọc từ bản ghi sống trong cơ sở dữ liệu chứ không từ ảnh chụp lưu trữ, nên bật tắt khoá có hiệu lực ngay. Đừng cache trạng thái khoá ở phía màn. `src/features/api/core/graphql/queries/contents/content/content.handler.ts:167`.
- Trang chương có cờ khoá RIÊNG ở cấp chương. Chương premium khoá toàn bộ bài bên trong, độc lập với cờ premium của từng bài. `src/modules/databases/postgresql/primary/entities/module.entity.ts:130`.
- Nhãn bậc học chỉ là chip trang trí. Trong code hiện tại không có chỗ nào dùng nó để khoá nội dung, dù chú thích của enum nói ngược lại — hãy khoá theo cờ premium, đừng suy ra từ bậc. `src/modules/init/seeders/courses/parsers/module.service.ts:138`.
- Cây khoá cho người CHƯA ghi danh vẫn trả về đầy đủ, chỉ là mọi số tiến độ đều bằng không và các mục premium mang cờ khoá. Đừng chờ ghi danh mới vẽ cây. `src/features/api/core/graphql/queries/learner-cms/my-course-outline/my-course-outline.handler.ts:106`.
- Trạng thái ghi danh mặc định là chưa mua, nên chỉ được tin nó SAU khi truy vấn đã chốt. Vẽ sớm sẽ làm người đã mua thấy banner bán hàng nháy qua. `src/app/[locale]/courses/[courseId]/learn/layout.tsx:52` (repo FE).
- Bài viết công khai từ chối bài premium bằng đúng lỗi "không tìm thấy", nên trang công khai không bao giờ có paywall, chỉ có 404. `src/features/api/core/graphql/queries/contents/public-content/public-content.handler.ts:80`.
- Một tài khoản chỉ được đọc 200 bài trong một giờ, vượt là bị chặn ở tầng máy chủ trước cả khi chạm dữ liệu. Màn đọc nhiều bài liên tiếp phải chịu được lỗi này. `src/features/api/core/graphql/queries/contents/content/content.handler.ts:218`.
- Mục "bạn sẽ nắm được" hiện đang được máy chủ chèn tạm ba dòng mẫu khi bài không có dữ liệu thật, nên nó luôn khác rỗng. Đừng dựa vào nó để suy ra bài đã đủ nội dung. `src/features/api/core/graphql/queries/contents/content/content.handler.ts:250`.
- Danh sách tài nguyên nền tìm kiếm và phân trang Ở MÁY CHỦ, không lọc lại phía màn. Số tổng dùng để tính số trang đến từ máy chủ. `src/components/features/learn/Foundations/index.tsx:61` (repo FE).
- Bài học kiểu mới để trường `body` rỗng và chuyển hết sang các thân theo ngôn ngữ lập trình; màn phải đọc danh sách thân chứ không đọc trường đơn. `src/modules/databases/postgresql/primary/entities/content.entity.ts:350`.
