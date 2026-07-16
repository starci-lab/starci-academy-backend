# Feature — Landing
> Trang chủ công khai — narrative cuộn 8 nhịp (hero → proof → learn-loop → track → knowledge-graph → founder → talent → FAQ → closing). Nguồn: `features/landing/Landing`.

- **Job**: chuyển khách lạ thành người xem khóa/đăng ký qua 1 câu chuyện cuộn dài → shell [[marketing-landing]] (đúng archetype đặt tên theo route này).
- **CTA**: 1 CTA nhất quán lặp lại NHIỀU điểm cuộn (hero · treasure · closing) đều scroll tới CÙNG anchor `#courses` — 1 đích chuyển đổi duy nhất, không phân tán; secondary "Đăng nhập" chỉ ở hero. FAB "lên đầu trang" chỉ hiện sau khi cuộn qua fold đầu. → [[call-to-action]]
- **Links (onward)**: anchor nav (`#stats #courses #treasure #founder #faq`); `TrackCard` "Vào khóa" route tới SLUG khóa THẬT (`LANDING_TRACK_COURSE_SLUG`, không phải catalog chung); byline founder link ra blog/GitHub/LinkedIn/Facebook thật. → [[content-linking]]
- **Psychology** (marketing-nặng, ground theo code thật):
  - **Social proof**: `StatStrip` — 4 counter đếm-lên từ query `platformStats` THẬT khi cuộn tới (không phải hard-code).
  - **Authority**: beat founder — "uncomfortable truths" gắn với mechanism thật + byline có link GitHub/LinkedIn/blog thật ("đừng tin, đi mà kiểm" — tự-xác-thực thay vì tuyên bố suông).
  - **Curiosity/tương tác**: `KnowledgeGraph` — ~38 node khái niệm thật (d3-force), click → khóa chứa nó, dramatize độ sâu kiến thức.
  - **2 chiều thị trường**: `TalentMarketplace` ghép 1 `SampleCandidateCard` MINH HOẠ (rõ nhãn, không phải user thật) với `TalentDirectory` thật ở feature khác — kể cả hai vai (kỹ sư đạt chuẩn / nhà tuyển dụng browse). → [[persuasion-psychology]]
- **Ghi chú**: `StatStrip` có `FALLBACK_STATS = 99` cho MỌI số khi query lỗi (chủ đích: "không để proof-strip biến mất") — cần cẩn thận nếu số thật hiện đang THẤP HƠN 99, vì fallback lúc đó vô tình PHỒNG số lên, hơi lệch tinh thần honesty của [[fair-monetization-axiom]] dù chỉ xảy ra ở trạng thái lỗi.
