# Quy tắc và Cấu trúc Challenge (Challenge Creation Guidelines)

Mỗi loại content phải sinh challenge theo 4 mức độ khó chuẩn: **Easy**, **Medium**, **Hard**, **Insane**.
Trong đó **Easy là bắt buộc**, còn **Medium/Hard/Insane là optional** nếu không phù hợp với phạm vi bài học.

---

## 0. Enum độ khó bắt buộc (Difficulty Enum)

Mọi challenge phải map chính xác với enum sau:

```typescript
export enum ChallengeDifficulty {
    Easy = "easy",
    Medium = "medium",
    Hard = "hard",
    Insane = "insane",
}
```

- Không thêm độ khó khác ngoài 4 giá trị trên.
- Không đổi tên key và không đổi value string.

### Enum loại submission bắt buộc
Chỉ sử dụng đúng các loại submission sau:

```typescript
export enum SubmissionType {
    GoogleDocsUrl = "googleDocsUrl",
    GithubUrl = "githubUrl",
}
```

- Không dùng type khác ngoài `googleDocsUrl` và `githubUrl`.
- Không đổi tên key và không đổi value string.

---

## I. Quy tắc số lượng challenge theo mỗi content

Với mỗi content (một bài học cụ thể), ưu tiên tạo đủ:

1. **Easy (easy)** — gần giống nội dung bài học, nhưng buộc user tự nghĩ context.
2. **Medium (medium)** — implementation nâng cao hơn bài học cơ bản.
3. **Hard (hard)** — implementation tiệm cận production.
4. **Insane (insane)** — implementation cho bài toán large-scale khoảng **1M users**.

### Ràng buộc bắt buộc
- Luôn phải có ít nhất **1 challenge Easy (easy)**.
- Nếu có thêm `medium`, `hard`, `insane` thì phải cùng chủ đề kỹ thuật với content gốc.
- Các mức được tạo phải tăng dần độ khó rõ ràng, không trùng lặp.
- Trường hợp không thể thiết kế hợp lý cho `medium/hard/insane`, được phép bỏ qua các mức đó.
- Khi bỏ qua mức độ khó, nên ghi rõ lý do ngắn gọn (scope bài học, thiếu ngữ cảnh hệ thống, hoặc không phù hợp kỹ thuật).

---

## II. Mục tiêu học tập theo từng mức độ khó

### 1. Easy (easy)
- Mục tiêu: củng cố kiến thức nền vừa học.
- Đề bài: tương tự bài học, nhưng thay đổi bối cảnh/domain để user tự suy luận.
- Hạn chế: không yêu cầu kiến trúc phức tạp; có thể có multi-service trong phạm vi monorepo nếu mức độ triển khai vẫn giữ ở mức nền tảng.

### 2. Medium (medium)
- Mục tiêu: mở rộng từ nền tảng sang implementation nâng cao.
- Đề bài: thêm ràng buộc kỹ thuật (validation phức tạp, edge cases, error handling, testing cơ bản).
- Hạn chế: chưa bắt buộc tối ưu quy mô lớn.

### 3. Hard (hard)
- Mục tiêu: thiết kế và triển khai theo chuẩn gần production.
- Đề bài: có non-functional requirements (observability, security, reliability, maintainability).
- Bắt buộc: xử lý lỗi rõ ràng, idempotency phù hợp, cấu trúc code/module sạch.

### 4. Insane (insane)
- Mục tiêu: giải bài toán quy mô lớn cho khoảng **1M users**.
- Đề bài: tập trung scale, performance, fault tolerance, cost-awareness.
- Bắt buộc: nêu rõ chiến lược scaling, caching/queueing/sharding (nếu phù hợp), bottleneck và trade-offs.

---

## III. Template nội dung cho mỗi challenge

Mỗi challenge nên có cấu trúc thống nhất để dễ dùng cho hệ thống:

- **title:** Tên challenge ngắn, rõ mục tiêu kỹ thuật.
- **difficulty:** Một trong `easy | medium | hard | insane`.
- **description:** Mô tả bối cảnh và yêu cầu chính.
- **requirements:** Danh sách yêu cầu chức năng và kỹ thuật bắt buộc.
- **constraints:** Giới hạn/giả định (nếu có).
- **expectedOutcome:** Kết quả mong đợi khi hoàn thành.
- **hints (optional):** Gợi ý ngắn, không lộ full solution.

### Quy tắc điểm theo độ khó (Scoring Rules)
- **easy**: `# score = 20`
- **medium**: `# score = 30`
- **hard**: `# score = 40`
- **insane**: `# score = 50`
- Tổng điểm trong `# submissions -> prompts` phải bằng đúng `# score` của challenge.
- Một challenge có thể có **nhiều submission** (nhiều `## n` trong `# submissions`).
- Tổng điểm của tất cả `# submissions` phải bằng đúng `# score` của challenge.
- Trong từng submission, tổng điểm của `prompts` phải bằng `submission.score`.

### Quy tắc đặt tên challenge (Challenge Naming)
- Dùng slug theo mẫu: `<content-slug>-<difficulty>`.
- Ví dụ:
  - `environment-setup-and-nestjs-core-easy`
  - `jwt-login-and-guards-medium`
- Trong phần hướng dẫn step setup, tên project demo nên bám theo slug challenge (hoặc biến thể trực tiếp từ slug), tránh tên chung chung như `nest-core-easy-challenge`.

### Quy tắc viết đề bài
- Ngắn gọn, rõ input/output, tránh mơ hồ.
- Ưu tiên tính thực chiến, bám sát content gốc.
- Có tiêu chí pass/fail đủ rõ để chấm được.

### Quy tắc thiết kế `# submissions`
- Mỗi challenge phải có ít nhất 1 submission type hợp lệ từ enum `SubmissionType`.
- Có thể kết hợp cả `githubUrl` và `googleDocsUrl` trong cùng 1 challenge khi cần đánh giá cả implementation và tư duy thiết kế.
- Với content thiên về coding/implementation: ưu tiên `githubUrl`.
- Với content thiên về no-code/system-thinking (ví dụ phân tích kiến trúc, thiết kế hệ thống, trade-offs):
  - Bắt buộc có `googleDocsUrl`.
  - User phải nộp tài liệu ý tưởng/thiết kế hệ thống (problem framing, kiến trúc đề xuất, luồng xử lý, quyết định trade-off).
  - Nếu challenge có cả phần code và phần thiết kế, có thể yêu cầu nộp đồng thời `githubUrl` + `googleDocsUrl`.

### Quy tắc viết `# steps` (bắt buộc)
- Mỗi step `## n` phải có `### title` và `### body`.
- Trong `### body`, bắt buộc dùng đủ 3 cụm sau:
  - `- **Các bước thực hiện:**`
  - `- **Kết quả mong đợi:**`
  - `- **Kết luận:**`
- Phần `Các bước thực hiện` phải liệt kê theo thứ tự `Bước 1`, `Bước 2`, ... và mỗi bước là một hành động cụ thể có thể làm ngay.
- Nếu có lệnh (`npm`, `nest`, `docker`, `curl`...), bắt buộc đặt trong code block Markdown.
- Step kiểm thử cuối phải nêu rõ endpoint/input cần gọi và output mong đợi để xác nhận pass challenge.
- Nội dung steps phải đi theo luồng rõ ràng: setup -> implement -> verify, không liệt kê rời rạc.

---

## IV. Quy tắc nâng cấp độ khó (Difficulty Progression)

Khi có từ 2 mức độ khó trở lên (ví dụ Easy -> Medium, hoặc Easy -> Hard -> Insane), bắt buộc tăng dần ở các trục sau:

1. **Độ phức tạp nghiệp vụ**
2. **Số lượng edge cases**
3. **Yêu cầu chất lượng hệ thống (NFRs)**
4. **Quy mô và áp lực tải**
5. **Mức độ ra quyết định kiến trúc**

Không được chỉ tăng độ dài mô tả mà không tăng độ khó kỹ thuật thực tế.

---

## V. Quy tắc định dạng chung (Formatting Rules)

1. **Strictly Icon-free:** Không dùng emoji/icon trong nội dung kỹ thuật.
2. **Professional Tone:** Ngôn ngữ kỹ thuật rõ ràng, thực dụng, dễ chấm.
3. **Consistency:** Các challenge được tạo trong cùng content phải thống nhất thuật ngữ.
4. **Bilingual Requirement:** Mỗi challenge bắt buộc có đủ 2 file `vi.md` và `en.md` với nội dung tương đồng (không lệch yêu cầu kỹ thuật, score, difficulty, submissions).
5. **Keyword Highlighting:** Dùng `**keyword**` cho khái niệm quan trọng, tránh lạm dụng.
