# 0 — Database per Service

## Run databases

```bash
docker compose -f .docker/postgresql.yaml up -d
docker compose -f .docker/mongodb.yaml up -d
```

## Install & apps

```bash
npm install
# terminal A
npx nest start order --watch
# terminal B
npx nest start inventory --watch
```

## Sample curls (from course)

```bash
curl -s -X POST http://localhost:3001/inventory -H "Content-Type: application/json" -d "{\"name\":\"Macbook M3\",\"stock\":50}"
curl -s -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d "{\"customerId\":\"user_01\",\"totalAmount\":2500}"
```

## Teardown

```bash
docker compose -f .docker/postgresql.yaml down -v
docker compose -f .docker/mongodb.yaml down -v
```
