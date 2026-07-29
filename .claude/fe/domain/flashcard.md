# FLASHCARD — Flashcard và lặp lại ngắt quãng

> Miền này giúp người học ghi nhớ lâu kiến thức phỏng vấn của một khóa: mỗi thẻ là một câu hỏi mở, người học tự chấm mức nhớ, và hệ thống SM-2 hẹn ngày ôn lại.

## 1. THỰC THỂ

| Thực thể | Là gì | Trạng thái thật (enum) |
| --- | --- | --- |
| Bộ thẻ (FlashcardDeck) | Một chủ đề gom nhiều thẻ, thuộc về đúng một khóa học. Ngoài tiêu đề/mô tả, mỗi bộ còn mang hai con số tính riêng cho người đang xem: số thẻ đến hạn và số thẻ đã thuộc. | `difficulty`: `easy` · `medium` · `hard` · `insane` · `expert` |
| Thẻ (FlashcardCard) | Một câu hỏi phỏng vấn dạng mở. Mặt trước là câu hỏi (Markdown), lật ra là đáp án mẫu, kèm phần giải thích sâu tùy chọn, cộng danh sách tag công nghệ. | `level`: `junior` · `middle` · `senior` · `staff` (cho phép rỗng — thẻ cũ không có level) |
| Lịch ôn của tôi (UserFlashcardReview) | Trạng thái SM-2 của một người trên một thẻ: độ dễ, khoảng cách ngày, số lần nhớ liên tiếp, và mốc `dueAt` quyết định thẻ có đến hạn hay chưa. Thẻ chưa có dòng này được coi là thẻ mới, đến hạn ngay. | không có trạng thái |
| Sự kiện chấm (FlashcardReviewEvent) | Nhật ký chỉ-ghi-thêm, mỗi lần người học bấm một mức nhớ là một dòng. Đây là nguồn tính chuỗi ngày, tỉ lệ nhớ, tổng lượt ôn. | `grade`: `0` Again · `1` Hard · `2` Good · `3` Easy |
| Phiên học thẻ một bộ (FlashcardReviewSession) | Một lượt "Học thẻ" chạy trên đúng một bộ, ghi lại thứ tự thẻ đã bốc, vị trí đang đứng và những vị trí đã chấm, để rời đi rồi quay lại vẫn tiếp được. | `status`: `in_progress` · `completed` · `abandoned` |
| Phiên ôn đến hạn (FlashcardDueReviewSession) | Giống trên nhưng bốc thẻ đến hạn xuyên nhiều bộ trong cùng khóa, nên không gắn với bộ nào cả. | `status`: `in_progress` · `completed` · `abandoned` |
| Phiên hỏi nhanh (FlashcardQuizSession) | Một lượt "Hỏi nhanh": bốc sẵn một tập thẻ, người học điền vào chỗ trống, kết thúc thì server chấm độ phủ, cộng XP và chốt danh sách chủ đề yếu. | `status`: `in_progress` · `completed` · `abandoned` · `mode`: `quick` · `deep` · `level`: một trong bốn mức của thẻ, hoặc rỗng nghĩa là mọi mức |
| Thống kê học thẻ toàn cục (UserFlashcardStatsProjection) | Bảng chiếu một dòng cho mỗi người: chuỗi ngày hiện tại, chuỗi dài nhất, tỉ lệ nhớ, tổng lượt ôn, lần ôn gần nhất. | không có trạng thái |
| Thống kê học thẻ theo khóa (UserFlashcardCourseStatsProjection) | Bảng chiếu một dòng cho mỗi lượt ghi danh: xu hướng hỏi nhanh theo thời gian, phân rã theo tag, theo bộ thẻ, và tiến độ ôn theo bộ. | không có trạng thái |

## 2. MÀN HÌNH PHỤC VỤ

| Màn (route thật) | Phục vụ việc gì | Thực thể chính |
| --- | --- | --- |
| `courses/[courseId]/learn/flashcards` | Không có giao diện, chỉ chuyển hướng sang `/review`. | — |
| `courses/[courseId]/learn/flashcards/review` | Trang chủ của việc học thẻ: khối đến hạn hôm nay, dải tiến độ thuộc bài, danh sách bộ thẻ, cùng hai tab Lịch sử và Thống kê. | Deck · UserFlashcardReview · StatsProjection |
| `courses/[courseId]/learn/flashcards/review/sessions/[sessionId]` | Bề mặt làm việc toàn màn của một lượt học thẻ đang chạy, dùng chung cho cả phiên một bộ lẫn phiên đến hạn. | ReviewSession · DueReviewSession · Card |
| `courses/[courseId]/learn/flashcards/review/sessions/[sessionId]/result` | Bảng tổng kết của một lượt học thẻ đã đóng. URL này luôn chỉ có nghĩa "xem kết quả". | ReviewSession · DueReviewSession |
| `courses/[courseId]/learn/flashcards/quiz` | Màn chuẩn bị Hỏi nhanh: đặt tên phiên, chọn chế độ và mức, kèm hai tab Lịch sử và Thống kê. | QuizSession |
| `courses/[courseId]/learn/flashcards/quiz/sessions/[sessionId]` | Bề mặt làm việc toàn màn của một lượt Hỏi nhanh đang chạy. | QuizSession · Card |
| `courses/[courseId]/learn/flashcards/quiz/sessions/[sessionId]/result` | Bảng tổng kết một lượt Hỏi nhanh đã đóng: độ phủ, XP, chủ đề yếu, gợi ý bài học. | QuizSession |
| `[locale]/review` | Trang ôn thẻ độc lập, không thuộc khóa nào: lấy hàng đợi đến hạn toàn hệ thống rồi đi từng thẻ. | UserFlashcardReview · Card |
| `[locale]/dashboard` | Có một ô nhắc nhỏ "thẻ đến hạn hôm nay" với nút dẫn sang `[locale]/review`. | UserFlashcardReview |

## 3. STATE PHẢI VẼ

| Vùng/màn | State | Điều kiện nghiệp vụ | Hình đổi gì |
| --- | --- | --- | --- |
| Mọi vùng có fetch | đang tải | SWR chưa có dữ liệu | Skeleton đúng hình khối thật, không phải spinner chung |
| Mọi vùng có fetch | lỗi | query trả lỗi và chưa có dữ liệu cache | Khối lỗi kèm nút Thử lại gọi `mutate()` |
| Danh sách bộ thẻ | rỗng | khóa chưa có bộ thẻ nào | Trạng thái rỗng "chưa có bộ thẻ", không hiện ô tìm kiếm |
| Danh sách bộ thẻ | tìm không ra | có bộ thẻ nhưng từ khóa không khớp | Giữ ô tìm kiếm, thay lưới bằng dòng "không thấy kết quả cho ..." |
| Danh sách bộ thẻ | chưa có courseId | Redux khóa chưa hydrate | Vẫn skeleton, không gọi query |
| Khối đến hạn hôm nay | rỗng | `dueCount === 0` | "Đã ôn hết hôm nay" thay cho nút bắt đầu |
| Khối đến hạn hôm nay | pha trộn | vừa có thẻ quá hạn vừa có thẻ mới | Thêm dòng phụ mờ phân rã "quá hạn X + mới Y"; nếu thuần một loại thì giấu dòng này |
| Khối đến hạn hôm nay | đang tạo phiên | bấm nút, chờ `startFlashcardDueReviewSession` | Nút vào trạng thái chờ và tự vẽ Spinner (HeroUI không tự hiện), người học vẫn đứng nguyên màn |
| Khối đến hạn hôm nay | có phiên dở dang | tồn tại phiên đến hạn `in_progress` đồng bộ trong 24 giờ | Thêm thẻ "Tiếp tục" phía trên, có thanh tiến độ `currentIndex+1 / tổng`, cách khối dưới bằng khoảng lớn |
| Dải tiến độ | lần đầu chưa có dữ liệu | tổng lượt ôn dưới 5 và chưa thuộc thẻ nào | Giấu tỉ lệ nhớ, thay bằng câu mời ôn thẻ đầu tiên |
| Dải tiến độ | đủ dữ liệu | tổng lượt ôn từ 5 trở lên | Hiện tỉ lệ nhớ dạng phần trăm ở dòng phụ |
| Dải tiến độ | có chuỗi ngày | chuỗi hiện tại lớn hơn 0 | Thêm chip chuỗi ngày bên cạnh tiêu đề |
| Modal chọn chế độ học | không còn thẻ đến hạn | `dueCount === 0` của bộ đó | Lựa chọn "chỉ thẻ đến hạn" bị vô hiệu và picker tự nhảy về "cả bộ" |
| Thẻ trong phiên học | chưa lật | mặc định mỗi thẻ | Chỉ mặt câu hỏi, nút chính "Xem đáp án" cộng hai nút mũi tên chỉ-icon |
| Thẻ trong phiên học | đã lật | người học bấm xem đáp án | Hiện đáp án cùng phần giải thích, thay cụm nút bằng thanh bốn mức Again/Hard/Good/Easy |
| Thẻ trong phiên học | thẻ khóa | thẻ `isPremium` và người xem chưa ghi danh | Mặt sau thay bằng ổ khóa cộng lời nhắc, thanh chấm điểm bị thay bằng nút mời ghi danh |
| Thẻ trong phiên học | thiếu đáp án | thẻ cũ chưa migrate, `answer` rỗng | Mặt sau ghi dòng mờ "chưa có đáp án", vẫn cho chấm bình thường |
| Thẻ trong phiên học | đang gửi mức nhớ | mutation `reviewFlashcard` đang bay | Thanh bốn mức vào trạng thái chờ, chặn bấm lần hai |
| Phiên học/hỏi nhanh | chưa biết trạng thái | vào thẳng URL phiên, query trạng thái chưa xong | Giữ nguyên skeleton, tuyệt đối không dựng bề mặt sống |
| Phiên học/hỏi nhanh | đã đóng | `status` là `completed` hoặc `abandoned` | Tự chuyển hướng thay-thế sang route `/result`, không vẽ kết quả tại URL sống |
| Phiên học/hỏi nhanh | không tìm thấy | id sai hoặc không thuộc về người gọi | Rơi vào nhánh rỗng của màn kết quả |
| Phiên hỏi nhanh | hết thẻ sau khi lọc | tập thẻ đã lưu không còn thẻ nào tồn tại | Trạng thái rỗng kèm nút quay về màn chuẩn bị |
| Phiên hỏi nhanh | sắp hết giờ | còn dưới 5 phút trong khung 60 phút | Đồng hồ đếm ngược đổi sang màu cảnh báo |
| Phiên hỏi nhanh | thẻ dở dang sắp hết hạn | phiên còn dưới 15 phút | Thẻ "Tiếp tục" bật cờ khẩn |
| Phiên hỏi nhanh | quá hạn phiên | quá 60 phút kể từ lúc bốc | Không còn được đề nghị tiếp tục nữa, coi như đã bỏ |
| Tab Hỏi nhanh | học thử | người xem chưa ghi danh khóa | Toàn bộ tab thay bằng cổng mời ghi danh, không dựng màn chuẩn bị |
| Màn kết quả hỏi nhanh | học thử | người xem chưa ghi danh | Chèn thêm khối mời ghi danh mở overlay thanh toán |
| Lịch sử / Thống kê | rỗng | chưa có phiên nào đóng | Trạng thái rỗng nằm trong khung của tab, kèm nút quay về tab Ôn tập |
| Ô nhắc ở dashboard | rỗng hoặc lỗi | không có thẻ đến hạn, hoặc query hỏng | Ô tự ẩn hoàn toàn, không vẽ khung lỗi |
| Mọi màn flashcard | chưa đăng nhập | mọi query của miền đều sau cổng đăng nhập | Không có màn riêng, người dùng bị chặn ở tầng route học |

## 4. LUẬT NGHIỆP VỤ ĐÁNG NHỚ

- Số "đến hạn" là tổng của hai rổ khác nhau về bản chất: thẻ đã học và quá hạn, cộng thẻ hoàn toàn mới nhưng bị chặn ở 20 thẻ mỗi ngày. Người dựng UI phải giữ dòng phân rã, nếu không người học sẽ không hiểu con số ở đâu ra (`src/modules/bussiness/flashcard/flashcard-review.service.ts:68`, `:160-176`).
- Thẻ chưa từng ôn không có dòng lịch nào và được coi là đến hạn ngay. Đừng chờ dữ liệu SM-2 mới vẽ (`src/modules/databases/postgresql/primary/entities/user-flashcard-review.entity.ts:26`).
- "Đã thuộc" nghĩa là số lần nhớ liên tiếp từ 2 trở lên, không phải "đã xem qua" (`src/modules/databases/postgresql/primary/entities/flashcard-deck.entity.ts:255`).
- Chấm mức nhớ có thể chạy khi người học chưa mua khóa: server tự tạo lượt ghi danh thử. Đừng chặn nút chấm bằng trạng thái ghi danh (`src/modules/bussiness/flashcard/flashcard-review.service.ts:494-501`).
- XP chỉ cộng ở lần đầu tiên chạm một thẻ, mỗi thẻ 2 XP; ôn lại lần sau cộng 0. Màn không được hứa XP cho mọi lượt chấm (`src/modules/bussiness/flashcard/flashcard-review.service.ts:57`, `:530`).
- Hỏi nhanh trần 15 XP một phiên và trần 60 XP một ngày theo giờ Việt Nam cho mỗi cặp người-khóa. Chơi lại nhiều lần vẫn có thể nhận 0 XP, màn kết quả phải chịu được con số 0 (`src/modules/bussiness/flashcard/flashcard-quiz-session.service.ts:42`, `:53`, `:220`).
- Điểm hỏi nhanh do server tự tính lại từ tập trả lời gửi lên, không lấy con số client. Ước lượng XP hiện trong lúc chơi chỉ là tạm, kết quả cuối có thể khác (`src/modules/bussiness/flashcard/flashcard-quiz-session.service.ts:122-133`).
- Mỗi người chỉ có đúng một phiên dở dang cho mỗi loại: bắt đầu phiên mới sẽ tự đẩy phiên cũ sang bỏ dở. UI không được vẽ hai thẻ "Tiếp tục" cùng lúc (`src/modules/bussiness/flashcard/flashcard-quiz-session.service.ts:176`, `flashcard-review-session.service.ts:177-192`).
- Phiên quá hạn không được cron dọn, mà suy ra lúc đọc: hỏi nhanh sống 60 phút kể từ lúc bốc, còn phiên học thẻ chỉ được đề nghị tiếp nếu đồng bộ trong 24 giờ. Một phiên hết hạn vẫn mang trạng thái `in_progress` trong cơ sở dữ liệu (`src/modules/databases/postgresql/primary/entities/flashcard-quiz-session.entity.ts:28`, `flashcard-review-session.service.ts:43`).
- Tập thẻ được chốt một lần lúc bắt đầu phiên và không bốc lại khi tiếp tục, nên bộ thẻ đổi giữa chừng cũng không làm phiên đang chạy đổi theo (`src/modules/databases/postgresql/primary/entities/flashcard-review-session.entity.ts:99-104`).
- Vị trí đã chấm được lưu thành tập chỉ số chứ không chỉ là một con số đếm, vì người học được đi lui đi tới tự do. Thanh tiến độ phải tô theo từng đoạn, không tô liền từ trái (`src/modules/databases/postgresql/primary/entities/flashcard-review-session.entity.ts:111-119`).
- Trả lời "đã xong hay chưa" là việc của URL, không phải của suy luận trên client. Từ URL sống mà trạng thái không còn `in_progress` thì phải chuyển hướng sang `/result` (`src/components/features/learn/Flashcards/index.tsx:154-182` ở repo FE).
- Phiên học một bộ và phiên ôn đến hạn là hai bảng khác nhau ở backend nhưng dùng CHUNG một URL sống; màn tự hỏi backend xem id đó thuộc loại nào rồi mới quyết định dựng bộ nào (`src/components/features/learn/Flashcards/index.tsx:304-313` ở repo FE).
- Thẻ premium giấu đáp án chứ không giấu thẻ: câu hỏi vẫn hiện, chỉ mặt sau bị thay bằng khối khóa. Khoảng 20% thẻ đầu mỗi bộ là miễn phí (`src/modules/databases/postgresql/primary/entities/flashcard-card.entity.ts:184-189`).
