# System Design Mastery - Repository & Coding Rules

Tài liệu này quy định các tiêu chuẩn kỹ thuật cho toàn bộ các bài học trong chương trình **System Design Mastery**. Các bài học phải tuân thủ cấu trúc "Gold Standard" và các quy tắc triển khai hạ tầng dưới đây.

---

## 1. Cấu trúc thư mục (Folder Structure)

Mỗi bài học (Lesson) phải được tổ chức thành các thư mục con rõ ràng:

```text
[lesson-folder]/
├── .docker/                  # (Tuỳ bài) Compose — Docker trên máy dev
│   ├── nginx.conf            # Cấu hình Nginx (nếu có)
│   ├── nginx.yaml            # Compose cho Orchestrator
│   └── [service-name].yaml   # Compose cho các Worker service
├── .kubernetes/              # (Tuỳ bài) Manifest Kubernetes — triển khai trên Minikube / cluster
│   ├── 00-namespace.yaml     # Namespace (đặt tên 00-... để apply trước khi cần)
│   ├── deployment-*.yaml
│   └── service-*.yaml
├── [service-name]/           # Thư mục chứa mã nguồn backend (ví dụ: status-service)
│   ├── src/                  # Mã nguồn NestJS/Node.js
│   ├── Dockerfile            # Multi-stage Dockerfile
│   ├── package.json
│   └── tsconfig.json
└── README.md                 # Hướng dẫn chi tiết (EN/VI)
```

- Bài **Docker / Compose** dùng thư mục **`.docker/`**; bài **Kubernetes / Minikube** dùng **`.kubernetes/`** — không trộn hai cách trong cùng một bài trừ khi có lý do pedagogical rõ ràng trong README.

---

## 2. Quy tắc Docker & Infrastructure

### 2.1. Tách biệt Service (Service Isolation)
- **Không gộp chung**: Các service hạ tầng (Nginx, Database) và service nghiệp vụ (Backend) phải nằm trong các file Compose riêng biệt.
- **Mục đích**: Để học viên có thể thực hành scale worker mà không làm ảnh hưởng đến orchestrator.

### 2.2. Mạng nội bộ (Networking)
- Tất cả các service phải sử dụng chung một mạng external mang tên `starci-network`.
- Phải có hướng dẫn tạo mạng: `docker network create starci-network`.

### 2.3. Cloud Image (Docker Hub)
- Toàn bộ service backend phải được build và push lên Docker Hub của StarCi (`starciacademy/[image-name]`).
- Trong file Compose, ưu tiên sử dụng `image` từ cloud. Phần `build` có thể giữ lại nhưng phải đảm bảo service có thể chạy ngay lập tức mà không cần source code local.

---

## 3. Quy tắc Coding (Backend Standard)

### 3.1. ESLint & Style
- Sử dụng cấu hình ESLint chung tại root: `indent: 4`, `semi: never`, `quotes: double`.
- Tự động xuống dòng cho các Object và Import phức tạp.

### 3.2. Tài liệu JSDoc
- Phải có chú thích song ngữ (VI + EN).
- **Tuyệt đối không dùng tag `@returns`**: Để đảm bảo code gọn gàng, chỉ mô tả chức năng của hàm.

### 3.3. Logging
- Sử dụng `Logger` tích hợp sẵn của framework (ví dụ: NestJS Logger).
- Log phải rõ ràng kịch bản: `[Worker Hostname] + [Hành động]`.

---

## 4. Quy trình triển khai (Workflow)

Mỗi demo phải tuân thủ quy trình 4 bước:

**Nhánh Docker (Compose):**
1. **Prepare**: Tạo network, pull image.
2. **Sign**: Xác nhận cấu hình trong các file `.docker/*.yaml`.
3. **Execute**: Chạy lệnh scale (ví dụ: `--scale status-service=5`).
4. **Confirm**: Sử dụng cURL để kiểm chứng (Round-robin, Failover, v.v.).

**Nhánh Kubernetes (Minikube):**
1. **Prepare**: `minikube start` (hoặc cluster tương đương), build/push image `starciacademy/...` (Build trong `minikube docker-env` nếu dùng image local).
2. **Sign**: Rà soát manifest trong `.kubernetes/*.yaml` (Namespace, Deployment, Service).
3. **Execute**: `kubectl apply -f .kubernetes/`, `kubectl scale deployment ...` khi cần.
4. **Confirm**: Lấy URL qua `minikube service <name> -n <namespace> --url` (hoặc `kubectl port-forward`); kiểm chứng bằng cURL.

---

## 5. Mẫu Docker Compose chuẩn

```yaml
services:
  [service-name]:
    image: starciacademy/[image-name]:latest
    # build:
    #   context: ../[service-name]
    #   dockerfile: Dockerfile
    expose:
      - "3000"
    restart: unless-stopped
    networks:
      - starci-network

networks:
  starci-network:
    external: true
    name: starci-network
```

---

## 6. Kubernetes trên Minikube (`.kubernetes/`)

### 6.1. Vị trí manifest

- Toàn bộ **YAML** cho bài Kubernetes đặt trong **`.kubernetes/`** (tương đương vai trò của `.docker/` trong bài Compose).
- Cuối mỗi file (hoặc nhóm file liên quan) nên có comment **`# Run command:`** và ví dụ **`kubectl apply -f .kubernetes/`**, **`kubectl scale ...`**, **`minikube service ... --url`** để học viên copy được ngay.

### 6.2. Namespace và thứ tự apply

- Dùng Namespace riêng (ví dụ `starci-demo`) để tách demo khỏi `default`.
- Đặt tên file Namespace với tiền tố số (**`00-namespace.yaml`**) để `kubectl apply -f .kubernetes/` apply Namespace trước các resource phụ thuộc.

### 6.3. Image

- Giữ quy ước **Docker Hub StarCi**: `starciacademy/[image-name]:latest`.
- Trên **Minikube**, hướng dẫn build image trong Docker daemon của Minikube (`eval "$(minikube docker-env)"`) hoặc push image lên registry rồi để cluster pull.

### 6.4. Truy cập từ máy host

- Ưu tiên **NodePort** hoặc **`minikube service ... --url`** trong README để học viên gọi API bằng cURL không cần nhớ IP cố định.

### 6.5. Không dùng `.docker/` trong bài thuần Kubernetes

- Bài chỉ dạy triển khai qua Kubernetes không bắt buộc có `.docker/`; tránh nhầm lẫn hai luồng trừ khi README so sánh có chủ đích.
