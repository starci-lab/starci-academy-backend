# title
Unified Response and Error Handling

# description
Hands-on building a unified response envelope and global exception filter in NestJS so clients always receive consistently structured JSON.

# body

## 1. Opening

"One endpoint returns `{ message }`, another returns `{ error, details }` — how many parse patterns does the frontend need?" — a **Senior Engineer** asks during an API contract review. A **Mid-level Developer** answers: "I'll standardize gradually during refactoring." The answer shows awareness of consistency, but misses depth on **API contract**: without standardizing response shape upfront, every endpoint creates its own contract — frontend needs different parse logic per route, and inconsistent error shapes make monitoring/logging meaningless.

This lesson runs through two consecutive tracks:
- **Part 2.1**: **hands-on**, synchronized with the repository; the **stack** is pure **NestJS** (no Docker), with **two verification flows** (success envelope; error envelope).
- **Part 2.2**: **theory** clarifying **Interceptor**, **ExceptionFilter**, **response envelope**, and **edge cases** like **stack trace leak** and **status code override**.

## 2. Core concepts

The lesson structure follows **practice-led theory**. First, learners clone the source, run **NestJS** via `nest start --watch`, and call APIs to observe the response envelope. Then the **theory** section analyzes interceptor/filter architecture and **edge cases**.

### 2.1. Hands-on

#### 2.1.1. Prepare source code and environment

Source: [StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation](https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation) on GitHub — lesson directory: [`2-unified-response-and-errors`](https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation/tree/main/2-unified-response-and-errors).

```bash
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation.git
cd fullstack-mastery-module-3-rest-api-development-documentation/2-unified-response-and-errors
```

#### 2.1.2. Architecture / components (stack + flow)

| Component | File | Role |
| --- | --- | --- |
| **TransformInterceptor** | `src/common/interceptors/transform.interceptor.ts` | Wraps success → `{ statusCode, message, data, timestamp }` |
| **AllExceptionsFilter** | `src/common/filters/all-exceptions.filter.ts` | Wraps error → `{ statusCode, error, message, timestamp, path }` |
| **@ResponseMessage** | `src/common/decorators/response-message.decorator.ts` | Custom message per route |
| **UserController** | `src/modules/user/user.controller.ts` | REST + error demo endpoint |

#### 2.1.3. Prerequisites and startup

##### 2.1.3.1. Prerequisites

- **Node.js** LTS, **npm**, **NestJS CLI**.
- **Windows:** API commands use **`Invoke-RestMethod`** (PowerShell). See parallel **`curl`** for macOS / Linux.

##### 2.1.3.2. Start

```bash
# Step 1: Install dependencies
npm install

# Step 2: Start in watch mode
nest start --watch
```

This lesson does not use Docker, no resource cleanup is needed.

#### 2.1.4. Verification

##### 2.1.4.1. Flow 1 — Success envelope

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/users

  # macOS / Linux
  curl -s http://localhost:3000/users
  ```

  Expected response (HTTP 200):

  ```json
  {
    "statusCode": 200,
    "message": "Success",
    "data": [],
    "timestamp": "<ISO datetime>"
  }
  ```

##### 2.1.4.2. Flow 2 — Error envelope

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/users/nonexistent

  # macOS / Linux
  curl -s http://localhost:3000/users/nonexistent
  ```

  Expected response (HTTP 404):

  ```json
  {
    "statusCode": 404,
    "error": "NotFoundException",
    "message": "User with ID nonexistent not found",
    "timestamp": "<ISO datetime>",
    "path": "/users/nonexistent"
  }
  ```

*If the responses match the format above:*

- *TransformInterceptor — wraps all success responses into a unified envelope.*
- *AllExceptionsFilter — catches all exceptions, returns JSON error without stack trace.*

#### 2.1.5. Cleanup

This lesson does not use Docker, no resource cleanup is needed.

#### 2.1.6. Further reading

- **NestJS Interceptors:** Bind extra logic before/after route handler. ([NestJS Docs](https://docs.nestjs.com/interceptors))
- **NestJS Exception Filters:** Catch and transform exceptions. ([NestJS Docs](https://docs.nestjs.com/exception-filters))

### 2.2. Theory — Interceptor, ExceptionFilter, Response Envelope

#### 2.2.1. Success Envelope vs Error Envelope

| Success | Error |
| --- | --- |
| `{ statusCode, message, data, timestamp }` | `{ statusCode, error, message, timestamp, path }` |
| Interceptor wraps | ExceptionFilter catches |
| HTTP 2xx | HTTP 4xx / 5xx |

#### 2.2.2. How TransformInterceptor works

1. Request passes through pipes → controller → service.
2. Service returns data.
3. **TransformInterceptor** wraps data into envelope `{ statusCode, message, data, timestamp }`.
4. `@ResponseMessage()` decorator allows custom message per route.

#### 2.2.3. Edge cases to internalize

- **Inconsistent error shape:** Routes return different error shapes → hard for frontend to parse. **Fix:** use global exception filter for standardization.
- **Status code override:** Interceptor wraps 200 for error cases. **Fix:** interceptor only wraps success, filter handles errors.
- **Stack trace leak in production:** Error contains stack trace → exposes internal code. **Fix:** only return stack trace in development.
- **Missing pagination metadata:** List without `total`, `page` → client cannot determine more data. **Fix:** wrap with pagination metadata.

## 3. Wrap-up

### 3.1. Common interview questions

- **Question 1:** What's the difference between Interceptor and ExceptionFilter?
  - Sample answer: Interceptor wraps success responses; ExceptionFilter catches exceptions and standardizes error responses.

- **Question 2:** Why is a unified response envelope needed?
  - Sample answer: Client needs only 1 parse logic for all endpoints; monitoring/logging can aggregate easily.

- **Question 3:** Should stack traces be returned to production clients?
  - Sample answer: No. Stack traces expose internal code; return generic messages, log details server-side.

# references
## 0
### alias
NestJS Interceptors
### url
https://docs.nestjs.com/interceptors
## 1
### alias
NestJS Exception Filters
### url
https://docs.nestjs.com/exception-filters

# minutesRead
15
