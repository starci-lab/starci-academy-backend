# Quy tắc Soạn thảo Challenge - Cấu trúc Base

Tài liệu này quy định **cấu trúc chuẩn** của một file challenge (`vi.md` / `en.md`). Áp dụng cho **cả `fullstack` lẫn `system-design`**; các file level (`1-easy.md`...) trong từng thư mục con sẽ override/thêm ràng buộc riêng.

Mỗi challenge là một bài thực hành độc lập, người học đọc xong là biết: làm gì, làm như thế nào, nộp cái gì, và được chấm ra sao.

Thứ tự các section **bắt buộc** giữ đúng như bên dưới. Viết `vi.md` trước, sau đó dịch `en.md`. Thuật ngữ kỹ thuật tiếng Anh trong phần mô tả nên bọc `***...***` (ví dụ: ***API***, ***Dependency Injection***).

---

## 0. Nguyên tắc chấm điểm chung - **STRICT, KHÔNG NHÂN NHƯỢNG**

- Chấm theo **binary per prompt**: đạt thì full điểm, không đạt thì **0**. Không có điểm khuyến khích, không có "một nửa".
- Bài nộp không chạy được -> **0 điểm toàn challenge**, không cần chấm tiếp.
- Thiếu bất kỳ **yêu cầu bắt buộc** nào trong `requirements` -> prompt tương ứng **0**.
- Copy source demo trong `contents` mà không đổi context đủ xa -> **0 điểm toàn challenge**.
- README/docs cẩu thả (thiếu cách chạy, thiếu mô tả kiến trúc, thiếu kết quả test) -> trừ thẳng prompt chấm docs về **0**.
- `promptText` phải viết sao cho người chấm chỉ cần trả lời **đúng/sai**, không cần suy diễn.

Các file level (`1-easy`, `2-medium`, `3-hard`, `4-insane`) sẽ cụ thể hoá những gì "bắt buộc phải có" cho từng hạng.

---

## 0.1. Quy ước đặt tên thư mục challenge - **BẮT BUỘC**

Mỗi challenge là 1 thư mục nằm trong `contents/<content>/challenges/`, đặt theo format:

```
{index}-{displayname}-{level}
```

- **`{index}`**: số nguyên đánh thứ tự challenge trong content, bắt đầu từ `0`. Độ khó tăng dần theo index.
- **`{displayname}`**: slug kebab-case mô tả nội dung challenge, **không trùng tên content cha**, **không trùng tên demo trong `vi.md` của content**. Dùng danh từ nghiệp vụ (domain) chứ không dùng lại `cat`/`dog`/`item`. Độ dài 2 - 6 từ. Đây chính là phần **display name** được lưu vào DB (parser sẽ bóc `{index}` và `{level}` ở hai đầu, phần giữa là display).
- **`{level}`**: đúng 1 trong `easy` | `medium` | `hard` | `insane`, **phải khớp** field `# difficulty` trong `vi.md` / `en.md`.

**Ví dụ đạt:**

```
challenges/
  0-order-inventory-cross-module-di-easy/
  1-order-payment-checkout-flow-medium/
  2-dynamic-module-provider-factory-hard/
```

**Ví dụ chưa đạt:**

- `0-easy` (thiếu displayname, không biết challenge về gì).
- `0-challenge-1-easy` (displayname vô nghĩa).
- `0-environment-setup-and-nestjs-core-easy` (trùng tên content cha -> không phân biệt được với content, vi phạm rule đổi context).
- `0-cat-dog-di-easy` (copy nguyên context demo của `vi.md` -> **0 toàn challenge** khi chấm).

**Nguyên tắc:**

- Trong cùng 1 content, **cấm trùng `{index}`** và **cấm trùng `{displayname}`**.
- Trong 1 content có thể có nhiều challenge cùng level (ví dụ 2 challenge `easy`), phân biệt bằng `{displayname}` khác nhau và `{index}` tăng dần.
- Tên thư mục là nguồn sự thật cho URL/slug trong DB; đổi tên = đổi URL, cân nhắc kỹ.

---

## 1. `# title`

- **Mục đích:** Nêu rõ **mục tiêu thực thi** của challenge trong một câu.
- **Quy tắc viết:**
  - Bắt đầu bằng động từ hành động: *Áp dụng / Thiết kế / Triển khai / Phân tích / Refactor...*
  - Nêu rõ đối tượng cụ thể (không nói chung chung).
  - Độ dài: 8 - 15 từ.
- **Ví dụ đạt:** `Áp dụng quy trình 4 bước để thiết kế URL Shortener`
- **Ví dụ chưa đạt:** `Bài tập về thiết kế hệ thống` (quá chung chung, không có động từ hành động, không nêu đối tượng).

---

## 2. `# description`

- **Mục đích:** Mô tả **ngắn gọn** challenge sẽ làm gì, output dạng nào.
- **Quy tắc viết:**
  - 2 - 4 câu, tối đa ~80 từ.
  - Nhắc lại keyword chính trong `title`, bổ sung bối cảnh và dạng output (Google Docs, GitHub repo, code, diagram...).
  - Không lặp nguyên văn `title`, không viết dài dòng kiểu giáo trình.
- **Cấu trúc khuyến nghị:** `[Hành động chính] + [đối tượng/phạm vi] + [dạng sản phẩm nộp]`.

---

## 3. `# requirements`

- **Mục đích:** Liệt kê **yêu cầu bắt buộc** mà bài nộp phải đáp ứng. Đây là "hợp đồng" giữa đề bài và người làm.
- **Quy tắc viết:**
  - Viết dưới dạng đoạn văn hoặc danh sách đánh số; nêu rõ ràng, đo lường được.
  - Có **con số cụ thể** nếu liên quan đến quy mô/hiệu năng (ví dụ: `100 triệu URL/tháng`, `99.9% uptime`).
  - Nêu cấu trúc bắt buộc nếu có (ví dụ: "phải tuân theo đúng 4 bước...").
  - **Không** viết yêu cầu mơ hồ kiểu "làm tốt", "chuyên nghiệp".

---

## 4. `# prerequisites`

- **Mục đích:** Cho người học biết **kiến thức nền** cần có trước khi làm.
- **Quy tắc viết:**
  - Danh sách gạch đầu dòng (`-`), 2 - 5 mục.
  - Mỗi mục là 1 kiến thức/kỹ năng cụ thể, không phải tên khóa học.
  - Viết ở dạng "Hiểu... / Biết... / Có khả năng...".

---

## 5. `# steps`

- **Mục đích:** Hướng dẫn **quy trình thực hiện từ A đến Z**. Người học đọc xong là biết làm từng bước.
- **Cấu trúc một step:**

  ```
  ## <index>                # đánh số từ 0
  ### title                 # tiêu đề step, dạng "Bước N - <tên>"
  ### body                  # nội dung chi tiết, format bên dưới
  ```

- **Format bắt buộc của `body`** (đúng 3 sub-heading `##` plain + nội dung dạng list `- `):

  ```
  ## Các bước thực hiện
  - **Bước 1:** <hành động>
  - **Bước 2:** <hành động>
    ```bash
    <command nếu cần>
    ```
  - **Bước 3:** <hành động>

  ## Yêu cầu tối thiểu cần đạt
  - <điều kiện 1 đo lường được>
  - <điều kiện 2 đo lường được>
  - <điều kiện 3 đo lường được>

  ## Nice to have
  - <thứ không bắt buộc, cộng điểm cảm tính / tiêu chí nâng cao>
  - <thứ tiếp theo>
  ```

  - 3 sub-heading `## Các bước thực hiện`, `## Yêu cầu tối thiểu cần đạt`, `## Nice to have` **KHÔNG bold, KHÔNG italic**; phải là heading `##` plain.
  - `## Các bước thực hiện`: mỗi dòng bắt đầu bằng `- ` (list item). Tiền tố `**Bước N:**` **in đậm**, theo sau là nội dung. Được phép chèn code block ``` ``` ``` thụt lề 2 space ngay dưới 1 bước nếu cần.
  - `## Yêu cầu tối thiểu cần đạt`: list `- `, **2 - 5 items**, mỗi item là 1 điều kiện **đo lường được** (pass/fail rõ ràng). Không in đậm/nghiêng nội dung. Tránh "hiểu rõ", "nắm vững"; thay bằng artifact / output / hành vi cụ thể.
  - `## Nice to have`: list `- `, **1 - 4 items**, không bắt buộc để chấm pass, chỉ là gợi ý nâng cao (refactor, DX, perf, coverage cao hơn...). Người học không làm vẫn full điểm; làm tốt cũng KHÔNG cộng điểm - mục này để truyền cảm hứng "làm sạch hơn mức tối thiểu".
  - **CẤM** viết section `## Kết luận` hoặc `**Kết luận:**`. Có sẽ bị coi là sai format.
- **Format bắt buộc khi bước yêu cầu gọi HTTP API** (ví dụ: smoke test, verify endpoint, chạy curl): KHÔNG chỉ dán 1 block `curl` khô. Phải viết đủ **4 phần tường minh** bên dưới bước cha (thụt lề 2 space dưới `- **Bước N:**`):

  ```
  - **Bước N:** <mô tả hành động, ví dụ: Gọi API tạo order>

    **Tiêu đề API:** **<Tên nhóm API> - <mục đích> - <METHOD> <URL đầy đủ>**

    **Hướng dẫn gọi API:** Dùng Postman gửi `<METHOD>` vào `<URL>`<, chọn tab `Body` -> `raw` -> `JSON` nếu có body>.

    **Body JSON:** `<JSON body thật>` (hoặc ghi rõ "Không có body với request `GET`").

    Hoặc dùng **curl** (WSL2 / Bash / macOS):
    ```bash
    curl -X <METHOD> <URL> \
      -H "Content-Type: application/json" \
      -d '<JSON body>'
    ```
  ```

  - **BẮT BUỘC** đủ 4 phần theo đúng thứ tự: `Tiêu đề API` -> `Hướng dẫn gọi API` -> `Body JSON` -> khối `curl`. Bản tiếng Anh dùng key tương đương: `API name` / `How to call` / `JSON Body` / `Or use **curl** ...`.
  - `Tiêu đề API` là 1 dòng duy nhất in đậm theo mẫu `**<tên> - <mục đích> - <METHOD> <URL>**`.
  - Với `GET` không body: vẫn BẮT BUỘC ghi `**Body JSON:** Không có body với request \`GET\`.` (hoặc tiếng Anh: `No body for \`GET\` requests.`). Không được bỏ section.
  - Các bước không gọi API (nest CLI, viết code, sửa file) KHÔNG cần format này; chỉ câu lệnh + code block như bình thường.
- **Quy tắc chung:**
  - Số step: **3 - 6**. Step cuối thường là "Hoàn thiện / Tổng hợp tài liệu".
  - Mỗi step độc lập, thứ tự có tính kế thừa (step sau dùng kết quả step trước).
  - Có số liệu, công thức, ví dụ khi liên quan đến ước lượng hoặc thiết kế.

---

## 6. `# references`

- **Mục đích:** Nguồn tham khảo chất lượng cao để người học tự nghiên cứu sâu.
- **Cấu trúc một reference:**

  ```
  ## <index>
  ### alias                 # tên hiển thị
  ### url                   # link
  ```

- **Quy tắc viết:**
  - 2 - 4 references, ưu tiên sách kinh điển, repo chuẩn, bài blog engineering uy tín.
  - `alias` viết rõ nguồn + chương/section liên quan (ví dụ: `Designing Data-Intensive Applications - Chapter 1`).
  - Không dùng link tiếng Việt dịch lại, không dùng blog cá nhân không kiểm chứng.

---

## 7. `# submissions`

- **Mục đích:** Xác định **bài nộp** và **cách chấm điểm**.
- **Cấu trúc một submission:**

  ```
  ## <index>
  ### type                  # loại submission (xem bảng dưới)
  ### title                 # tên bài nộp
  ### description           # người học cần nộp chính xác cái gì
  ### score                 # điểm tối đa của submission này
  ### prompts               # các tiêu chí chấm điểm
  ```

- **Các `type` được hỗ trợ:**
  - `githubUrl` - link repo GitHub (code, project, POC).
  - `googleDocsUrl` - link Google Docs (tài liệu thiết kế, phân tích, runbook, design doc).
  - `drawioUrl` - link sơ đồ (draw.io / diagrams.net / Excalidraw share link).

- **Lựa chọn `type` theo bối cảnh (linh hoạt, tuỳ challenge):**
  - Có thể là **chỉ 1 `githubUrl`** (challenge thuần code).
  - Có thể là **chỉ 1 `googleDocsUrl`** (challenge thuần phân tích ngắn).
  - Có thể là **1 `googleDocsUrl` + 1 `drawioUrl`** (challenge thiết kế hệ thống).
  - Có thể là **2 `githubUrl` + 1 `googleDocsUrl`** (ví dụ: backend repo + frontend repo + design doc).
  - Có thể là **1 `githubUrl` + 1 `googleDocsUrl` + 1 `drawioUrl`** (fullstack + docs + sơ đồ).
  - Nguyên tắc: submission phản ánh đúng artifact thực tế của challenge; **không bắt nộp thứ không cần, không cắt thứ cần nộp**.

- **`prompts` - tiêu chí chấm điểm (bắt buộc):**

  ```
  #### <index>
  ##### title               # tên tiêu chí
  ##### score               # điểm tối đa tiêu chí này
  ##### promptText          # mô tả chi tiết điều kiện để đạt điểm
  ```

  - Mỗi submission có **2 - 4 prompts**.
  - **Tổng điểm của các `prompts` phải bằng `score` của `submission`**.
  - `promptText` phải đo lường được (có con số, có điều kiện rõ ràng), tránh "làm tốt", "đầy đủ" chung chung.

---

## 8. `# difficulty`

- Giá trị: `easy` | `medium` | `hard` | `insane`.
- Phải **khớp với suffix thư mục** chứa challenge (ví dụ: thư mục `...-easy` thì `difficulty: easy`).

---

## 9. `# score`

- Tổng điểm của toàn challenge.
- **Phải bằng tổng `score` của tất cả `submissions`**.
- Gợi ý theo `difficulty`:
  - `easy`: 20
  - `medium`: 40
  - `hard`: 60
  - `insane`: 100

---

## 10. Checklist trước khi commit

- [ ] Có đủ cả `vi.md` và `en.md`, nội dung tương đương.
- [ ] Thứ tự section đúng: `title -> description -> requirements -> prerequisites -> steps -> references -> submissions -> difficulty -> score`.
- [ ] `title` bắt đầu bằng động từ hành động, nêu đối tượng cụ thể.
- [ ] `steps` có 3 - 6 step; mỗi step có đủ 3 sub-heading `## Các bước thực hiện`, `## Yêu cầu tối thiểu cần đạt`, `## Nice to have` (plain, không bold/italic). Nội dung mỗi section là list `- `; riêng `## Các bước thực hiện` có `**Bước N:**` in đậm đầu mỗi item. KHÔNG có `## Kết luận`.
- [ ] `references` có 2 - 4 nguồn uy tín, mỗi mục có đủ `alias` + `url`.
- [ ] `submissions[*].prompts` có 2 - 4 tiêu chí, tổng điểm bằng `score` của submission.
- [ ] `difficulty` khớp tên thư mục; `score` tổng = tổng `score` của `submissions`.
- [ ] Tên thư mục đúng format `{index}-{displayname}-{level}`; `{displayname}` không trùng tên content cha, không dùng lại context demo.
