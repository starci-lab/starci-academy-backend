# title
Task Scheduling with Cron

# description
Hands-on building scheduled tasks in NestJS using @nestjs/schedule, including Cron expressions, Interval heartbeat, and automated data backup.

# body

## 1. Opening

"The system needs to backup the database every 30 seconds — should we have users click a manual backup button?" — a **Senior Engineer** asks during ops automation review. A **Mid-level Developer** answers: "I'll write a script with `setInterval` in `main.ts`." The answer shows awareness of scheduling, but misses depth on **lifecycle management**: `setInterval` lives outside the DI container → can't inject services, not testable — **@nestjs/schedule** integrates Cron decorators directly into services, managing lifecycle through NestJS DI.

This lesson runs through two tracks:
- **Part 2.1**: **hands-on**; **stack** is **NestJS** + **PostgreSQL** (Docker), with **two flows** (heartbeat interval + cron backup).
- **Part 2.2**: **theory** clarifying **Cron expressions**, **@nestjs/schedule decorators**, and **edge cases**.

## 2. Core concepts

The lesson structure follows **practice-led theory**. First, learners clone the source, start **PostgreSQL** via **Docker Compose**, run **NestJS** via `nest start --watch`, and observe terminal logs to see the heartbeat every 10 seconds and backup every 30 seconds running automatically. Then the **theory** section analyzes Cron expression syntax and **edge cases**.

### 2.1. Hands-on

#### 2.1.1. Prepare source code and environment

Source: [StarCi-Academy/fullstack-mastery-module-7-workers-and-cron-jobs](https://github.com/StarCi-Academy/fullstack-mastery-module-7-workers-and-cron-jobs) on GitHub — lesson directory: [`0-task-scheduling-cron`](https://github.com/StarCi-Academy/fullstack-mastery-module-7-workers-and-cron-jobs/tree/main/0-task-scheduling-cron).

```bash
# Step 1: Clone the repository locally
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-7-workers-and-cron-jobs.git

# Step 2: Navigate to the lesson directory
cd fullstack-mastery-module-7-workers-and-cron-jobs/0-task-scheduling-cron
```

#### 2.1.2. Architecture / components

| Component | File | Role |
| --- | --- | --- |
| **PostgreSQL** | `.docker/compose.yaml` | Stores users (data to backup) |
| **BackupService** | `src/backup/backup.service.ts` | `@Cron` + `@Interval` decorators |
| **UsersService** | `src/users/users.service.ts` | Reads users from DB |

#### 2.1.3. Prerequisites and startup

##### 2.1.3.1. Prerequisites

- **Node.js** LTS, **npm**, **NestJS CLI**, **Docker Desktop**.
- **Windows:** API commands use **`Invoke-RestMethod`** (PowerShell). See parallel **`curl`** for macOS / Linux.

##### 2.1.3.2. Start

```bash
# Step 1: Start PostgreSQL
docker compose -f .docker/compose.yaml up -d

# Step 2: Install dependencies
npm install

# Step 3: Start in watch mode
nest start --watch
```

#### 2.1.4. Verification

##### 2.1.4.1. Flow 1 — Observe heartbeat (Interval)

  After the app starts, terminal logs every **10 seconds**:

  ```
  [BackupService] [Heartbeat] System scheduling is running fine...
  ```

##### 2.1.4.2. Flow 2 — Observe backup (Cron)

  Terminal logs every **30 seconds**:

  ```
  [BackupService] Starting data backup process...
  [BackupService] Successfully fetched N users from PostgreSQL.
  [BackupService] Backup complete. Written to file backup.js.
  ```

  Check via API:

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/users -Method Get

  # macOS / Linux
  curl -s http://localhost:3000/users
  ```

*If the logs match:*

- *@Interval(10000) — heartbeat every 10 seconds, used for health checks.*
- *@Cron('*/30 * * * * *') — backup every 30 seconds, reads DB and writes file.*

#### 2.1.5. Cleanup

```bash
docker compose -f .docker/compose.yaml down -v
```

#### 2.1.6. Further reading

- **@nestjs/schedule:** Task scheduling module. ([NestJS Docs](https://docs.nestjs.com/techniques/task-scheduling))
- **Cron Expression:** Syntax reference. ([crontab.guru](https://crontab.guru/))

### 2.2. Theory — Cron and @nestjs/schedule

#### 2.2.1. Cron Expression

| Field | Values | Example |
| --- | --- | --- |
| Second | 0–59 | `*/30` = every 30 seconds |
| Minute | 0–59 | `0` = minute 0 |
| Hour | 0–23 | `*/2` = every 2 hours |
| Day of month | 1–31 | `1` = 1st day |
| Month | 1–12 | `*` = every month |
| Day of week | 0–6 | `1-5` = Mon–Fri |

#### 2.2.2. Edge cases to internalize

- **Overlapping jobs:** Cron triggers new run while previous hasn't finished. **Fix:** use lock (Redis/file) or skip if running.
- **App restart:** Loses job execution history. **Fix:** store last run timestamp in DB/Redis.
- **Time zone:** Server in UTC but business in GMT+7. **Fix:** set timezone in `@Cron` decorator.
- **Long-running task:** Backup takes too long → blocks event loop. **Fix:** offload to queue (BullMQ).

## 3. Wrap-up

### 3.1. Common interview questions

- **Question 1:** How does @Cron differ from @Interval?
  - Sample answer: @Cron runs on a fixed schedule (expression); @Interval runs repeatedly at a fixed delay (ms).

- **Question 2:** Cron job runs in parallel if previous hasn't finished — how to handle?
  - Sample answer: Use distributed lock (Redis) or check isRunning flag before starting.

- **Question 3:** Why not use setInterval instead of @nestjs/schedule?
  - Sample answer: @nestjs/schedule integrates with DI container — inject services, testable, lifecycle managed.

# references
## 0
### alias
NestJS Task Scheduling
### url
https://docs.nestjs.com/techniques/task-scheduling
## 1
### alias
Crontab Guru
### url
https://crontab.guru/

# minutesRead
16
