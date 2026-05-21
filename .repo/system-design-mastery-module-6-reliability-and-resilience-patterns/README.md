# system-design-mastery-module-6-reliability-and-resilience-patterns

NestJS demo repository for reliability and resilience patterns.

## Lessons

- `0-timeouts-and-retries`: Client/Bank timeout with exponential backoff + jitter.
- `1-circuit-breaker-pattern`: API Gateway + Inventory with Opossum circuit breaker.
- `2-bulkhead-pattern`: Route-level resource isolation with concurrency limiter.
- `3-health-checks-and-graceful-degradation`: Terminus health checks + graceful degradation.

## Quick start by lesson

### 0-timeouts-and-retries

```bash
docker network create starci-network
docker compose -f .docker/backend.yaml up -d --build
```

### 1-circuit-breaker-pattern

```bash
docker network create starci-network
docker compose -f .docker/backend.yaml up -d --build
```

### 2-bulkhead-pattern

```bash
docker network create starci-network
docker compose -f .docker/backend.yaml up -d --build
```

### 3-health-checks-and-graceful-degradation

```bash
docker network create starci-network
docker compose -f .docker/backend.yaml up -d --build
```

## Comment & cấu trúc (strict §4)
- `compose.yaml`: header + comment từng service (VI + EN).
- `*.service.ts` / `*.controller.ts`: mọi method có JSDoc **Logic —** + **Code —** + EN Logic/Code.
- Regenerate: `node scratch/comment_system_design_modules_1_11.mjs`

