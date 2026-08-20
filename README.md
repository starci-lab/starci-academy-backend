# StarCi Academy — Backend Curriculum

[![Codecov](https://codecov.io/gh/starci-lab/starci-academy-backend/graph/badge.svg?token=6IGELNAJ2G)](https://app.codecov.io/gh/starci-lab/starci-academy-backend)
[![SonarQube Quality Gate](https://sonar.starci.org/api/project_badges/measure?project=starci-academy-backend&metric=alert_status&token=sqb_f24db4ee767de019595e0538804586fa00705303)](https://sonar.starci.org/dashboard?id=starci-academy-backend)
[![SonarQube Coverage](https://sonar.starci.org/api/project_badges/measure?project=starci-academy-backend&metric=coverage&token=sqb_f24db4ee767de019595e0538804586fa00705303)](https://sonar.starci.org/dashboard?id=starci-academy-backend)
[![SonarQube Bugs](https://sonar.starci.org/api/project_badges/measure?project=starci-academy-backend&metric=bugs&token=sqb_f24db4ee767de019595e0538804586fa00705303)](https://sonar.starci.org/dashboard?id=starci-academy-backend)
[![SonarQube Vulnerabilities](https://sonar.starci.org/api/project_badges/measure?project=starci-academy-backend&metric=vulnerabilities&token=sqb_f24db4ee767de019595e0538804586fa00705303)](https://sonar.starci.org/dashboard?id=starci-academy-backend)
[![SonarQube Code Smells](https://sonar.starci.org/api/project_badges/measure?project=starci-academy-backend&metric=code_smells&token=sqb_f24db4ee767de019595e0538804586fa00705303)](https://sonar.starci.org/dashboard?id=starci-academy-backend)
[![SonarQube Maintainability](https://sonar.starci.org/api/project_badges/measure?project=starci-academy-backend&metric=sqale_rating&token=sqb_f24db4ee767de019595e0538804586fa00705303)](https://sonar.starci.org/dashboard?id=starci-academy-backend)
[![SonarQube Reliability](https://sonar.starci.org/api/project_badges/measure?project=starci-academy-backend&metric=reliability_rating&token=sqb_f24db4ee767de019595e0538804586fa00705303)](https://sonar.starci.org/dashboard?id=starci-academy-backend)
[![SonarQube Security](https://sonar.starci.org/api/project_badges/measure?project=starci-academy-backend&metric=security_rating&token=sqb_f24db4ee767de019595e0538804586fa00705303)](https://sonar.starci.org/dashboard?id=starci-academy-backend)

Mono-repo quản lý toàn bộ nội dung khoá học **Fullstack Mastery** và **System Design Mastery** của [StarCi Academy](https://github.com/StarCi-Academy).

---

## Cấu trúc thư mục

```
starci-academy-backend/
├── .mount/data/
│   ├── courses/
│   │   ├── 0-fullstack-mastery/          # Khoá Fullstack Mastery
│   │   │   └── modules/0..7/             # 8 modules, mỗi module có contents/
│   │   └── 1-system-design-mastery/      # Khoá System Design Mastery
│   │       └── modules/0..7/             # 8 modules
│   └── rules/                            # Quy tắc format chung
│       ├── fullstack-format.md           # Format tài liệu Fullstack
│       ├── system-design-format.md       # Format tài liệu System Design
│       └── coding-rules.md              # Quy tắc code (barrel, config, Docker)
├── system-design-mastery-module-*/       # Clone từng module repo (GitHub) cạnh mono-repo
└── fullstack-mastery-module-*/
```

---

## Khoá học

### 0 — Fullstack Mastery

| Module | Tên | Repos |
| --- | --- | --- |
| 0 | Backend Environment & NestJS Introduction | [module-1](https://github.com/StarCi-Academy/fullstack-mastery-module-1-backend-environment-nestjs-introduction) |
| 1 | Database Integration (ORM, ODM, Caching) | [module-2](https://github.com/StarCi-Academy/fullstack-mastery-module-2-database-integration-orm-odm-caching) |
| 2 | REST API Development & Documentation | [module-3](https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation) |
| 3 | Authentication, Authorization (JWT, RBAC) | [module-4](https://github.com/StarCi-Academy/fullstack-mastery-module-4-authentication-authorization-jwt-rbac) |
| 4 | WebSocket & Realtime Communication | [module-5](https://github.com/StarCi-Academy/fullstack-mastery-module-5-websocket-and-realtime-communication) |
| 5 | Email, SMS & OTP | [module-6](https://github.com/StarCi-Academy/fullstack-mastery-module-6-email-sms-otp) |
| 6 | Workers & Cron Jobs | [module-7](https://github.com/StarCi-Academy/fullstack-mastery-module-7-workers-and-cron-jobs) |
| 7 | React Basic | [module-8](https://github.com/StarCi-Academy/fullstack-mastery-module-8-react-basic) |

### 1 — System Design Mastery

| Module | Tên | Repos |
| --- | --- | --- |
| 0 | Fundamentals of System Design | [module-1](https://github.com/StarCi-Academy/system-design-mastery-module-1-fundamentals-of-system-design) |
| 1 | Microservices & Kubernetes Fundamentals | [module-2](https://github.com/StarCi-Academy/system-design-mastery-module-2-microservices-kubernetes-fundamentals) |
| 2 | Communication Patterns | [module-3](https://github.com/StarCi-Academy/system-design-mastery-module-3-communication-patterns) |
| 3 | Data & Consistency in Microservices | [module-4](https://github.com/StarCi-Academy/system-design-mastery-module-4-data-and-consistency-in-microservices) |
| 4 | Monitoring & Observability | [module-7](https://github.com/StarCi-Academy/system-design-mastery-module-7-monitoring-and-observability) |
| 5 | Reliability & Resilience Patterns | [module-6](https://github.com/StarCi-Academy/system-design-mastery-module-6-reliability-and-resilience-patterns) |
| 6 | Scalability & Performance | [module-5](https://github.com/StarCi-Academy/system-design-mastery-module-5-scalability-and-performance) |
| 7 | Security & Identity Management | [module-8](https://github.com/StarCi-Academy/system-design-mastery-module-8-security-and-identity-management) |

---

## Nội dung bài học

Mỗi bài học (`contents/<lesson>/`) gồm:

| File | Mô tả |
| --- | --- |
| `en.md` | Nội dung tiếng Anh |
| `vi.md` | Nội dung tiếng Việt |
| `test.md` | Kết quả kiểm thử (PASSED / FAILED) |
| `challenges/` | Bài tập thực hành (nếu có) |

Cấu trúc bài tuân theo **practice-led theory**: thực hành trước (2.1) → lý thuyết sau (2.2).

---

## Quy tắc format

Tất cả nội dung tuân theo các quy tắc strict trong `.mount/data/rules/`:

- **`fullstack-format.md`** — Backend NestJS chạy local (`nest start --watch`), Docker chỉ cho infrastructure.
- **`system-design-format.md`** — Toàn bộ stack chạy qua Docker Compose / Kubernetes.
- **`coding-rules.md`** — Barrel imports, ConfigModule, Docker patterns.

---

## Cách chạy bài học

### Fullstack Mastery

```bash
# Clone repo module
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-<N>-<name>.git
cd <repo>/<lesson>

# Khởi động infrastructure (nếu có)
docker compose -f .docker/compose.yaml up -d

# Cài dependency + chạy
npm install
nest start --watch
```

### System Design Mastery

```bash
# Clone repo module
git clone https://github.com/StarCi-Academy/system-design-mastery-module-<N>-<name>.git
cd <repo>/<lesson>/.docker

# Khởi động toàn bộ stack
docker compose up -d
```

> **Lưu ý:** Các biến môi trường mặc định đã được cấu hình sẵn qua `ConfigModule`. Không cần tạo hay sửa `.env` khi chạy hệ thống.

---

## Tech Stack

- **Backend:** NestJS, TypeScript, TypeORM, Mongoose
- **Databases:** PostgreSQL, MongoDB, Redis
- **Infrastructure:** Docker, Docker Compose, Kubernetes
- **Monitoring:** Prometheus, Grafana, Jaeger, Consul
- **Communication:** Socket.IO, gRPC, RabbitMQ, Kafka
- **Frontend:** React, Vite

---

## License

MIT © [StarCi Academy](https://github.com/StarCi-Academy)
