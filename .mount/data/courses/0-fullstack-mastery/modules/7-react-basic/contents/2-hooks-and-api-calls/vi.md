# title
Hooks và API Calls

# description
Thực hành sử dụng useEffect để gọi API từ React, quản lý loading/error state, và hiểu lifecycle của hooks trong function component.

# body

## 1. Lời mở đầu

"Component cần fetch danh sách users từ backend khi mount — em gọi API ở đâu?" — một **Senior Engineer** hỏi khi review data fetching. Một **Mid-level Developer** trả lời: "Em gọi fetch() ngay trong body function." Câu trả lời cho thấy nhận thức về API call, nhưng vẫn thiếu chiều sâu về **side effect management**: gọi fetch trong render body → chạy mỗi lần re-render → infinite loop — **useEffect** hook kiểm soát side effect, chỉ chạy khi dependency thay đổi.

Bài này dẫn qua hai mạch liên tiếp:
- **Phần 2.1**: **thực hành**; **stack** gồm **React** + **Vite** + **TypeScript**, kèm **luồng** useEffect fetch → loading → render data.
- **Phần 2.2**: **lý thuyết** làm rõ bản chất **useEffect lifecycle**, **dependency array**, và các **edge case**.

## 2. Các khái niệm cốt lõi

Cấu trúc bài học áp dụng phương pháp **Thực hành dẫn dắt Lý thuyết**. Khởi đầu, học viên clone source, chạy dev server bằng `npm run dev` và mở trình duyệt để quan sát component fetch dữ liệu từ API, hiển thị loading state rồi render data. Tiếp theo, **phần lý thuyết** phân tích useEffect lifecycle, cleanup function và các **edge cases**.

### 2.1. Thực hành

#### 2.1.1. Chuẩn bị source code và môi trường

Source: [StarCi-Academy/fullstack-mastery-module-8-react-basic](https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic) trên GitHub — thư mục bài học: [`2-hooks-and-api-calls`](https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic/tree/main/2-hooks-and-api-calls).

```bash
# Bước 1: Clone repository về máy local
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic.git

# Bước 2: Di chuyển vào đúng thư mục bài học
cd fullstack-mastery-module-8-react-basic/2-hooks-and-api-calls
```

#### 2.1.2. Kiến trúc/thành phần (stack + luồng)

| Thành phần | File | Vai trò |
| --- | --- | --- |
| **App** | `src/App.tsx` | Root component |
| **UserList** | `src/components/UserList.tsx` | useEffect + fetch API |
| **API** | Public API (JSONPlaceholder) | Data source |

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

##### 2.1.4.1. Luồng 1 — Fetch và render data

  Mở trình duyệt tại **`http://localhost:5173`**. Component hiển thị "Loading..." → fetch API → render danh sách users.

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:5173

  # macOS / Linux
  curl -s http://localhost:5173
  ```

*Kết luận:*

- *useEffect — side effect chỉ chạy sau render, kiểm soát bởi dependency array.*
- *Loading state — UX pattern: loading → success/error.*

#### 2.1.5. Dọn tài nguyên

Bài này không sử dụng Docker, không cần dọn tài nguyên.

#### 2.1.6. Đọc thêm

- **useEffect:** Hook quản lý side effects. ([React Docs](https://react.dev/reference/react/useEffect))
- **Fetching Data:** Patterns và best practices. ([React Docs](https://react.dev/learn/synchronizing-with-effects))

### 2.2. Lý thuyết — useEffect Lifecycle

#### 2.2.1. Dependency Array

| Cú pháp | Khi nào chạy |
| --- | --- |
| `useEffect(fn)` | Mỗi lần render |
| `useEffect(fn, [])` | Chỉ mount (1 lần) |
| `useEffect(fn, [dep])` | Khi `dep` thay đổi |

#### 2.2.2. Các trường hợp biên (edge cases) cần lưu ý

- **Missing dependency:** Quên thêm variable vào dependency array. **Giải pháp:** dùng ESLint rule `exhaustive-deps`.
- **Race condition:** Component unmount trước khi fetch xong. **Giải pháp:** cleanup function với AbortController.
- **Infinite loop:** setState trong useEffect không có dependency. **Giải pháp:** luôn khai báo dependency array.
- **Stale closure:** Callback đọc state cũ. **Giải pháp:** dùng functional update hoặc useRef.

## 3. Tổng kết

### 3.1. Các câu hỏi dễ bị phỏng vấn

- **Câu hỏi 1:** useEffect dependency array rỗng [] nghĩa là gì?
  - Trả lời mẫu: Effect chỉ chạy 1 lần khi component mount — tương đương componentDidMount.

- **Câu hỏi 2:** Làm sao tránh race condition khi fetch trong useEffect?
  - Trả lời mẫu: Cleanup function return AbortController.abort() để cancel request khi unmount.

- **Câu hỏi 3:** Vì sao không gọi fetch trực tiếp trong render body?
  - Trả lời mẫu: Render body chạy mỗi re-render → fetch lặp vô tận. useEffect kiểm soát khi nào chạy.

# references
## 0
### alias
React useEffect
### url
https://react.dev/reference/react/useEffect
## 1
### alias
React Data Fetching
### url
https://react.dev/learn/synchronizing-with-effects

# minutesRead
15
