# Brief — Playground `rag` (guided path, 20 bước)

> Nguồn tham chiếu: `.mount` schema mẫu (`2-devops-mastery/playgrounds/{0-docker,1-kubernetes}`) cho format file; proposal `playground-guided-path.proposal.md` (repo `starci-academy`, FE) cho schema `kind`-đa-hình; widget thật `src/components/features/rag-playground/RagPlayground/index.tsx` (BE `src/modules/rag/public-rag-playground.service.ts`) cho tab/label/sample thật — mọi actionHint bên dưới trỏ đúng control có thật trong UI đó (tab **Dán / Tải lên / Mẫu / GitHub** bên trái, ô hỏi + nút gửi bên phải, khối **Nguồn** dưới mỗi câu trả lời).

## Playground META
- `slug`: `rag`
- `title` (vi): **RAG** — en: **RAG**
- `description` (vi): Nạp một đoạn code, hỏi về nó, và học cách đọc trích dẫn nguồn — từ hỏi cơ bản đến đặt câu hỏi kiến trúc/bảo mật thật.
  - en: Import a code source, ask about it, and learn to read grounded citations — from a basic ask to architecture/security-level questions.
- `icon`: ✨
- `sortIndex`: 0
- `kind`: `rag`

## Ghi chú thiết kế (vì sao thứ tự lệch nhẹ so với đề bài gốc)
Mỗi lần **Nạp** (import) sẽ THAY TOÀN BỘ collection đang index (service rebuild-from-scratch) — không có "nhiều nguồn cộng dồn". Vì vậy nhóm các câu hỏi theo **cụm cùng một nguồn đang nạp**, và di chuyển "import GitHub repo" lên TRƯỚC "hỏi xuyên nhiều file" (chỉ GitHub import mới thực sự đưa vào NHIỀU file cùng lúc — paste/upload luôn là một nguồn/file). Đủ 20 khái niệm đề bài yêu cầu, chỉ đổi vị trí 2 bước cho đúng kỹ thuật.

Sample catalog thật (BE `SAMPLE_CATALOG`, dùng đúng `id` làm `sampleRef`):
- `retrieval-helper` — "Retrieval helper (cosine similarity top-k)", file `sample.ts` (hàm `cosineSimilarity`, `retrieveTopK`).
- `express-todo-api` — "Express REST API (todos CRUD)", file `server.ts` (routes `GET/POST /todos`, `PATCH/DELETE /todos/:id`, lỗi 400 "title is required", lỗi 404 "todo not found").
- `docker-compose-api` — "Dockerfile + docker-compose (API + Postgres)".

---

## 0 — `import-starter-sample`
- **title**: Nạp một mẫu có sẵn
- **body**: Nạp mẫu code có sẵn để bắt đầu — không cần gõ dòng nào.
- **actionHint**: Bấm tab **Mẫu** ở khung bên trái → chọn **"Retrieval helper (cosine similarity top-k)"** → bấm nút **Nạp**.
- **sampleRef**: `retrieval-helper`
- **verifyKind**: `imported`

## 1 — `ask-first-question`
- **title**: Đặt câu hỏi đầu tiên
- **body**: Hỏi AI xem đoạn code vừa nạp dùng để làm gì.
- **actionHint**: Gõ câu hỏi vào ô bên phải rồi bấm nút gửi (hoặc Enter).
- **askPrefill**: Đoạn code này dùng để làm gì?
- **verifyKind**: `asked`

## 2 — `read-the-citation`
- **title**: Đọc trích dẫn nguồn
- **body**: Đợi câu trả lời xong rồi đối chiếu phần **Nguồn** với đúng file đã nạp.
- **actionHint**: Sau khi câu trả lời hiện xong, kéo xuống khối **Nguồn** ngay dưới, xem đoạn trích có khớp với `sample.ts` không.
- **verifyKind**: `answered`

## 3 — `ask-a-follow-up`
- **title**: Hỏi tiếp một câu bám theo (multi-turn)
- **body**: Hỏi sâu hơn về chi tiết vừa được trả lời, không cần nạp lại gì.
- **actionHint**: Gõ tiếp một câu hỏi khác ngay bên dưới câu trước, không đổi nguồn đã nạp.
- **askPrefill**: Hàm `cosineSimilarity` tính điểm tương đồng giữa hai vector như thế nào?
- **verifyKind**: `asked`

## 4 — `paste-your-own-snippet`
- **title**: Dán đoạn code của riêng bạn
- **body**: Đổi nguồn sang một đoạn code do chính bạn viết hoặc copy.
- **actionHint**: Bấm tab **Dán** → dán một đoạn code bất kỳ (10-30 dòng) vào ô → bấm **Nạp** (thao tác này thay thế mẫu đang có).
- **verifyKind**: `imported`

## 5 — `ask-about-your-snippet`
- **title**: Hỏi về đoạn code vừa dán
- **body**: Kiểm tra AI có thực sự đọc đúng đoạn bạn vừa dán, không phải bịa.
- **actionHint**: Hỏi một câu chỉ có thể trả lời đúng nếu đọc đúng đoạn bạn vừa dán (vd nhắc tên biến/hàm bạn đặt).
- **askPrefill**: Đoạn code tôi vừa dán có hàm/biến nào, và chúng làm gì?
- **verifyKind**: `answered`

## 6 — `ask-where-is-x-defined`
- **title**: Hỏi "X được định nghĩa ở đâu"
- **body**: Nạp lại mẫu `retrieval-helper` rồi hỏi định vị một hàm cụ thể.
- **actionHint**: Bấm tab **Mẫu** → chọn lại **"Retrieval helper"** → **Nạp**, rồi hỏi định vị một hàm cụ thể trong đó.
- **sampleRef**: `retrieval-helper`
- **askPrefill**: Hàm `retrieveTopK` được định nghĩa ở đâu, và nó gọi hàm nào bên trong?
- **verifyKind**: `asked`

## 7 — `upload-a-file`
- **title**: Tải lên một file thật
- **body**: Đổi nguồn sang một file code lấy từ máy bạn (khác thao tác dán tay).
- **actionHint**: Bấm tab **Tải lên** → chọn một file code bất kỳ trên máy (`.ts`, `.py`, `.go`, …) → bấm **Nạp**.
- **verifyKind**: `imported`

## 8 — `import-a-github-repo`
- **title**: Nạp một repo GitHub công khai
- **body**: Nạp cả một repo nhỏ, công khai, để có NHIỀU file cùng lúc trong index (khác paste/upload chỉ một file).
- **actionHint**: Bấm tab **GitHub** → dán URL một repo công khai NHỎ (vd `https://github.com/vercel/ms`) vào ô → bấm **Nạp**.
- **verifyKind**: `imported`

## 9 — `ask-across-files`
- **title**: Hỏi một câu xuyên nhiều file
- **body**: Đặt câu hỏi mà câu trả lời đúng phải ghép thông tin từ ≥2 file khác nhau trong repo vừa nạp.
- **actionHint**: Hỏi một câu buộc AI phải gộp thông tin từ nhiều file/đoạn trích khác nhau, rồi kiểm tra khối **Nguồn** có liệt kê ≥2 file khác nhau không.
- **askPrefill**: Các file trong repo này liên quan tới nhau như thế nào — file nào import/dùng file nào?
- **verifyKind**: `answered`

## 10 — `ask-an-architecture-question`
- **title**: Hỏi một câu về kiến trúc tổng thể
- **body**: Hỏi ở tầm cao hơn: luồng dữ liệu/thiết kế tổng thể, không phải chi tiết một dòng code.
- **actionHint**: Hỏi một câu tầm kiến trúc (luồng request, module nào phụ thuộc module nào) thay vì hỏi một dòng code cụ thể.
- **askPrefill**: Kiến trúc tổng thể của repo này là gì — các thành phần chính tương tác với nhau ra sao?
- **verifyKind**: `answered`

## 11 — `ask-about-specific-function`
- **title**: Hỏi sâu về một hàm cụ thể
- **body**: Chọn đúng một hàm/route và hỏi chi tiết hành vi của riêng nó.
- **actionHint**: Nêu tên chính xác một hàm/route xuất hiện trong nguồn đã nạp rồi hỏi hành vi chi tiết của nó (tham số, giá trị trả về, điều kiện).
- **askPrefill**: Route `PATCH /todos/:id` nhận vào những gì và trả về gì khi id không tồn tại?
- **verifyKind**: `asked`

## 12 — `ask-about-error-handling`
- **title**: Hỏi về xử lý lỗi
- **body**: Hỏi riêng phần xử lý lỗi/edge-case, không hỏi luồng chính.
- **actionHint**: Hỏi cụ thể về điều kiện lỗi, mã trạng thái, hoặc thông báo lỗi trong nguồn đã nạp.
- **askPrefill**: Khi thiếu `title` hoặc gọi `id` không tồn tại thì API trả lỗi gì, mã trạng thái bao nhiêu?
- **verifyKind**: `asked`

## 13 — `compare-two-approaches`
- **title**: So sánh hai cách làm trong code
- **body**: Yêu cầu AI so sánh trade-off giữa hai phần/route/hàm khác nhau trong cùng nguồn.
- **actionHint**: Hỏi một câu yêu cầu SO SÁNH (giống/khác, ưu/nhược) giữa hai phần khác nhau của nguồn đã nạp.
- **askPrefill**: So sánh cách route tạo mới (`POST /todos`) và route xoá (`DELETE /todos/:id`) xử lý lỗi — khác nhau ở điểm nào?
- **verifyKind**: `answered`

## 14 — `ask-no-answer-question`
- **title**: Hỏi một câu KHÔNG có đáp án trong code
- **body**: Cố tình hỏi điều không tồn tại trong nguồn đã nạp, xem AI có thật sự từ chối bịa hay không.
- **actionHint**: Hỏi về một thứ chắc chắn không có trong nguồn đã nạp (vd công nghệ/tính năng không xuất hiện) rồi đọc xem AI có báo "không tìm thấy trong code" thay vì bịa không.
- **askPrefill**: Repo này có dùng GraphQL subscription để realtime không?
- **verifyKind**: `answered`

## 15 — `refine-a-vague-question`
- **title**: Làm rõ một câu hỏi mơ hồ
- **body**: Bắt đầu bằng một câu hỏi mơ hồ, rồi viết lại cho cụ thể hơn để có câu trả lời tốt hơn.
- **actionHint**: Hỏi một câu ngắn/mơ hồ trước (vd "Code này ổn không?"), rồi gõ lại một câu CỤ THỂ hơn (nêu rõ file/hàm/tiêu chí muốn đánh giá).
- **askPrefill**: Cách viết trong file này có gì nên cải thiện xét theo xử lý lỗi và validate input?
- **verifyKind**: `asked`

## 16 — `ask-for-a-summary`
- **title**: Yêu cầu tóm tắt
- **body**: Hỏi một câu yêu cầu tóm tắt toàn bộ nguồn đã nạp trong vài dòng.
- **actionHint**: Hỏi AI tóm tắt ngắn gọn (3-5 gạch đầu dòng) toàn bộ nguồn đang được index.
- **askPrefill**: Tóm tắt ngắn gọn repo/đoạn code này làm gì, dưới dạng vài gạch đầu dòng.
- **verifyKind**: `asked`

## 17 — `ask-about-dependencies`
- **title**: Hỏi về dependency
- **body**: Hỏi những thư viện/gói ngoài nào được dùng và dùng để làm gì.
- **actionHint**: Hỏi về các import/thư viện bên ngoài xuất hiện trong nguồn đã nạp và vai trò của từng thư viện.
- **askPrefill**: Nguồn này import/dùng những thư viện bên ngoài nào, và mỗi thư viện dùng để làm gì?
- **verifyKind**: `asked`

## 18 — `ask-a-security-question`
- **title**: Hỏi một câu về bảo mật
- **body**: Đặt câu hỏi ở mức cao hơn: rủi ro bảo mật/input không được kiểm tra trong nguồn đã nạp.
- **actionHint**: Hỏi về rủi ro bảo mật cụ thể (input không validate, thiếu auth, secret lộ ra…) trong nguồn đã nạp, rồi đọc xem AI có trích đúng dòng liên quan không.
- **askPrefill**: Nguồn này có chỗ nào nhận input mà không kiểm tra/validate, có thể là rủi ro bảo mật không?
- **verifyKind**: `answered`

## 19 — `reflect-on-rag-tradeoffs`
- **title**: Nhìn lại: khi nào RAG giúp ích, khi nào không
- **body**: Tổng kết bằng một câu hỏi phản tư — RAG đã giúp bạn hiểu code nhanh hơn ở đâu, và ở đâu câu trả lời (bước 14) cho thấy giới hạn của nó.
- **actionHint**: Gõ một câu hỏi/nhận xét tổng kết, ví dụ so sánh trải nghiệm giữa lúc RAG trả lời tốt (có trích dẫn rõ) và lúc nó từ chối vì không có trong code (bước 14), rồi đọc phần trả lời khép lại của AI.
- **askPrefill**: Qua các câu hỏi ở trên, RAG kiểu này giúp ích nhất ở loại câu hỏi nào, và bất lực ở loại câu hỏi nào?
- **verifyKind**: `answered`
