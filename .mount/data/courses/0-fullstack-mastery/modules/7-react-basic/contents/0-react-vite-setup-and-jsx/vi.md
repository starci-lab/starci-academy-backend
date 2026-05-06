# title
React Vite Setup và JSX

# description
Thiết lập project React bằng Vite, hiểu cấu trúc thư mục, viết JSX đầu tiên và render component lên trình duyệt.

# body

## 1. Lời mở đầu

"Frontend cần hiển thị dữ liệu động — em viết HTML thuần rồi dùng `innerHTML` để update?" — một **Senior Engineer** hỏi khi review frontend architecture. Một **Mid-level Developer** trả lời: "Em sẽ dùng jQuery." Câu trả lời cho thấy nhận thức về DOM manipulation, nhưng vẫn thiếu chiều sâu về **declarative UI**: jQuery imperative → code khó maintain khi scale — **React** khai báo UI như function của state, framework tự update DOM khi state thay đổi.

Bài này dẫn qua hai mạch liên tiếp:
- **Phần 2.1**: **thực hành**; **stack** gồm **React** + **Vite** + **TypeScript**, kèm **luồng** tạo project → viết JSX → render.
- **Phần 2.2**: **lý thuyết** làm rõ bản chất **Virtual DOM**, **JSX transpilation**, và các **edge case**.

## 2. Các khái niệm cốt lõi

Cấu trúc bài học áp dụng phương pháp **Thực hành dẫn dắt Lý thuyết**. Khởi đầu, học viên clone source, chạy dev server bằng `npm run dev` và mở trình duyệt để quan sát component React render. Tiếp theo, **phần lý thuyết** phân tích Virtual DOM, JSX transpilation và các **edge cases**.

### 2.1. Thực hành

#### 2.1.1. Chuẩn bị source code và môi trường

Source: [StarCi-Academy/fullstack-mastery-module-8-react-basic](https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic) trên GitHub — thư mục bài học: [`0-react-vite-setup-and-jsx`](https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic/tree/main/0-react-vite-setup-and-jsx).

```bash
# Bước 1: Clone repository về máy local
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic.git

# Bước 2: Di chuyển vào đúng thư mục bài học
cd fullstack-mastery-module-8-react-basic/0-react-vite-setup-and-jsx
```

#### 2.1.2. Kiến trúc/thành phần (stack + luồng)

| Thành phần | File | Vai trò |
| --- | --- | --- |
| **Vite** | `vite.config.ts` | Dev server + HMR |
| **App** | `src/App.tsx` | Root component |
| **main** | `src/main.tsx` | Entry point → ReactDOM.render |
| **index.html** | `index.html` | HTML shell |

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

##### 2.1.4.1. Luồng 1 — Render component trên trình duyệt

  Mở trình duyệt tại **`http://localhost:5173`** (Vite default port).

  Trang hiển thị nội dung từ `App.tsx`. Thử sửa text trong `App.tsx` → trình duyệt tự cập nhật (HMR).

  ```bash
  # Windows (PowerShell) — verify dev server running
  Invoke-RestMethod -Uri http://localhost:5173

  # macOS / Linux
  curl -s http://localhost:5173
  ```

*Kết luận:*

- *Vite — dev server với HMR, không cần refresh thủ công.*
- *JSX — viết HTML-like syntax trong TypeScript, transpile thành React.createElement().*

#### 2.1.5. Dọn tài nguyên

Bài này không sử dụng Docker, không cần dọn tài nguyên.

#### 2.1.6. Đọc thêm

- **React:** Declarative UI framework. ([React Docs](https://react.dev/))
- **Vite:** Next-gen frontend tooling. ([Vite Docs](https://vitejs.dev/))
- **JSX:** Syntax extension for JavaScript. ([React JSX](https://react.dev/learn/writing-markup-with-jsx))

### 2.2. Lý thuyết — Virtual DOM và JSX

#### 2.2.1. Virtual DOM

- React tạo **Virtual DOM** (JS object tree) → so sánh với DOM cũ → chỉ update phần thay đổi (**reconciliation**).
- Hiệu quả hơn `innerHTML` vì tránh full DOM reflow.

#### 2.2.2. JSX Transpilation

```
JSX: <h1>Hello</h1>
     ↓ Babel/SWC
JS:  React.createElement('h1', null, 'Hello')
```

#### 2.2.3. Các trường hợp biên (edge cases) cần lưu ý

- **JSX trả về nhiều root elements:** React yêu cầu 1 root. **Giải pháp:** wrap bằng `<>...</>` (Fragment).
- **className vs class:** JSX dùng `className` thay vì `class` (reserved keyword). **Giải pháp:** luôn dùng `className`.
- **Biểu thức trong JSX:** Chỉ expression, không statement. **Giải pháp:** dùng ternary thay `if/else`.
- **Key prop trong list:** Render list thiếu key → warning. **Giải pháp:** dùng unique id, tránh dùng index.

## 3. Tổng kết

### 3.1. Các câu hỏi dễ bị phỏng vấn

- **Câu hỏi 1:** Virtual DOM là gì và vì sao cần?
  - Trả lời mẫu: JS object tree đại diện DOM — React so sánh (diff) rồi chỉ update phần thay đổi, tránh full reflow.

- **Câu hỏi 2:** JSX có phải HTML không?
  - Trả lời mẫu: Không. JSX là syntax extension — transpile thành React.createElement() calls.

- **Câu hỏi 3:** Vite khác Create React App thế nào?
  - Trả lời mẫu: Vite dùng native ES modules + esbuild/SWC, nhanh hơn CRA (Webpack).

# references
## 0
### alias
React Documentation
### url
https://react.dev/
## 1
### alias
Vite Documentation
### url
https://vitejs.dev/

# minutesRead
14
