# 1-the-data-bottleneck

Lesson support for **The Data Bottleneck**: **NestJS** + **TypeORM replication** (1 Bitnami PostgreSQL primary + 2 read replicas) + **Redis** (Bitnami) **cache-aside**.

Docker Compose files use **schema version `3.8`** and the shared external network **`starci-network`** (see `system-design.md` in the main rules repo).

## Layout

| Path | Purpose |
|------|---------|
| **`.docker/postgresql-ha.yaml`** | Bitnami **PostgreSQL 16** — `postgresql-primary`, `postgresql-read-1`, `postgresql-read-2` (streaming replication). |
| **`.docker/redis.yaml`** | Bitnami **Redis 7.4** — cache layer for cache-aside reads. |
| **`.docker/api-service.yaml`** | **api-service** image `starciacademy/the-data-bottleneck-api-service:latest` (optional local `build`). |
| **`api-service/`** | NestJS source: TypeORM `replication`, [`CacheModule`](https://docs.nestjs.com/techniques/caching) + **Keyv** store [`@keyv/redis`](https://github.com/jaredwray/keyv) (`cache-manager` v7), `/users` CRUD demo. |

## Prerequisites

- Docker & Docker Compose (Compose file format **3.8**).
- Node.js **>= 20** (local dev for `api-service`).

## Prepare

```bash
docker network create starci-network
```

## Execute (all stacks merged)

From **`1-the-data-bottleneck/`**:

```bash
docker compose \
  -f .docker/postgresql-ha.yaml \
  -f .docker/redis.yaml \
  -f .docker/api-service.yaml \
  up -d
```

Wait until replicas finish catching up (first boot can take **~1–2 minutes**). Then:

```bash
curl -s http://localhost:3000/health
curl -s http://localhost:3000/debug/replication
```

Expected JSON shape for `/debug/replication`: `masterPgIsInRecovery: false`, `sampleReadPoolPgIsInRecovery: true`.

## Local dev (without publishing the image)

```bash
# Terminals: bring up DB + Redis only (same compose merge, scale api-service to 0 or omit api file)
docker compose -f .docker/postgresql-ha.yaml -f .docker/redis.yaml up -d

cd api-service
cp .env.example .env   # if you add one; or export vars inline
npm install
npm run start:dev
```

Use the same env vars as in `.docker/api-service.yaml` (`POSTGRES_*`, `REDIS_*`).

## Confirm (lab flows)

**Write → master**

```bash
curl -s -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Cuong\",\"email\":\"cuong@starci.net\"}"
```

Watch logs: `INSERT` + explicit master runner message.

**Read → replica pool + Redis**

```bash
curl -s http://localhost:3000/users/1
curl -s http://localhost:3000/users/1
```

First call: cache miss + `SELECT` (TypeORM routes to replicas). Second call: Redis hit (no SQL).

## Build & push image (StarCi Docker Hub)

```bash
cd api-service
docker build -t starciacademy/the-data-bottleneck-api-service:latest .
docker push starciacademy/the-data-bottleneck-api-service:latest
```

## Teardown

```bash
docker compose \
  -f .docker/postgresql-ha.yaml \
  -f .docker/redis.yaml \
  -f .docker/api-service.yaml \
  down -v
```

## References

- [NestJS caching (CacheModule + Keyv stores)](https://docs.nestjs.com/techniques/caching)
- [Keyv documentation](https://keyv.org/docs/)
- [TypeORM replication](https://typeorm.io/multiple-data-sources#replication)
- [Bitnami PostgreSQL container](https://github.com/bitnami/containers/tree/main/bitnami/postgresql)
- [Bitnami Redis container](https://github.com/bitnami/containers/tree/main/bitnami/redis)
