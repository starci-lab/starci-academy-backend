# Lesson 2: CAP Theorem and Tradeoffs

Demo này minh họa sự đánh đổi giữa **Consistency (C)** và **Availability (A)** khi xảy ra **Network Partition (P)**.

## 1. Chuẩn bị (Prepare)

Hệ thống gồm 2 nodes: `node-us` (Mỹ) và `node-sg` (Singapore).

## 2. Demo 1: Chế độ CP (Ưu tiên nhất quán)

### Bước 1: Khởi chạy ở chế độ CP
```bash
docker compose -f .docker/cap-service-cp.yaml up -d
```

### Bước 2: Kiểm tra trạng thái bình thường
```bash
# Chuyển tiền tại US
curl -X POST http://localhost:6900/transfer -H "Content-Type: application/json" -d '{"amount": 500}'

# Kiểm tra số dư tại Singapore (Sẽ thấy 1500$)
curl -s http://localhost:6901/balance
```

### Bước 3: Giả lập đứt cáp (Network Partition)
Ngắt kết nối mạng của node Singapore:
```bash
docker network disconnect starci-network cap-node-sg
```

### Bước 4: Kiểm chứng sự đánh đổi
```bash
# Chuyển tiền tại US (Sẽ bị lỗi 503 vì không thể sync sang SG)
curl -X POST http://localhost:6900/transfer -H "Content-Type: application/json" -d '{"amount": 500}'
```
*Hệ thống từ chối ghi dữ liệu để bảo vệ tính nhất quán.*

---

## 3. Demo 2: Chế độ AP (Ưu tiên sẵn sàng)

### Bước 1: Khởi chạy lại ở chế độ AP
Dọn dẹp trước:
```bash
docker compose -f .docker/cap-service-cp.yaml down
```
Chạy lại:
```bash
docker compose -f .docker/cap-service-ap.yaml up -d
```

### Bước 2: Giả lập đứt cáp
```bash
docker network disconnect starci-network cap-node-sg
```

### Bước 3: Kiểm chứng sự đánh đổi
```bash
# Chuyển tiền tại US (Vẫn thành công!)
curl -X POST http://localhost:6900/transfer -H "Content-Type: application/json" -d '{"amount": 500}'

# Kiểm tra số dư tại Singapore (Vẫn là 1000$ - Dữ liệu cũ!)
curl -s http://localhost:6901/balance
```
*Hệ thống ưu tiên phục vụ request dù dữ liệu giữa 2 node đã bị lệch.*

## 4. Dọn dẹp (Cleanup)
```bash
docker compose -f .docker/cap-service-ap.yaml down
```
