# title
Workers & Cron Jobs

# description
Schedule recurring tasks with Cron in NestJS, run background work with BullMQ and Redis, and operate workers reliably: retries, idempotency, queue observability, and duplicate-job avoidance.

# previewContents
## 0
### text
Configure Cron and @nestjs/schedule for clear periodic tasks.
## 1
### text
Know when Cron is enough and when to move work to a queue.
## 2
### text
Set up BullMQ with Redis as the job store and state backend.
## 3
### text
Define producers and workers and handle async jobs safely across restarts.
## 4
### text
Use retries, backoff, and idempotency so re-runs do not corrupt data.
## 5
### text
Apply concurrency limits, timeouts, and stalled-job handling to avoid overload.
## 6
### text
Observe queues (logs, metrics) and debug real worker flows.
## 7
### text
Prepare local dev (Docker Redis, BullMQ-related environment variables).
## 8
### text
Ship a structured background pipeline that scales as load grows.
