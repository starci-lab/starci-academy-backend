# title
Components, Props và State

# description
Thực hành xây dựng React components có thể tái sử dụng, truyền dữ liệu qua Props và quản lý trạng thái local bằng useState.

# body

## 1. Lời mở đầu

"Trang có 20 card sản phẩm giống nhau — em copy-paste HTML 20 lần à?" — một **Senior Engineer** hỏi khi review frontend code. Một **Mid-level Developer** trả lời: "Em sẽ dùng template string." Câu trả lời cho thấy nhận thức về code reuse, nhưng vẫn thiếu chiều sâu về **component abstraction**: template string không có lifecycle, không reactive — **React component** là function nhận **Props** (input) và quản lý **State** (local data), tự re-render khi state thay đổi.

Bài này dẫn qua hai mạch liên tiếp:
- **Phần 2.1**: **thực hành**; **stack** gồm **React** + **Vite** + **TypeScript**, kèm **luồng** tạo component → truyền props → toggle state.
- **Phần 2.2**: **lý thuyết** làm rõ bản chất **Props vs State**, **component lifecycle**, và các **edge case**.

## 2. Các khái niệm cốt lõi

Cấu trúc bài học áp dụng phương pháp **Thực hành dẫn dắt Lý thuyết**. Khởi đầu, học viên clone source, chạy dev server bằng `npm run dev` và mở trình duyệt để quan sát components nhận props và quản lý state qua useState. Tiếp theo, **phần lý thuyết** phân tích Props vs State, re-render cycle và các **edge cases**.

### 2.1. Thực hành

#### 2.1.1. Chuẩn bị source code và môi trường

Source: [StarCi-Academy/fullstack-mastery-module-8-react-basic](https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic) trên GitHub — thư mục bài học: [`1-components-props-and-state`](https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic/tree/main/1-components-props-and-state).

```bash
# Bước 1: Clone repository về máy local
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic.git

# Bước 2: Di chuyển vào đúng thư mục bài học
cd fullstack-mastery-module-8-react-basic/1-components-props-and-state
```

#### 2.1.2. Kiến trúc/thành phần (stack + luồng)

| Thành phần | File | Vai trò |
| --- | --- | --- |
| **App** | `src/App.tsx` | Root component, truyền props |
| **ProductCard** | `src/components/ProductCard.tsx` | Nhận props, hiển thị sản phẩm |
| **Counter** | `src/components/Counter.tsx` | useState quản lý đếm |

#### 2.1.3. Chuẩn bị & khởi chạy

##### 2.1.3.1. Điều kiện cần trước

- **Node.js** LTS, **npm**.

##### 2.1.3.2. Khởi động

```bash
# Bước 1: Cài dependency
npm install

# Bước 2: Khởi chạy dev server
npm run dev
```

Bài này không sử dụng Docker, không cần dọn tài nguyên.

#### 2.1.4. Kiểm thử

##### 2.1.4.1. Luồng 1 — Props truyền dữ liệu

  Mở trình duyệt tại **`http://localhost:5173`**. Trang hiển thị danh sách ProductCard nhận props (name, price). Thay đổi props trong App.tsx → HMR cập nhật.

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:5173

  # macOS / Linux
  curl -s http://localhost:5173
  ```

##### 2.1.4.2. Luồng 2 — State toggle

  Bấm nút Counter → số tăng. State thay đổi → component re-render.

*Kết luận:*

- *Props — dữ liệu truyền từ parent xuống child, read-only.*
- *State — dữ liệu local, mutable qua useState, trigger re-render.*

#### 2.1.5. Dọn tài nguyên

Bài này không sử dụng Docker, không cần dọn tài nguyên.

#### 2.1.6. Đọc thêm

- **React Components:** Function components và props. ([React Docs](https://react.dev/learn/your-first-component))
- **useState:** Hook quản lý state. ([React Docs](https://react.dev/reference/react/useState))

### 2.2. Lý thuyết — Props vs State

#### 2.2.1. So sánh

| Props | State |
| --- | --- |
| Truyền từ parent | Khai báo trong component |
| Read-only | Mutable (via setter) |
| Thay đổi → re-render child | Thay đổi → re-render self |

#### 2.2.2. Các trường hợp biên (edge cases) cần lưu ý

- **Mutate state trực tiếp:** `count++` thay vì `setCount`. **Giải pháp:** luôn dùng setter function.
- **State update bất đồng bộ:** setState không update ngay. **Giải pháp:** dùng functional update `setCount(prev => prev + 1)`.
- **Props drilling:** Truyền props qua nhiều tầng. **Giải pháp:** dùng Context API hoặc state management.
- **Object/Array state:** Reference không đổi → không re-render. **Giải pháp:** spread operator tạo object/array mới.

## 3. Tổng kết

### 3.1. Các câu hỏi dễ bị phỏng vấn

- **Câu hỏi 1:** Props khác State thế nào?
  - Trả lời mẫu: Props là input từ parent (read-only); State là data local trong component (mutable).

- **Câu hỏi 2:** Vì sao không mutate state trực tiếp?
  - Trả lời mẫu: React dùng reference comparison — mutate trực tiếp không trigger re-render.

- **Câu hỏi 3:** Key prop dùng để làm gì khi render list?
  - Trả lời mẫu: Giúp React identify element nào thay đổi/thêm/xóa trong reconciliation.

# references
## 0
### alias
React Components
### url
https://react.dev/learn/your-first-component
## 1
### alias
React useState
### url
https://react.dev/reference/react/useState

# minutesRead
15