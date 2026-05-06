# title
React Router Navigation

# description
Thực hành cấu hình routing client-side với React Router, bao gồm nested routes, dynamic params, và protected routes.

# body

## 1. Lời mở đầu

"App có 5 trang nhưng mỗi lần chuyển trang phải reload toàn bộ — làm sao giữ state?" — một **Senior Engineer** hỏi khi review SPA architecture. Một **Mid-level Developer** trả lời: "Em sẽ dùng window.location.href." Câu trả lời cho thấy nhận thức về navigation, nhưng vẫn thiếu chiều sâu về **client-side routing**: `location.href` reload page → mất state — **React Router** intercept URL changes, render component tương ứng mà không reload, giữ nguyên app state.

Bài này dẫn qua hai mạch liên tiếp:
- **Phần 2.1**: **thực hành**; **stack** gồm **React** + **Vite** + **React Router**, kèm **luồng** navigate giữa các trang, dynamic params, nested routes.
- **Phần 2.2**: **lý thuyết** làm rõ bản chất **client-side routing**, **History API**, và các **edge case**.

## 2. Các khái niệm cốt lõi

Cấu trúc bài học áp dụng phương pháp **Thực hành dẫn dắt Lý thuyết**. Khởi đầu, học viên clone source, chạy dev server bằng `npm run dev` và mở trình duyệt để navigate giữa các trang, quan sát URL thay đổi mà không reload. Tiếp theo, **phần lý thuyết** phân tích client-side routing, History API và các **edge cases**.

### 2.1. Thực hành

#### 2.1.1. Chuẩn bị source code và môi trường

Source: [StarCi-Academy/fullstack-mastery-module-8-react-basic](https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic) trên GitHub — thư mục bài học: [`3-react-router-navigation`](https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic/tree/main/3-react-router-navigation).

```bash
# Bước 1: Clone repository về máy local
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic.git

# Bước 2: Di chuyển vào đúng thư mục bài học
cd fullstack-mastery-module-8-react-basic/3-react-router-navigation
```

#### 2.1.2. Kiến trúc/thành phần (stack + luồng)

| Thành phần | File | Vai trò |
| --- | --- | --- |
| **BrowserRouter** | `src/main.tsx` | Router provider |
| **Routes** | `src/App.tsx` | Route definitions |
| **Home/About/UserDetail** | `src/pages/` | Page components |
| **Navbar** | `src/components/Navbar.tsx` | Navigation links |

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

##### 2.1.4.1. Luồng 1 — Navigate giữa các trang

  Mở trình duyệt tại **`http://localhost:5173`**. Click link "About" → URL đổi thành `/about` → component About render mà **không reload page**.

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:5173

  # macOS / Linux
  curl -s http://localhost:5173
  ```

##### 2.1.4.2. Luồng 2 — Dynamic params

  Navigate tới **`http://localhost:5173/users/1`** → component UserDetail nhận `id=1` từ URL params.

*Kết luận:*

- *Client-side routing — URL thay đổi mà không reload, state giữ nguyên.*
- *useParams — đọc dynamic params từ URL.*

#### 2.1.5. Dọn tài nguyên

Bài này không sử dụng Docker, không cần dọn tài nguyên.

#### 2.1.6. Đọc thêm

- **React Router:** Declarative routing for React. ([React Router Docs](https://reactrouter.com/))
- **History API:** Browser history management. ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/History_API))

### 2.2. Lý thuyết — Client-Side Routing

#### 2.2.1. Server-Side vs Client-Side Routing

| Server-Side | Client-Side |
| --- | --- |
| Server trả HTML mới mỗi request | JS intercept URL, render component |
| Full page reload | Không reload, giữ state |
| SEO tốt (SSR) | Cần SSR framework cho SEO |

#### 2.2.2. Các trường hợp biên (edge cases) cần lưu ý

- **Direct URL access:** Refresh `/about` → 404 trên production. **Giải pháp:** cấu hình server fallback tới `index.html`.
- **Nested routes:** Layout chung cho group pages. **Giải pháp:** dùng `<Outlet>` component.
- **Protected routes:** Trang yêu cầu login. **Giải pháp:** wrapper component check auth → redirect.
- **404 Not Found:** Route không match. **Giải pháp:** thêm catch-all route `path="*"`.

## 3. Tổng kết

### 3.1. Các câu hỏi dễ bị phỏng vấn

- **Câu hỏi 1:** Client-side routing khác server-side routing thế nào?
  - Trả lời mẫu: Client-side JS intercept URL, render component mà không reload. Server-side trả HTML mới mỗi request.

- **Câu hỏi 2:** Refresh trang `/about` trả 404 — vì sao?
  - Trả lời mẫu: Server không biết route `/about` → cần cấu hình fallback tới index.html.

- **Câu hỏi 3:** useParams dùng để làm gì?
  - Trả lời mẫu: Đọc dynamic params từ URL (ví dụ `/users/:id` → `{ id: "1" }`).

# references
## 0
### alias
React Router
### url
https://reactrouter.com/
## 1
### alias
MDN History API
### url
https://developer.mozilla.org/en-US/docs/Web/API/History_API

# minutesRead
15
