# title
Xây dựng Socket.IO Gateway với kiến trúc NestJS chuẩn

# description
Dựng ChatGateway và ChatService để nhận, lưu trữ PostgreSQL, và broadcast tin nhắn realtime, nắm vững decorator @WebSocketGateway và @SubscribeMessage.

# body

## 1. Mục tiêu

Trong challenge này, bạn sẽ tự tay xây dựng một **Socket.IO Gateway** hoàn chỉnh. Thay vì chỉ ping/pong đơn giản, bạn sẽ áp dụng kiến trúc chuẩn của NestJS:
- Tạo `ChatGateway` để nhận kết nối, xử lý logic join room bằng event `joinRoom` và lắng nghe event `chatToServer`.
- Gửi dữ liệu sang `ChatService` để thực hiện câu lệnh Insert vào PostgreSQL thông qua `TypeOrmModule`.
- Sau khi lưu thành công, dùng đối tượng `Server` của Socket.IO để phát sóng (broadcast) sự kiện `chatToClient` mang theo dữ liệu tin nhắn mới nhất cho các client **trong cùng một phòng (room)**.

Đây là nền tảng cốt lõi cho mọi ứng dụng Chat App, Notification, hay Live Tracking.

## 2. Hướng dẫn

### 2.1. Yêu cầu hệ thống

1. Khởi tạo `ChatGateway` lắng nghe trên port mặc định của ứng dụng (Port 3000).
2. Tạo bảng `chat_message` qua Entity `ChatMessage` với các trường `id`, `senderId`, `nickname`, `room`, `text`, `createdAt`.
3. Nhận event `joinRoom` để xử lý gán `client.data.room` và `client.join(room)`.
4. Khi nhận event `chatToServer` với payload `{ room: string, text: string }`, Gateway sẽ kiểm tra `client.data` và gọi `ChatService` lưu record xuống database PostgreSQL.
5. Ngay sau khi lưu, Gateway phát event `chatToClient` mang đúng thông tin tin nhắn vừa lưu ra toàn bộ mạng lưới **nhưng chỉ giới hạn trong phòng đó (broadcast to room)**.
6. Sử dụng giao diện HTML client tĩnh (mở 2 tab trình duyệt bằng **Live Server**) để test quá trình join room và gửi nhận tin giữa 2 user.

### 2.2. Gợi ý cấu trúc

Bạn nên tham khảo source code mẫu để thiết lập kiến trúc. Sơ đồ gợi ý:

```text
src/
 ├── modules/
 │    └── chat/
 │         ├── chat.module.ts
 │         ├── chat.gateway.ts
 │         ├── chat.service.ts
 │         ├── entities/
 │         │    └── chat-message.entity.ts
 │         └── dto/
 │              └── chat-message.dto.ts
 ├── app.module.ts (chứa TypeOrmModule.forRoot)
 └── main.ts
```

- **Bước 1**: Khai báo `ChatMessage` entity và tích hợp `TypeOrmModule` vào ứng dụng (nhớ chạy PostgreSQL container).
- **Bước 2**: Khai báo class `ChatGateway` và sử dụng `@WebSocketGateway()`. Đừng quên khai báo nó như một provider trong `ChatModule`.
- **Bước 3**: Bên trong `ChatGateway`, sử dụng decorator `@WebSocketServer()` để inject đối tượng `Server` của Socket.IO.
- **Bước 4**: Tạo method `handleJoinRoom` được trang trí bởi `@SubscribeMessage('joinRoom')` để gán `client.join(room)`.
- **Bước 5**: Tạo một method (ví dụ `handleChat`) được trang trí bởi `@SubscribeMessage('chatToServer')`.
- **Bước 6**: Trong `handleChat`, gọi `ChatService.saveMessage(...)`, sau đó gọi `this.server.to(session.room).emit('chatToClient', savedMessage)` để broadcast riêng cho phòng.

## 3. Hoàn thành

Bạn đã nắm được cách tích hợp database vào hệ thống realtime.
Nếu chỉ broadcast trong bộ nhớ (in-memory), tin nhắn sẽ mất khi server restart. Việc gọi **Service** để lưu vào **PostgreSQL** đảm bảo tính bền vững (persistent) của dữ liệu.

Đồng thời, bạn cũng thấy sức mạnh của việc chia tách trách nhiệm: **Gateway** chỉ lo nhận và gửi event, còn **Service** đảm đương việc giao tiếp với Database.

**Tuy nhiên, có một lỗ hổng bảo mật nghiêm trọng ở challenge này:** Việc chúng ta để client gửi `senderId` trong payload `chatToServer` là cực kỳ nguy hiểm. Hacker có thể dùng Postman hoặc sửa code JS client để gửi một `senderId` của người khác (ví dụ của Admin), dẫn đến hành vi giả mạo danh tính (identity spoofing). 

Để giải quyết vấn đề này, hãy chuyển sang bài học tiếp theo: **Xác thực Socket tại lớp Handshake với JWT**, nơi bạn sẽ bắt buộc lấy định danh người gửi từ server thông qua Token thay vì tin tưởng client.
