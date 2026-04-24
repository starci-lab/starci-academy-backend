# Fullstack Challenge - Level `medium`

Nâng cấp từ `easy`: học viên phải **kết hợp nhiều kỹ thuật**, xử lý **edge case**, và **tự viết test**.

---

## 1. Mục đích

- Kiểm tra khả năng implement một **feature hoàn chỉnh** (không phải demo kỹ thuật đơn lẻ).
- Buộc học viên phải **tra thêm docs chính thức** (không đủ chỉ đọc `contents`).
- Đầu ra vẫn **ưu tiên code**; có thể thêm 1 docs ngắn nếu challenge phức tạp về thiết kế API/DB.

---

## 2. Nguyên tắc vàng - "Real feature, not toy example"

- Là **một feature có thể thấy trong dự án thật**: auth flow, CRUD có permission, upload file, pagination/search, background job cơ bản, webhook receiver...
- Kết hợp **≥ 2 kỹ thuật** đã học.
- Có **≥ 1 yêu cầu phi chức năng cơ bản**: validation, error shape thống nhất, transaction, soft delete, audit field...

### Ví dụ nâng cấp từ `easy`

| Bài học | `easy` | `medium` |
|---|---|---|
| ***NestJS Module / DI*** | `OrderService` gọi `InventoryService` | Feature "Đặt hàng": `OrderModule` + `InventoryModule` + `PaymentModule`, DTO validation, error mapping chuẩn |
| ***Request Lifecycle*** | 1 endpoint có Guard + Pipe | CRUD `Article` + auth guard + role guard + custom pipe + global exception filter |
| ***Auth*** | Login endpoint | JWT access + refresh token, logout invalidate, protected route theo role |

---

## 3. Yêu cầu bắt buộc

### 3.1. `requirements`

Ngoài yêu cầu chức năng, bắt buộc thêm:

- **DTO + validation** đầy đủ cho mọi input.
- **Error shape thống nhất** (ví dụ: `{ code, message, details? }`), phân biệt 4xx/5xx.
- **≥ 2 edge case cụ thể** nêu thẳng trong đề (ví dụ: duplicate email, concurrent update, input rỗng, token hết hạn).
- **Test**: **≥ 3 test case** (happy path + validation fail + business fail), chạy được bằng 1 lệnh.

### 3.2. `steps`

- Số step: **4 - 6**.
- Có **1 step dành riêng cho thiết kế** (DTO, schema, response shape, error codes) trước khi code.
- Có **1 step cho test + edge case**.
- Step cuối: chạy thật + trace execution.

### 3.3. `submissions` - ưu tiên code, có thể thêm docs ngắn

- Mặc định **1 `githubUrl`** (code + test + README chi tiết).
- **Tuỳ chọn** thêm **1 `googleDocsUrl`** (ngắn, 1-2 trang) giải thích **quyết định thiết kế** - chỉ thêm khi challenge có nhiều trade-off đáng bàn.
- `score` tổng: **40**.
- `prompts` mỗi submission: **2 - 3**, binary:
  - "Test suite chạy được bằng 1 lệnh, **tất cả** test pass, có đủ 3 case (happy / validation fail / business fail)" -> ___ điểm.
  - "Mọi endpoint có DTO validation; gọi với input xấu trả về đúng error shape đã định nghĩa" -> ___ điểm.
  - "README có section **Design Decisions** giải thích tại sao chọn shape/pattern này" -> ___ điểm.

### 3.4. README bắt buộc (nâng hơn `easy`)

Ngoài 4 mục như `easy`, thêm:

- **Design Decisions**: ≥ 2 quyết định kỹ thuật kèm lý do.
- **Edge cases covered**: liệt kê edge case và cách xử lý.
- **How to test**: lệnh chạy test, expected output.

---

## 4. CẤM

- CẤM challenge dễ đến mức pass bằng cách copy `easy` + thêm 1 field.
- CẤM yêu cầu kiến thức production (observability, HA, scaling) - đó là scope `hard`.
- CẤM prompt kiểu "có test đầy đủ" - phải nêu rõ số case + lệnh chạy.
- CẤM chấp nhận test fail - 1 test fail là **0 prompt test**.

---

## 5. Checklist publish

- [ ] Là một feature hoàn chỉnh, không phải demo kỹ thuật đơn.
- [ ] Kết hợp ≥ 2 kỹ thuật + ≥ 1 yêu cầu phi chức năng cơ bản.
- [ ] Liệt kê cụ thể ≥ 2 edge case.
- [ ] Test bắt buộc ≥ 3 case, chạy 1 lệnh.
- [ ] README có section **Design Decisions** + **Edge cases**.
- [ ] `difficulty: medium`, `score = 40`, tổng `prompts.score = 40`.
