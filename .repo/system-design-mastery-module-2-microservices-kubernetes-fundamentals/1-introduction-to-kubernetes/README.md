# 1 — Introduction to Kubernetes (Giới thiệu Kubernetes trên Minikube)

Demo triển khai **Deployment + Service (NodePort)** trên **Minikube**, chạy **NestJS Status API** nhiều replica; gọi qua Service để thấy trường `servedBy` luân phiên theo **Pod hostname** (minh họa cân bằng tải trong cluster).

---

## 1. Kiến trúc (Architecture)

```
Client → Minikube Node IP : NodePort 30080 → Service status-service (cluster) → Pod 1..N :3000 (NestJS)
```

| Component | Trách nhiệm | Stack |
|---|---|---|
| **Deployment** | Giữ `status-service` chạy đủ số replica | Kubernetes |
| **Service (NodePort)** | Expose cổng trên node Minikube để curl từ máy host | Kubernetes |
| **Pod / NestJS** | Xử lý `GET /api/status`, trả hostname Pod trong `servedBy` | NestJS |

---

## 2. Chuẩn bị (Prerequisites)

- **Minikube** + **kubectl**
- **Docker** (để build image trong Docker daemon của Minikube)

---

## 3. Khởi chạy trên Minikube (Startup)

### Bước A — Khởi động cluster

```bash
minikube start
```

### Bước B — Build image trong Docker của Minikube

Để Kubernetes trong Minikube dùng được image local, build **trong** Docker daemon của profile Minikube:

```bash
# Trỏ Docker CLI sang daemon của Minikube (EN: point Docker CLI to Minikube daemon)
eval "$(minikube docker-env)"

cd status-service
docker build -t starciacademy/introduction-to-kubernetes-status-service:latest .
cd ..
```

*(Tuỳ chọn production / CI: push image `starciacademy/introduction-to-kubernetes-status-service:latest` lên Docker Hub rồi bỏ bước `eval` — cluster sẽ pull image.)*

### Bước C — Áp manifest trong `.kubernetes/`

```bash
kubectl apply -f .kubernetes/
```

### Bước D — Lấy URL và gọi API

```bash
minikube service status-service -n starci-demo --url
```

Gán URL vào biến và gọi (hoặc paste trực tiếp):

```bash
BASE_URL="$(minikube service status-service -n starci-demo --url)"
curl -s "${BASE_URL}/api/status"
```

---

## 4. Kiểm thử (Testing)

### Flow 1 — Pod hostname luân phiên (Availability qua nhiều replica)

Gọi **nhiều lần** để quan sát `servedBy` đổi giữa các Pod (kube-proxy phân phối qua Service):

```bash
for i in $(seq 1 10); do curl -s "${BASE_URL}/api/status"; echo; done
```

**Kết quả mong đợi:** JSON có `servedBy` là hostname Pod khác nhau khi có ≥ 2 replica khỏe.

### Flow 2 — Scale Deployment

```bash
kubectl scale deployment status-service -n starci-demo --replicas=5
kubectl get pods -n starci-demo -l app=status-service
```

Sau đó lặp lại vòng `curl` ở Flow 1.

---

## 5. Dọn tài nguyên (Cleanup)

```bash
kubectl delete -f .kubernetes/
minikube stop
```

---

## 6. System Flow

```
Client (host)
  │
  ▼
NodePort :30080 (Minikube VM)
  │
  ▼
Service status-service (Namespace starci-demo)
  │
  ├──► Pod A — NestJS GET /api/status → { servedBy: pod-a-..., ... }
  ├──► Pod B — NestJS GET /api/status → { servedBy: pod-b-..., ... }
  └──► Pod N ...
```
