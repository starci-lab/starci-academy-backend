# Fullstack Challenge - Level `easy`

**Bắt buộc phải có** cho mọi bài học trong khóa Fullstack Mastery. Đây là bài kiểm tra hiểu bài - không qua được `easy` nghĩa là chưa học.

---

## 1. Mục đích

- Ép học viên **tự implement lại kỹ thuật đã học** nhưng trong **context hoàn toàn khác** để không thể copy-paste source demo.
- Đầu ra chính là **code thật**, chạy được, có README.
- Fullstack ưu tiên **code hơn docs**; challenge `easy` thường chỉ cần code + README là đủ.

---

## 2. Nguyên tắc vàng - "Same technique, different context"

- **Kỹ thuật / pattern / lifecycle / API shape**: giữ y hệt bài học.
- **Domain / tên entity / endpoint / field**: **phải khác** đủ xa để học viên không thể đổi vài cái tên là xong.

### Bài test context: học viên copy demo về rồi rename có pass không?

- Nếu **CÓ** -> đề bài sai, viết lại context.
- Nếu **KHÔNG** -> đạt.

### Ví dụ chuyển context

| Demo trong `contents` | Context challenge `easy` |
|---|---|
| ***DI*** với `CatService` / `DogService` | `OrderService` gọi `InventoryService` cross-module |
| ***Request Lifecycle*** với `ItemsController` | CRUD `Article` có ***Guard*** + ***Pipe*** riêng |
| ***ConfigModule + Winston*** | Cấu hình env + logger cho app `PaymentGateway` |

---

## 3. Yêu cầu bắt buộc

### 3.1. `requirements`

Liệt kê **tường minh**:

- Tên module / service / controller / class cụ thể (theo context mới).
- Kỹ thuật phải dùng - copy đúng tên từ `contents` (ví dụ: "***Constructor Injection***", "***Guard*** + ***Pipe*** trên cùng endpoint").
- Endpoint cụ thể: method, path, body shape, response shape, status code.

### 3.2. `steps`

- Số step: **3 - 5**.
- Step 0: **Scaffold project mới** (không clone demo).
- Step giữa: implement từng thành phần theo thứ tự bài học.
- Step cuối: **chạy test thật** (Postman/curl), ghi **response thật** + **trace code execution** dạng `src/...:line -> method`.

### 3.3. `submissions` - **chỉ code**

- **1 submission duy nhất** type `githubUrl`.
- Repo bắt buộc có **README.md** gồm:
  - Mô tả ngắn (3-5 dòng) bài này demo kỹ thuật gì.
  - Cách chạy (prerequisite, install, start).
  - Danh sách endpoint + ví dụ request/response.
  - Trace code execution cho flow chính.
- `score` tổng: **20**.
- `prompts`: **2 - 3**, binary đúng/sai:
  - "Repo scaffold mới, không phải clone từ demo. Có đủ các file/module theo `requirements`" -> ___ điểm.
  - "Chạy `npm install && npm run start` local thành công, gọi endpoint trả đúng response shape đã định nghĩa" -> ___ điểm.
  - "README có đủ 4 mục: mô tả / cách chạy / endpoint / trace execution" -> ___ điểm.

---

## 4. CẤM

- CẤM chỉ yêu cầu trả lời lý thuyết - **phải có code chạy được**.
- CẤM context trùng demo (cũng `Cat/Dog`, cũng `Items`...).
- CẤM yêu cầu kỹ thuật chưa dạy trong `contents`.
- CẤM README kiểu "một dòng" - README lỏm sẽ chấm **0** prompt docs.

---

## 5. Checklist publish

- [ ] Context khác demo đủ xa (test "rename là pass" -> KHÔNG).
- [ ] Mọi kỹ thuật yêu cầu đều đã dạy trong `contents`.
- [ ] `requirements` có endpoint + shape cụ thể.
- [ ] Step cuối bắt buộc chạy test thật + trace `file:line`.
- [ ] Submission duy nhất là `githubUrl`; README đủ 4 mục.
- [ ] `difficulty: easy`, `score = 20`, tổng `prompts.score = 20`.
