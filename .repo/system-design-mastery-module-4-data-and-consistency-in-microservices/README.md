# Data & consistency in microservices (StarCi demo repos)

Mono-repo style demos aligned with course module **3-data-and-consistency-in-microservices**:

| Folder | Topic | Stack |
|--------|--------|--------|
| `0-database-per-service` | Database per service + polyglot persistence | NestJS monorepo: Order→PostgreSQL (:3000), Inventory→MongoDB (:3001) |
| `1-cqrs-pattern` | CQRS write/read split | Command→PostgreSQL + RabbitMQ (:3000), Query→Elasticsearch (:3001) |
| `2-saga-pattern` | Saga choreography | Order (:3001), Payment (:3002), Inventory (:3003), SQLite per app, Kafka **KRaft** (docker-compose, không ZooKeeper) |

## Clone

```bash
git clone https://github.com/StarCi-Academy/system-design-mastery-module-4-data-and-consistency-in-microservices.git
cd system-design-mastery-module-4-data-and-consistency-in-microservices
```

Open each lesson folder and run `npm install` there.

## Environment

Each subproject includes a committed `.env` for local Docker ports (per StarCi content rules). Adjust if ports conflict on your machine.

## License

Educational use within StarCi Academy courses.

## Comment & cấu trúc (strict §4)
- `compose.yaml`: header + comment từng service (VI + EN).
- `*.service.ts` / `*.controller.ts`: mọi method có JSDoc **Logic —** + **Code —** + EN Logic/Code.
- Regenerate: `node scratch/comment_system_design_modules_1_11.mjs`

