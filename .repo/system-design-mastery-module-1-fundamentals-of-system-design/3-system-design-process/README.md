# Lesson 3: System Design Process

Dịch vụ này mô phỏng quy trình 4 bước thiết kế hệ thống chuẩn.

## 1. Khởi chạy (Startup)

```bash
docker compose -f .docker/process-service.yaml up -d
```

## 2. Các bước thực hiện (Steps)

### Bước 1: Làm rõ yêu cầu (Clarification)
```bash
curl -s "http://localhost:8083/process/1-clarify?name=TicketBookingSystem"
```

### Bước 2: Ước lượng (Estimation)
```bash
curl -s "http://localhost:8083/process/2-estimate?dau=10000000"
```

### Bước 3: Thiết kế cấp cao (High-Level Design)
```bash
curl -s "http://localhost:8083/process/3-design"
```

### Bước 4: Tinh chỉnh (Deep Dive)
```bash
curl -s "http://localhost:8083/process/4-deep-dive"
```

## 3. Dọn dẹp (Cleanup)
```bash
docker compose -f .docker/process-service.yaml down
```
