---
name: starci-session-store
description: >
  Lưu checkpoint TRẠNG THÁI CÔNG VIỆC ĐANG DỞ (KHÔNG PHẢI toàn bộ lịch sử hội thoại) vào thư mục
  `.session/` ở gốc repo — cho phép thầy đổi sang máy khác / mở session Claude Code mới mà vẫn tiếp
  tục đúng chỗ đang làm dở. Mỗi checkpoint = 1 file `.session/<slug>.md` mô tả: đang làm gì, luồng
  còn treo (workflow/agent/dev-server chạy nền — kèm cảnh báo chúng KHÔNG tự chuyển máy được), việc
  đã xong/đã chốt (khỏi làm lại), bước tiếp theo cụ thể, trạng thái git lúc lưu (chỉ phần liên quan).
  Khi việc đã xong thật → XOÁ file (không tích luỹ rác, `.session/` chỉ chứa việc ĐANG DỞ). Trigger
  khi user gõ `/starci-session-store`, hoặc nói "lưu session lại", "checkpoint công việc", "đổi máy
  làm tiếp", "lưu để mai làm tiếp", "resume lại việc đang dở".
---

# /starci-session-store — Checkpoint việc ĐANG DỞ để đổi máy/session làm tiếp

## Nguyên tắc cốt lõi
- **CHỈ lưu việc ĐANG DỞ hiện tại, KHÔNG gom cả session.** Đây không phải transcript/log hội thoại —
  đừng tóm tắt MỌI thứ đã làm trong session (cái đã xong/đã commit/đã chốt thì bỏ qua, hoặc chỉ nhắc
  1 dòng "đã xong, khỏi làm lại"). Chỉ tập trung vào: **luồng công việc CHƯA XONG tại thời điểm lưu**.
- **1 checkpoint = 1 file `.session/<slug-viết-thường-gạch-ngang>.md`.** Nhiều việc dở song song (hiếm,
  nhưng có thể) → nhiều file, KHÔNG gộp chung 1 file dài dòng.
- **`.session/` SỐNG TRONG GIT** (không gitignore) — cơ chế "đổi máy" ở đây là qua git pull/push (giống
  mọi thứ khác trong dự án này). Nếu việc trải rộng ≥2 repo (vd BE + FE), ghi checkpoint ở **CẢ HAI
  repo** (nội dung tương đương), vì thầy có thể mở máy mới ở bất kỳ repo nào trước.
- **XOÁ khi xong.** Khi 1 checkpoint đã hoàn thành thật (verify xong, đã commit/đã quyết định dừng),
  xoá file — đừng để `.session/` phình thành nghĩa địa checkpoint cũ. `.session/` phản ánh ĐÚNG những
  gì còn dở NGAY LÚC ĐỌC, không phải lịch sử.

## Khi SAVE (viết checkpoint mới / cập nhật checkpoint có sẵn)
Viết `.session/<slug>.md` gồm các mục sau (bỏ mục nào không áp dụng, đừng ép đủ khung nếu thừa):

1. **Đang làm gì** — 1-2 câu business context (không phải mô tả code, mà "đang giải quyết vấn đề gì").
2. **Luồng còn treo (QUAN TRỌNG NHẤT)** — mọi thứ CHẠY NỀN mà không tự chuyển máy được:
   - **Workflow đang chạy**: ghi rõ **task ID + run ID** + tóm tắt các phase + **CẢNH BÁO**: workflow
     ghi file trực tiếp vào working tree CỦA MÁY ĐANG CHẠY nó — nếu đổi máy TRƯỚC khi nó xong, các
     thay đổi dở dang KHÔNG tự chuyển sang máy mới (khác máy = khác disk); phải hoặc (a) đợi xong rồi
     mới đổi máy, hoặc (b) commit+push trạng thái dở (rủi ro: code có thể chưa hợp lệ/chưa compile).
     `resumeFromRunId` của Workflow tool **chỉ hoạt động CÙNG session** — session mới (máy khác) KHÔNG
     resume lại được bằng cách đó; phải tự check qua `/workflows` hoặc đọc trực tiếp file trên disk.
   - **Dev server đang chạy** (`preview_start`/`serverId`) — KHÔNG chuyển máy được, phải khởi động lại
     trên máy mới (ghi rõ tên config trong `.claude/launch.json` để khởi động lại đúng lệnh).
   - **Agent con khác đang chạy nền** (nếu có) — tương tự, ghi task/agent id + cách check lại.
3. **Đã xong / đã chốt (khỏi làm lại)** — liệt kê NGẮN các quyết định/artifact đã có (đường dẫn file
   doc, quyết định đã chốt) — chỉ để không lặp lại công đã làm, KHÔNG diễn giải lại toàn bộ nội dung.
4. **Bước tiếp theo cụ thể** — danh sách có thứ tự, hành động được (không mơ hồ kiểu "tiếp tục làm").
5. **Trạng thái git lúc lưu** — branch + tóm tắt `git status --short` **CHỈ CHO các file liên quan tới
   việc đang dở này** — đừng liệt kê hết mọi file lạ không liên quan đang nằm trong working tree (dự
   án có thể có nhiều việc dở KHÁC không liên quan, đừng nhận vơ vào checkpoint này).

6. **BẮT BUỘC commit + push file checkpoint lên git ngay sau khi viết** (đây là lý do `.session/` sống
   trong git — nếu chỉ lưu local mà không push thì máy khác `pull` về vẫn KHÔNG THẤY GÌ, mất hết tác
   dụng "đổi máy làm tiếp"). Quy tắc khi commit:
   - **CHỈ `git add` đúng các file MỚI của chính checkpoint này** (skill folder lần đầu tạo +
     `.session/<slug>.md`) — **TUYỆT ĐỐI KHÔNG `git add -A`/`git add .`** vì working tree có thể đang
     có RẤT NHIỀU file dở của việc KHÁC không liên quan (không phải của checkpoint đang lưu) — commit
     nhầm sẽ làm rối repo cho máy khác pull về.
   - Commit message ngắn, dạng `chore(session): checkpoint <slug>` — không cần xin duyệt nội dung
     message, nhưng **PUSH thì làm luôn theo yêu cầu này** (user đã xác nhận: mục đích skill là để đổi
     máy, nên checkpoint phải lên remote mới có tác dụng — không cần hỏi lại mỗi lần).
   - Nếu 1 checkpoint tồn tại ở ≥2 repo (BE+FE) → commit+push CẢ HAI repo.
   - Khi RESUME xong và xoá checkpoint (mục dưới) → cũng commit+push việc XOÁ đó, để repo sạch cho
     người/máy tiếp theo pull.

## Khi RESUME (mở lại trên máy khác / session mới)
1. Đọc TOÀN BỘ file `.session/*.md` hiện có trong repo (đọc thật, đừng suy diễn) trước khi làm gì khác.
2. Với MỖI luồng-còn-treo trong checkpoint → chủ động KIỂM TRA LẠI TRẠNG THÁI THẬT (đừng giả định nó
   vẫn đúng như lúc ghi): workflow còn chạy không (`/workflows`, hoặc theo runId), dev server có đang
   chạy trên máy này không (thường KHÔNG, vì máy khác), file đã có thay đổi thật trên disk chưa (`git
   status`/đọc file) — SO SÁNH với checkpoint để biết đã tiến thêm hay dậm chân tại chỗ.
3. Báo lại thầy NGẮN GỌN: đang ở đâu, luồng nào đã xong/chưa, bước tiếp theo — RỒI mới hành động, đừng
   tự ý làm tiếp mà không xác nhận trạng thái thật trước (dễ làm trùng/làm sai vì giả định sai).
4. Khi 1 checkpoint xác nhận đã HOÀN TẤT thật → xoá file đó ngay (đừng để tồn đọng).

## Không phải memory, không phải rule
- Đây KHÔNG lưu vào auto-memory system (`~/.claude/.../memory/`) — memory là kiến thức DÀI HẠN xuyên
  session (user profile, feedback, project facts). `.session/` là checkpoint NGẮN HẠN, biến mất khi
  việc xong — 2 hệ khác mục đích, ĐỪNG trộn.
- Đây KHÔNG phải rule doc (`.claude/rules/drafts/*`) — rule là NGUYÊN TẮC rút ra để áp dụng về sau;
  checkpoint là TRẠNG THÁI 1 lần, không tổng quát hoá.
