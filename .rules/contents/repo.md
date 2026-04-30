# 🚀 Antigravity Coding Rules

## 1. General Principles

* Code phải **readable > clever**
* Ưu tiên **consistency theo project** hơn là “best practice chung chung”
* Mọi logic phải **có comment giải thích**
* Code sinh ra phải **production-ready**, không phải demo

---

## 2. Function Documentation (BẮT BUỘC)

Tất cả function phải có comment dạng:

```ts
/**
 * Mô tả chức năng của hàm
 *
 * @param userId - ID của user (EN: user identifier)
 * @param amount - Số lượng token (EN: token amount)
 * @returns Promise<number> - Số dư sau khi xử lý
 */
```

### Rules:

* Viết **song ngữ (VI + EN)**
* Giải thích rõ:

  * input là gì
  * output là gì
  * side effects (nếu có)

---

## 3. Line-by-line Comments (BẮT BUỘC)

Mỗi dòng logic quan trọng phải có comment:

```ts
// Lấy thông tin user từ DB (EN: fetch user from database)
const user = await this.userRepo.findById(userId)

// Kiểm tra số dư đủ hay không (EN: validate sufficient balance)
if (user.balance < amount) {
    throw new Error("Insufficient balance")
}
```

### Rules:

* Comment **ngay trên dòng code**
* Không viết chung chung kiểu “do something”
* Phải giải thích **WHY**, không chỉ WHAT

---

## 4. Project Structure

### 4.1 Barrel Export (BẮT BUỘC)

Luôn dùng `index.ts` để re-export:

```ts
// services/index.ts
export * from "./user.service"
export * from "./auth.service"
```

### Rules:

* Không import deep path
* Import qua:

```ts
import { UserService } from "@/services"
```

---

## 5. Docker Rules

### 5.1 File Structure

Tất cả docker compose phải đặt trong:

```
.docker/<instance>.yaml
```

### Ví dụ:

```
.docker/keycloak.yaml
.docker/postgresql.yaml
.docker/redis.yaml
```

---

### 5.2 Naming Convention

| Service    | File name         |
| ---------- | ----------------- |
| Keycloak   | `keycloak.yaml`   |
| PostgreSQL | `postgresql.yaml` |
| Redis      | `redis.yaml`      |

---

### 5.3 Image Source

* Ưu tiên:

  * `docker.io` (official images)
  * `quay.io`
* ❌ Không dùng image không rõ nguồn gốc

---

### 5.4 Command Convention

Sau mỗi file docker phải có comment:

```yaml
# Run command:
# docker compose -f .docker/keycloak.yaml up --build -d
```

---

## 6. README (BẮT BUỘC CHI TIẾT)

README phải cover toàn bộ flow:

### 6.1 Setup

```bash
npm install
```

---

### 6.2 Run Services (Docker)

```bash
docker compose -f .docker/postgresql.yaml up --build -d
docker compose -f .docker/keycloak.yaml up --build -d
```

---

### 6.3 Run Application

```bash
npm run dev
```

---

### 6.4 System Flow (BẮT BUỘC)

Phải mô tả:

* Luồng xử lý chính
* Data flow
* Service interaction

Ví dụ:

```
Client → Controller → Service → Repository → Database
```

---

### 6.5 Advanced Flow (Nếu có)

* Saga / job processing
* Queue / worker
* Retry / rollback logic

---

## 7. Code Style

### 7.1 Naming

* function: `camelCase`
* class: `PascalCase`
* constant: `UPPER_CASE`

---

### 7.2 Error Handling

* Không swallow error
* Luôn log rõ ràng

```ts
// Log lỗi chi tiết (EN: log detailed error)
this.logger.error("Failed to execute transaction", error)
```

---

## 8. Service Pattern (QUAN TRỌNG)

Phải follow pattern:

```
prepare → sign → execute → confirm
```

### Rules:

* Không skip step
* Mỗi step là 1 responsibility riêng
* Có retry logic rõ ràng

---

## 9. Logging

* Dùng structured logging
* Log phải có context:

```ts
this.logger.log({
    message: "Execute transaction success",
    userId,
    amount,
})
```

---

## 10. Anti-Patterns (CẤM)

❌ Không được:

* Viết code không comment
* Hardcode config
* Import sâu (deep import)
* Docker file đặt lung tung
* README sơ sài
* Logic trong controller

---

## 11. AI Behavior Rules

Antigravity khi generate code phải:

* Tuân thủ 100% rules này
* Không bỏ qua comment
* Không simplify logic nếu làm mất clarity
* Ưu tiên code dễ maintain

---

# ✅ Summary

* Comment: **song ngữ + chi tiết**
* Docker: **.docker/<service>.yaml**
* Export: **index.ts**
* README: **full flow từ A → Z**
* Pattern: **prepare → sign → execute → confirm**

---

> Đây là coding standard chính thức cho toàn bộ project.
