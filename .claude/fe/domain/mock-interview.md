# PHỎNG VẤN THỬ (MOCK INTERVIEW)

> Miền này cho người học ngồi vào một buổi phỏng vấn giả lập với người phỏng vấn AI, trả lời bằng giọng nói hoặc gõ chữ, rồi nhận một bảng điểm chấm bởi AI dựa trên đáp án mẫu do biên tập viên viết sẵn.

## 1. THỰC THỂ

| Thực thể | Là gì | Trạng thái thật (enum) |
| --- | --- | --- |
| Câu hỏi phỏng vấn (`mock_interviews`) | Một câu hỏi đã soạn sẵn trong ngân hàng đề, kèm đáp án mẫu, gợi ý và câu hỏi đào sâu. Câu kỹ thuật neo vào khoá/module, câu EQ dùng chung toàn hệ thống. | Không có enum. `family` là varchar (`technical` \| `behavioral`), `kind` và `tier` cũng varchar — xem §4. |
| Checkpoint chấm điểm (`mock_interview_checklists`) | Một ý mà câu trả lời đầy đủ phải chạm tới; điểm của cả câu là tổng điểm các checkpoint chạm được. | Không có trạng thái. `dimension` varchar: `technical` \| `problemSolving` \| `communication` \| `testing`. |
| Biến thể ngôn ngữ (`mock_interview_langs`) | Với câu có code cho sẵn, mỗi ngôn ngữ lập trình là một biến thể riêng của đề và đáp án. | Không có trạng thái. |
| Phiên phỏng vấn (`mock_interview_sessions`) | Một lượt bốc đề của server, giữ transcript đang dang dở để người học quay lại làm tiếp. | `status`: `in_progress` \| `completed` \| `abandoned` (mock-interview-session.entity.ts:282). Ngoài ra `mode`: `qna` \| `design`; `difficulty`: `easy`/`medium`/`hard`; `source`: `capstone`/`classic`; `level`: `junior`/`middle`/`senior` — đều là varchar, không phải enum DB. |
| Lượt đã chấm (`mock_interview_attempts`) | Bảng điểm đóng băng của một phiên đã chấm xong: điểm tổng, kết luận, điểm từng pha, điểm mạnh, lỗ hổng, và phần đối chiếu đáp án từng câu. | `verdict`: `pass` \| `borderline` \| `fail` (`MockInterviewVerdict`, mock-interview-grade.ts:17). |
| Khung nhận thức mỗi câu | Cách người phỏng vấn đóng khung một câu hỏi Q&A, bốc ngẫu nhiên lúc rút đề. | `MockInterviewKind`: `theory` \| `reasoning` \| `scenario` (enums/mock-interview-kind.ts). |
| Pha thiết kế hệ thống | Năm chặng cố định của luồng `design`. | `MockInterviewPhase`: `requirements` \| `estimation` \| `highLevel` \| `deepDive` \| `tradeoffs` (enums/mock-interview-phase.ts). |
| Thống kê theo khoá | Bản chiếu sẵn số liệu phỏng vấn của một người trong một khoá: xu hướng, chia theo pha, điểm yếu nhất. | Không có trạng thái; có cờ `insufficientData` trong payload. |

## 2. MÀN HÌNH PHỤC VỤ

| Màn (route thật) | Phục vụ việc gì | Thực thể chính |
| --- | --- | --- |
| `/[locale]/courses/[courseId]/learn/mock-interview` | Phòng chờ: chọn mức, cấu hình phiên, xem lịch sử và thống kê, và bấm vào phòng. Ba tab `Bắt đầu` / `Lịch sử` / `Thống kê`, nhớ qua `?tab=`. | Phiên (thẻ làm tiếp), Lượt đã chấm, Thống kê |
| `.../learn/mock-interview/interview/[sessionId]` | Bề mặt phỏng vấn trực tiếp, tràn viền, hai cột: hội thoại bên trái, bàn làm việc (code hoặc bảng vẽ) bên phải. URL này chính là chỗ quay lại làm tiếp. | Phiên |
| `.../learn/mock-interview/interview/[sessionId]/result` | Bảng điểm chỉ đọc của một lượt đã chấm. Chính route này trả lời câu hỏi "phiên đã xong chưa", không suy ra từ state phía client. | Lượt đã chấm |

## 3. STATE PHẢI VẼ

| Vùng/màn | State | Điều kiện nghiệp vụ | Hình đổi gì |
| --- | --- | --- | --- |
| Cả miền | Chưa đăng nhập | `authenticated === false`, truy vấn ghi danh không chạy | Bỏ skeleton ngay lập tức, hiện thẳng thẻ mở khoá `EnrollGate` |
| Cả miền | Đang kiểm tra ghi danh | Truy vấn ghi danh chưa trả về | `MockInterviewSetupSkeleton` ở phòng chờ, `MockInterviewSessionSkeleton` ở màn live/kết quả |
| Cả miền | Học thử, chưa mua | `isEnrolled !== true` | `EnrollGate`: bản xem trước hai thẻ câu hỏi giả mờ dần phía sau, thẻ giá + nút ghi danh nổi phía trước |
| Phòng chờ | Có phiên làm dở | Server còn phiên `in_progress`, sync trong 24h và chưa quá 1 giờ kể từ lúc bốc | Thêm `ContinueCard` biến thể hero trên cùng, có thanh tiến độ câu/pha; nút "Vào phòng" bên dưới tụt từ primary xuống secondary |
| Phòng chờ | Phiên làm dở đã hết giờ | `deadlineAt` đã qua nhưng thẻ vẫn hiện | Cùng `ContinueCard` nhưng bật cờ `urgent`, đổi phụ đề sang bản "đã hết giờ" và đổi nhãn nút — không giấu thẻ đi |
| Phòng chờ | Còn dưới 15 phút | Phút còn lại ≤ 15 | `ContinueCard` bật `urgent` (viền/màu cảnh báo), phụ đề ghi số phút thật |
| Phòng chờ | Đang bốc đề | Bấm một trong hai nút vào phòng | Đúng nút được bấm hiện `Spinner` thay icon, nút còn lại bị vô hiệu |
| Phòng chờ | Bốc đề hỏng | Server trả lỗi hoặc ngân hàng đề trống | `Callout status="danger"` cuối màn, có nút đóng; mọi lựa chọn mức/model giữ nguyên |
| Phòng chờ | Khoá không phải System Design | `courseDisplayId` không chứa `system-design` | Ẩn hẳn nút "Luyện thiết kế hệ thống", chỉ còn một nút vào phòng |
| Phòng chờ | Ô cấu hình đóng (mặc định) | `configOpen === false` | Chỉ còn một dòng nút mũi tên "Tuỳ chỉnh phiên"; toàn bộ thẻ cấu hình biến mất |
| Phòng chờ | Chế độ Tuỳ chỉnh | `configMode === "configurable"` | Hiện thêm một khối viền trong thẻ cấu hình: Số câu, Kiểu câu, Cách trả lời; nhãn "tự động" ở góc thẻ tắt đi |
| Phòng chờ | Chưa mở khoá model cao cấp | `canPremium === false` | Ô chọn model chấm vẫn liệt kê các model cao cấp nhưng khoá lại và mở đường sang trang gói AI |
| Ảnh chụp năng lực | Lần đầu, chưa có dữ liệu | Chưa có track khoá này, hoặc `interviewScore === null` | Ẩn hoàn toàn khối (không để lại khung rỗng) |
| Ảnh chụp năng lực | Đang tải | Truy vấn readiness chưa xong | Một dải skeleton (một dòng chữ + một chip) đúng chỗ khối sẽ hiện, tránh nhảy layout |
| Tab Lịch sử | Đang tải | Chưa có dòng nào và đang fetch | Skeleton mô phỏng đúng cây thật: thanh tìm kiếm + nút phễu + 4 dòng danh sách |
| Tab Lịch sử | Lỗi | Fetch hỏng và danh sách rỗng | Khối lỗi kèm nút thử lại; nếu đã có dòng cũ thì giữ danh sách, không nuốt mất |
| Tab Lịch sử | Chưa có lượt nào | `items.length === 0` | Một thẻ `EmptyState` có nút "Bắt đầu" nhảy về tab Bắt đầu |
| Tab Lịch sử | Lọc/tìm không ra | Có dữ liệu nhưng `filteredItems` rỗng | Giữ nguyên thanh công cụ, thay danh sách bằng thẻ chữ mờ căn giữa |
| Tab Lịch sử | Chỉ có một kiểu phiên | Lịch sử chỉ toàn `qna` hoặc chỉ toàn `design` | Ẩn luôn nút phễu lọc, chỉ còn ô tìm kiếm và số đếm |
| Tab Lịch sử | Kết luận từng dòng | `verdict` = pass/borderline/fail | Chip điểm đổi màu success / warning / danger |
| Tab Lịch sử | Còn trang sau | `items.length < totalCount` | Thêm nút "Tải thêm" căn giữa, bị vô hiệu khi đang tải |
| Tab Thống kê | Chưa đủ dữ liệu | `insufficientData === true` hoặc chưa có payload | `EmptyState` biểu đồ + nút "Bắt đầu"; không vẽ biểu đồ rỗng |
| Tab Thống kê | Chưa có chia theo pha | `byPhase` rỗng | Ẩn khối chia theo pha và cả gợi ý học suy ra từ nó |
| Tab Thống kê | Đủ dữ liệu | Có `trend`/`byPhase` | `VerdictHeroCard` với dải màu theo điểm trung bình, meter có vạch đích, và nút "luyện thêm N phiên" khi chưa đạt |
| Màn live | Đang khôi phục phiên | Vào bằng URL `[sessionId]` mà chưa rehydrate xong | `MockInterviewSessionSkeleton` — tuyệt đối không nháy qua màn phòng chờ |
| Màn live | Người phỏng vấn đang hỏi, chưa có chữ | `isAsking` và `streamingText` rỗng | Trong bong bóng người phỏng vấn chỉ có `Spinner`; chấm "đang nói" ở avatar đập nhịp |
| Màn live | Đang chảy chữ | `isAsking` và có `streamingText` | Bong bóng render markdown thô, chữ tăng dần |
| Màn live | Chưa có câu hỏi nào | Không `isAsking`, chưa có lượt của câu hiện tại | Dòng chữ mờ chờ đợi thay cho nội dung câu hỏi |
| Màn live | Chưa nhập gì / đang hỏi | `answerDraft` rỗng hoặc `isAsking` | Nút "Trả lời và câu tiếp" bị vô hiệu; nhãn đổi thành "trả lời và kết thúc" ở câu cuối |
| Màn live | Trình duyệt không có nhận giọng nói | `sttSupported === false` | Ép về ô gõ chữ, giấu mic và giấu luôn nút chuyển đổi |
| Màn live | Đang nghe | `listening === true` | Nút mic đổi trạng thái nhấn, nhãn thành "Đang nghe…", chữ tạm nghe được hiện ngay dưới |
| Màn live | Thiếu giọng đọc cho ngôn ngữ | TTS không có voice khớp locale | Mở `VoiceUnavailableModal` đúng một lần cho mỗi phiên; đã tắt là không hiện lại |
| Màn live | Sắp hết giờ | Còn ≤ 5 phút tới `deadlineAt` | Đồng hồ đếm ngược trên thanh đầu đổi sang màu cảnh báo |
| Màn live | Hết giờ | Đồng hồ về 0, hoặc lượt hỏi trả về `SESSION_EXPIRED` | Tự động chuyển sang màn Chấm đúng một lần, kèm `Callout` cảnh báo "hết giờ" |
| Màn live | Câu không cần công cụ | Câu lý thuyết/suy luận, không có code cho sẵn, không phải mode design | Cột phải vẫn còn nguyên nhưng render `EmptyState`, không mở bảng vẽ trắng |
| Màn live | Câu có công cụ | Mode design, hoặc câu có `givenCodes` | Cột phải render thẳng bảng vẽ hoặc trình soạn code đã nạp sẵn code; giữ mount qua các câu để không mất bản nháp |
| Màn live | Câu code có nhiều ngôn ngữ | `givenCodes` nhiều biến thể | Trình soạn mở ở TypeScript nếu có, không thì ngôn ngữ đầu tiên được soạn; không nhớ lựa chọn của phiên trước |
| Màn live | Luồng thiết kế hệ thống | `mode === "design"` | Cột trái thêm danh sách năm pha làm thanh trạng thái, bộ đếm trên thanh đầu đếm pha thay vì đếm câu; cột phải luôn là bảng vẽ |
| Màn live | Xác nhận rời phòng / kết thúc sớm | Bấm "Thoát" hoặc "Kết thúc" | Modal xác nhận: rời phòng dùng nút `danger`, kết thúc để chấm dùng nút `primary` |
| Màn live | Đồng bộ transcript hỏng | Mutation sync lỗi | Chỉ hiện toast lỗi, buổi phỏng vấn không dừng |
| Màn chấm | Đang chấm | Vừa gửi bài | Giữ nguyên thanh đầu của buổi phỏng vấn, thân màn là thẻ avatar + spinner + dòng chờ |
| Màn chấm | Hết hạn mức AI | Chấm hỏng và truy vấn quota tươi cho thấy hết credit | `Callout status="warning"` riêng, kèm nút chuyển sang trang gói AI — không dùng khối lỗi đỏ chung |
| Màn chấm | Lỗi chấm khác (kể cả bài quá ngắn) | Server trả lỗi và quota vẫn còn | `Callout status="danger"` ngay trên khu hội thoại; transcript giữ nguyên để gửi lại |
| Màn kết quả | Đang tải | Chưa có lượt chấm | Ba `Skeleton.Card` đúng khung thật: kết luận, ảnh chụp năng lực, chia theo pha |
| Màn kết quả | Không tìm thấy lượt chấm | Truy vấn xong nhưng rỗng | `EmptyState` "bảng điểm chưa sẵn sàng" + nút về phòng chờ |
| Màn kết quả | Kết luận | `verdict` pass/borderline/fail | `Alert` đổi màu và icon theo ba mức, có lớp tint riêng |
| Màn kết quả | Bảng điểm của phiên thiết kế | Mọi `phaseScores[].phase` đều thuộc năm pha chuẩn | Nhãn từng thanh điểm đọc theo tên pha; phiên Q&A thì cùng chỗ đó đọc theo số thứ tự câu |
| Màn kết quả | Không có đối chiếu đáp án | `questionReviews` rỗng (luôn rỗng với mode design) | Ẩn hẳn khối đối chiếu đáp án từng câu |
| Màn kết quả | Không tìm được bài học liên quan | `matchedContentIds` rỗng, hoặc không giải được module | Không dựng link sâu; lùi về nút chung "ôn lại khoá học", tuyệt đối không bịa link |
| Màn kết quả | Thiếu điểm mạnh / lỗ hổng / câu đào sâu | Mảng rỗng hoặc null | Ẩn từng khối tương ứng, không để tiêu đề trống |

## 4. LUẬT NGHIỆP VỤ ĐÁNG NHỚ

- Chấm điểm chạy nền và chấm CẢ PHIÊN một lần ở cuối, không chấm từng câu; màn phải chịu được quãng chờ này bằng một pha `grading` riêng giữ nguyên thanh đầu, chứ không nhảy về màn khác. `MockInterviewSession/index.tsx:1766`.
- Một phiên có hạn một giờ tính từ lúc server bốc đề. Đồng hồ trên màn phải suy ra từ `deadlineAt` server trả về, không được tự đếm từ lúc mount. `mock-interview-session.entity.ts:27`, `mock-interview.gateway.ts:216`.
- Hết giờ không do cron lật trạng thái mà suy ra lúc đọc. Một phiên `in_progress` quá hạn vẫn nằm trong DB nhưng bị loại khỏi danh sách làm tiếp, nên FE phải chịu được cả hai kiểu hiện. `my-in-progress-mock-interview-session.service.ts:71`, `mock-interview-session.entity.ts:268`.
- Chỉ được làm tiếp phiên sync trong 24 giờ gần nhất. Ngoài cửa sổ đó thẻ "làm tiếp" biến mất dù trạng thái vẫn `in_progress`. `my-in-progress-mock-interview-session.service.ts:30`.
- Mỗi người một lúc chỉ có một phiên làm tiếp được. Bốc đề mới sẽ tự lật phiên cũ sang `abandoned`, nên đừng dựng UI cho hai thẻ làm tiếp song song. `mock-interview-session.entity.ts:257`.
- Server chặn bài quá ngắn TRƯỚC khi trừ credit: tổng chữ của thí sinh dưới 100 ký tự là ném lỗi, không tạo lượt chấm nào. Đây là lỗi thường gặp nhất khi bấm qua loa, và nó hiện ra như một lỗi chấm bình thường. `grade-mock-interview-session-grading.service.ts:123` và `:235`.
- Hết hạn mức AI phải phân biệt với lỗi chấm thường. FE gọi lại truy vấn quota ngay sau khi chấm hỏng rồi mới quyết định hiện khối nâng cấp gói hay khối lỗi đỏ — không đoán bằng cách khớp chuỗi thông báo. `MockInterviewSession/index.tsx:1173`.
- Phiên "Tuỳ chỉnh" KHÔNG tính vào chỉ số sẵn sàng đi làm, chỉ phiên "Tự động" và mọi phiên design mới tính. Nếu màn hình khoe điểm sẵn sàng thì phải nói rõ điều này, kẻo người học tưởng luyện kiểu gì cũng lên điểm. `mock-interview-session.entity.ts:232`, `MockInterviewSession/index.tsx:830`.
- Đề của ngân hàng câu hỏi được đọc thẳng, không gọi AI để đặt lại câu; chỉ phiên gieo từ flashcard mới có AI dựng câu theo thời gian thực. Vì vậy có phiên hiện câu hỏi tức thì, có phiên chảy chữ dần — hai nhịp khác nhau trên cùng một bề mặt. `MockInterviewSession/index.tsx:212`.
- Việc rút đề không bao giờ bí: nếu không đủ câu ở module đã học và đúng mức, server nới dần sang mọi mức rồi mọi module. Chỉ khi khoá không có một câu nào mới báo lỗi. `start-mock-interview-session-draw.service.ts:480` và `:501`.
- Đề chỉ lộ ra sau khi bấm vào phòng, giống thi thật. Màn phòng chờ không được hiện trước tên đề hay nội dung câu hỏi. `MockInterviewSession/index.tsx:410`.
- Chọn nhiều ngôn ngữ lập trình chỉ ảnh hưởng câu có code cho sẵn, và không bao giờ được để trống — bỏ chọn cái cuối cùng là thao tác không có tác dụng. `MockInterviewSession/index.tsx:389`.
- Tên phiên là tuỳ chọn; khi để trống, chính FE dựng nhãn theo thời gian, server không bao giờ tự đặt tên. `mock-interview-session.entity.ts:327`.
- Lịch sử và thống kê phải giữ mount khi chuyển tab, đừng render có điều kiện — trước đây đổi tab là mất sạch danh sách đã tải. `MockInterviewSession/index.tsx:1477`.
