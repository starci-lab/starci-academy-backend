<!-- starci-workflow: v2 -->
# Học từ vựng và ngữ pháp MiaMia

## plan r1

### CONTEXT

| Field | Value |
|---|---|
| Workdir | D:\Repositories\miamia-fe |
| Source | D:\Repositories\starci-academy-backend |
| Project | MiaMia |
| Frontend | D:\Repositories\miamia-fe |
| Backend | D:\Repositories\mia-mia-backend |
| Trust | D:\Repositories\starci-academy-backend\.claude |
| Skills | D:\Repositories\starci-academy-backend\.claude\skills |
| App | miamia |
| Repo / branch | D:\Repositories\miamia-fe @ codex/miamia-thi-thu |
| Purpose | Lập brief và proposal UX cho trụ Học từ vựng và Học ngữ pháp; checkout không thuộc scope này. |
| Workflow root | D:\Repositories\starci-academy-backend\.workflows |
| Workflow | D:\Repositories\starci-academy-backend\.workflows\designs\miamia\hoc-tu-vung-ngu-phap.md |
| Language | vi |
| Phase | plan |
| Touching | Workflow này và `.workflows/.previews/designs/miamia/hoc-tu-vung-ngu-phap/r1/index.html`; không sửa production source. |

### BRIEF

**Mode:** creative. MiaMia chưa có màn học production được duyệt. StarCi FE là authority về pattern, contracts, surface ownership, button và responsive shell; MiaMia chỉ override semantic theme trong `globals.css`.

**Page thesis:** Học sinh mở `Học & ôn tập`, chọn đúng thứ mình muốn học mà không bị kho nội dung làm ngợp, hiểu một đơn vị nhỏ rồi luyện ngay; từ vựng được ghi độ thuộc, ngữ pháp chỉ hứa trạng thái backend thật sự phục vụ.

**Core loop từ vựng:** `chọn chủ đề → đọc cụm từ/ngữ cảnh → luyện meaning → phrase → ghi kết quả → ôn lại đến khi đúng liên tiếp 3 lần`.

**Core loop ngữ pháp đề xuất:** `chọn chủ đề → đọc công thức/giải thích/ví dụ/mẹo → checkpoint → quay lại`. Hiện backend chỉ có seed và RAG retrieval cho grammar, chưa có catalogue/detail/checkpoint/mastery GraphQL; Apply FE không được giả lập vòng kín này.

**Shell:** giữ `MiaMiaAppLayout`; desktop dùng sidebar, mobile chuyển thành footbar 5 mục. `Học & ôn tập` là một destination, Từ vựng/Ngữ pháp/Ôn tập là navigation cục bộ bên trong surface.

### EVIDENCE

| Claim | Best-belief source | Quan sát | Hệ quả thiết kế |
|---|---|---|---|
| Học gồm cụm từ và ngữ pháp | `D:\Repositories\mia-mia-backend\biz.md` A1/B1 | Hai trụ nội dung dùng chung lõi; học mở cho Free và Pro | Không gắn paywall lên catalogue/lesson học |
| Vocab có catalogue/detail thật | `learnTopics`, `topicDetail`, `LearnService` | Topic trả level, tên, mô tả, phraseCount; phrase trả text, meaning, example, audioKey, contextNote | Có thể xây thư viện và bài học vocab không bịa dữ liệu |
| Vocab có practice/mastery thật | `phrasePractice`, `recordPractice`, `PracticeService` | Meaning → chọn phrase; 3 lần đúng liên tiếp thành thuộc; sai reset; completion ghi XP/Points | Preview cho phép feedback tức thì và kết quả session |
| Có hàng học tiếp | `continueLearning` | Trả topic, paper và reviewPhrase có thể null | Tổng quan có thể đặt CTA tiếp tục/ôn đến hạn, không tự suy lịch grammar |
| Grammar đã seed nhưng chưa expose lesson API | `grammar_topics.csv`, `grammar_notes.csv`, entities; không có resolver tương ứng | 8 chủ đề, 11 note; có formula, examples, explanation, tip; tìm GraphQL không thấy catalogue/detail/practice/mastery | Mọi grammar lesson trong preview là proposal cần Backend Plan trước Apply |
| RAG có grammar suggestion cho Pro | `suggestStudy` | Trả noteId, topicSlug, title, formula, explanation; Free không include grammar | Không dùng RAG thay catalogue; không gọi suggestion là lesson library |
| Source FE có pattern học tái sử dụng | routes flashcards/foundations, contract registry | Có page, session, result, catalogue, tabs, `LearnSpine`, surface/card/button primitives | Review phải REUSE/EXTEND các pattern này, không tạo design system song song |
| MiaMia theme chỉ ở global CSS | `D:\Repositories\miamia-fe\src\app\globals.css` | Semantic token đổi identity; contracts/components không ghi màu brand | Apply không hardcode màu vào JSX/contracts |

### CONTENT SNAPSHOT

| Corpus | Live seed | Ví dụ |
|---|---:|---|
| Vocabulary topics | 10 | `ordering-food`, `small-talk`, `travel-airport` |
| Phrases | 100 | `Could I get a table for two?` kèm nghĩa, ví dụ, context note |
| Grammar topics | 8 | `verb-tenses`, `conditionals`, `relative-clauses` |
| Grammar notes | 11 | formula, examples, explanation và tip song ngữ |

### CONTRACT INVENTORY

| Candidate | Verdict | Boundary |
|---|---|---|
| `MiaMiaAppLayout` + desktop sidebar/mobile footbar | REUSE/EXTEND | Mở khóa destination `study`; giữ một shell duy nhất |
| `LearnSpine` và local mode tabs | REUSE/EXTEND | Dùng cho taxonomy nội bộ nếu Review chứng minh cần; không dựng sidebar thứ hai trên mobile |
| `SurfaceCard`, `SurfaceListCard`, `PressableSurface`, button/badge/progress leaves | REUSE | Không tạo primitive MiaMia riêng; màu đi qua token `globals.css` |
| Flashcard catalogue/session/result patterns | REUSE/EXTEND | Shape gần nhất cho vocab topic, practice và kết quả; đổi domain props theo GraphQL MiaMia |
| Foundation category/resource patterns | REUSE/EXTEND | Shape gần nhất cho grammar catalogue và lesson markdown-like |
| MiaMia learn GraphQL adapters/hooks | NEW | Chỉ query/mutation wrappers cho contract backend hiện hữu |
| Grammar catalogue/detail GraphQL | NEW — backend-owned | Cần Backend Plan/Review/Apply trước khi FE production hóa lesson |
| Grammar checkpoint/mastery | NEW — chưa duyệt | Không thuộc FE Apply nếu chưa có product/backend decision |
| Taxonomy nối vocab topic ↔ grammar topic | NEW — chỉ hướng C | Không tồn tại trong seed hiện tại |

### DIRECTION ANALYSIS

| Direction | Product model | Điểm mạnh | Trade-off |
|---|---|---|---|
| A · Học hôm nay | Một queue cá nhân trộn ôn từ, chủ đề đang dở và grammar bite | CTA rất rõ, tốt cho retention | Grammar queue/progress chưa có contract; cần backend nhiều nhất |
| B · Hai thư viện rõ ràng — khuyến nghị | Từ vựng, Ngữ pháp và Ôn tập là ba tab ngang hàng | Khớp backend; vocab ship trước, grammar mở dần mà không đổi mental model | Ít “game hóa” hơn A; cần giữ CTA ôn từ nổi bật |
| C · Chủ đề kép | Một collection chứa vocab + grammar + mixed practice | Học theo mục tiêu/tình huống, dễ kể câu chuyện sản phẩm | Hai taxonomy hiện không nối nhau; mixed practice chưa có contract |

### DIRECTION TABS

| Direction | Tab | Status |
|---|---|---|
| A | Học hôm nay | Đang chờ chọn |
| B | Hai thư viện | Khuyến nghị; đang chờ chọn |
| C | Chủ đề kép | Đang chờ chọn |

### PREVIEW TRACKING

| Preview | URL | HTML | SHA-256 | Status |
|---|---|---|---|---|
| r1 | http://127.0.0.1:8102/ | .workflows/.previews/designs/miamia/hoc-tu-vung-ngu-phap/r1/index.html | 1376344e8f3e435bf0598288ae9dd4608ae9438f0db8b3c7d33a9fc325b1cecd | Chờ thầy chọn A/B/C |

### ACCEPTANCE STATES

| Surface | Trạng thái phải review |
|---|---|
| Tổng quan học | anonymous/authenticated; có/không `continueLearning`; có/không reviewPhrase |
| Vocabulary catalogue | loading, ready, empty, failed; filter level/progress chỉ khi dữ liệu hỗ trợ |
| Vocabulary topic | loading, ready, empty, failed; audio absent/present |
| Phrase practice | unanswered, selected, feedback correct/wrong, submitting, recorded, failed |
| Grammar catalogue/lesson | loading, ready, empty, failed sau khi backend contract tồn tại |
| Responsive shell | sidebar desktop; footbar mobile; không overflow; một primary CTA/surface |

### PREVIEW PROOF

| Check | Kết quả |
|---|---|
| Direction tabs | A, B, C đều đổi thesis và nội dung đúng |
| State tabs | `Tổng quan`, `Thư viện`, `Bài học`, `Luyện tập` đều render trong từng direction; tổng cộng 12 tổ hợp |
| Desktop overflow | 12/12 tổ hợp không có horizontal overflow tại viewport browser đang mở |
| Runtime | Lỗi template-string ở lần tải đầu đã được sửa; lần tải lại tạo đủ 3 direction tabs, 4 state tabs và surface có nội dung |
| Visual | Đã chụp và kiểm tra hướng B/Tổng quan: hierarchy, sidebar, CTA, cards và gap badge đọc rõ |

### OUTPUTS

| Concept | Result |
|---|---|
| Brief Học & ôn tập | Khóa mục tiêu, vòng học và giới hạn contract thật cho vocab/grammar |
| Ba hướng UX | A ưu tiên việc hôm nay; B tách hai thư viện; C theo chủ đề kép |
| Hướng mặc định | B là hướng khả thi nhất để vocab chạy trước và grammar nối sau |

### CHANGES

| Tree | Details |
|---|---|
| `.workflows/designs/miamia/hoc-tu-vung-ngu-phap.md` | `added` — workflow Plan tiếng Việt, evidence, contract inventory và quyết định cần duyệt |
| `.workflows/.previews/designs/miamia/hoc-tu-vung-ngu-phap/r1/index.html` | `added` — một HTML có tab A/B/C và bốn state Tổng quan/Thư viện/Bài học/Luyện tập |

### NEED APPROVALS

| Question | Options |
|---|---|
| Chọn product direction để chuyển sang `starci-fe-design-review` | **B · Hai thư viện rõ ràng (khuyến nghị)**; A · Học hôm nay; C · Chủ đề kép |

### WARNINGS

| Warning | Impact |
|---|---|
| Grammar chưa có catalogue/detail/practice/mastery GraphQL | Không thể Apply luồng grammar hoàn chỉnh chỉ bằng FE |
| `continueLearning` chỉ trả id/slug/text tối thiểu | CTA học tiếp có thể cần query tiếp để lấy copy/tiến trình |
| Worktree FE đang có thay đổi của tính năng Thi thử | Review/Apply phải bảo toàn và baseline đúng worktree hiện tại |
| Viewport browser hiện tại là desktop | Mobile footbar được thể hiện bằng CSS proposal nhưng cần kiểm tra trực quan lại ở Review/Apply |

### REJECTED

| Rejected | Instead | Why |
|---|---|---|
| Checkout trong scope hiện tại | Học từ vựng và ngữ pháp | Thầy chốt “checkout tính sau” |

### OWED

| Owed | Cleared by |
|---|---|
| Chọn A/B/C | Feedback trực tiếp của thầy trên preview r1 |
| Khóa blocks/composites/branches/leafs và props delta | `starci-fe-design-review` sau khi direction được chọn |
| Thiết kế contract grammar production | Một chuỗi Backend Feature Plan/Review/Apply riêng nếu hướng duyệt cần grammar live |
| Visual QA mobile thật | Browser viewport mobile trong Review hoặc Apply |
