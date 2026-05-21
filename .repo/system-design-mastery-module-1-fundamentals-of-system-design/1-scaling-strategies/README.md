# Lesson 1: Scaling Strategies (Chiến lược mở rộng)

Demo này minh họa sự khác biệt giữa **Vertical Scaling** (Mở rộng dọc - Nâng cấp phần cứng) và **Horizontal Scaling** (Mở rộng ngang - Thêm máy chủ).

## 1. Chuẩn bị (Prepare)

Tạo network nếu chưa có:
```bash
docker network create starci-network
```

## 2. Demo 1: Vertical Scaling (Mở rộng dọc)

### Bước 1: Khởi chạy với cấu hình thấp (Low resources)
Trong file `.docker/scaling-service.yaml`, chúng ta giới hạn CPU ở mức `0.5`.

```bash
docker compose -f .docker/scaling-service.yaml up -d
```

### Bước 2: Kiểm tra hiệu năng
Gọi endpoint thực hiện tác vụ nặng:
```bash
curl "http://localhost:3000/api/heavy?load=50000000"
```
Ghi lại thời gian `duration` (ví dụ: 1200ms).

### Bước 3: Nâng cấp tài nguyên (Vertical Scale Up)
Sửa file `.docker/scaling-service.yaml`, đổi `cpus: '0.5'` thành `cpus: '2.0'`.

```bash
docker compose -f .docker/scaling-service.yaml up -d
```

### Bước 4: Kiểm chứng
Gọi lại endpoint trên. Bạn sẽ thấy `duration` giảm xuống đáng kể (ví dụ: 400ms).

---

## 3. Demo 2: Horizontal Scaling (Mở rộng ngang)

### Bước 1: Khởi chạy Nginx Load Balancer
```bash
docker compose -f .docker/nginx.yaml up -d
```

### Bước 2: Scale ngang lên 5 nodes
```bash
docker compose -f .docker/scaling-service.yaml up -d --scale scaling-service=5
```

### Bước 3: Kiểm chứng khả năng xé tải
Sử dụng cURL gọi vào cổng Nginx (**8081**):
```bash
curl -s http://localhost:8081/api/status
```
Gọi nhiều lần để thấy `servedBy` thay đổi liên tục giữa 5 container IDs.

## 4. Dọn dẹp (Cleanup)
```bash
docker compose -f .docker/scaling-service.yaml down
docker compose -f .docker/nginx.yaml down
```
