# 1 — CQRS pattern

Two standalone NestJS apps:

- **`write-service`** — PostgreSQL (write DB), `@nestjs/cqrs` (`CommandHandler` + `EventsHandler`), publishes `CustomerProfileUpdatedEvent` over **RabbitMQ** via `@nestjs/microservices` (`Transport.RMQ`), event pattern `customer.profile.updated`, queue `cqrs.customer.profile`.
- **`read-service`** — RMQ microservice (`@EventPattern`) + **Elasticsearch** read model, `GET /customer/:id`.

PostgreSQL is exposed on host **5433** (see `.docker/2-postgresql.yaml`) so it does not clash with a local Postgres on 5432.

## Infra (Docker)

Requires `docker network create starci-network` once.

```bash
docker compose -f .docker/1-rabbitmq.yaml up -d
docker compose -f .docker/2-postgresql.yaml up -d
docker compose -f .docker/3-elasticsearch.yaml up -d
docker compose -f .docker/4-backend.yaml up -d
```

## Local dev (without backend compose)

```bash
docker compose -f .docker/1-rabbitmq.yaml up -d
docker compose -f .docker/2-postgresql.yaml up -d
docker compose -f .docker/3-elasticsearch.yaml up -d

cd write-service && npm install && npm run start:dev
cd read-service && npm install && npm run start:dev
```

Set `RABBITMQ_URL` (default `amqp://localhost:5672`), `RABBITMQ_QUEUE` (optional, default `cqrs.customer.profile`), `WRITE_DB_*`, `ELASTICSEARCH_NODE` to match your machine.

RabbitMQ management UI: http://localhost:15672 (guest / guest).

## Sample flow

```bash
curl -s -X POST http://localhost:3000/customer/update -H "Content-Type: application/json" -d "{\"id\":\"123\",\"name\":\"John Doe\",\"email\":\"john@example.com\"}"
curl -s http://localhost:3001/customer/123
```

## Teardown

```bash
docker compose -f .docker/4-backend.yaml down
docker compose -f .docker/2-postgresql.yaml down -v
docker compose -f .docker/3-elasticsearch.yaml down -v
docker compose -f .docker/1-rabbitmq.yaml down
```
