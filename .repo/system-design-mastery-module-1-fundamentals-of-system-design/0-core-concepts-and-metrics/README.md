# 0 — Core Concepts & Performance Metrics (Khái niệm cốt lõi & Chỉ số hiệu năng)

Demo cụm **Load Balancer** sử dụng **Nginx Round-robin** phân tải xuống nhiều **NestJS API Nodes**, chạy hoàn toàn bằng Docker Compose.

---

## 1. Kiến trúc (Architecture)

```
Client → Nginx Load Balancer (:8080) → API Node 1 (:3000)
                                     → API Node 2 (:3000)
                                     → API Node N (:3000)
```

| Component | Trách nhiệm | Framework |
|---|---|---|
| Nginx (Load Balancer) | Điều phối traffic, ngăn **Single Point of Failure** | Nginx Alpine |
| API Node 1..N | Xử lý request, trả hostname container để xác minh round-robin | NestJS |

---

## 2. Chuẩn bị (Prerequisites)

- Docker & Docker Compose

---

## 3. Khởi chạy (Startup)

```bash
# Khởi động cụm với 2 API Nodes mặc định (EN: start cluster with 2 default API Nodes)
docker compose -f .docker/status-service.yaml up -d --build

# Hoặc scale lên 5 Nodes để test phân tải (EN: or scale to 5 Nodes to test load distribution)
docker compose -f .docker/status-service.yaml up -d --build --scale status-service=5
```

---

## 4. Kiểm thử (Testing)

### Flow 1 — Phân tán tải qua Load Balancer (Throughput & Availability)

Gọi cURL nhiều lần liên tiếp:

```bash
curl -s http://localhost:8080/api/status
```

**Kết quả mong đợi:** Trường `servedBy` luân phiên xen kẽ giữa các hostname khác nhau (mỗi hostname = 1 container), chứng minh:

- **Availability**: Nếu 1 node chết, Nginx tự động đá traffic sang node còn lại
- **Throughput**: Tải được chia đều, mỗi node chỉ chịu 1/N request

---

## 5. Dọn tài nguyên (Cleanup)

```bash
# Tắt và dọn dẹp toàn bộ cụm (EN: stop and cleanup entire cluster)
docker compose -f .docker/status-service.yaml down
```

---

## 6. System Flow

```
Client
  │
  ▼
Nginx Load Balancer (Round-robin)
  │
  ├──► API Node 1 (NestJS) ──► GET /api/status ──► { servedBy: "container-id-1" }
  ├──► API Node 2 (NestJS) ──► GET /api/status ──► { servedBy: "container-id-2" }
  └──► API Node N (NestJS) ──► GET /api/status ──► { servedBy: "container-id-N" }
```
