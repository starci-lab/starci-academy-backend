# title
Swagger and API Documentation

# description
Hands-on integration of Swagger (OpenAPI) into NestJS for auto-generated API documentation, enabling frontend and QA teams to consume APIs without reading source code.

# body

## 1. Opening

"The API has 20 endpoints but no docs — how does the frontend team know request/response shapes?" — a **Senior Engineer** asks when onboarding a new member. A **Mid-level Developer** answers: "I'll write docs in Notion." The answer shows awareness of documentation, but misses depth on **single source of truth**: hand-written docs quickly become outdated when code changes — **Swagger/OpenAPI** generates docs directly from code decorators, ensuring docs always match implementation.

This lesson runs through two consecutive tracks:
- **Part 2.1**: **hands-on**, synchronized with the repository; the **stack** is pure **NestJS** (no Docker), with **two verification flows** (Swagger UI; API call from Swagger).
- **Part 2.2**: **theory** clarifying **OpenAPI spec**, **@ApiProperty**, **@ApiOperation**, and **edge cases** like **missing DTO decorators**, **auth headers**, and **production exposure**.

## 2. Core concepts

The lesson structure follows **practice-led theory**. First, learners clone the source, run **NestJS** via `nest start --watch`, and open Swagger UI. Then the **theory** section analyzes OpenAPI architecture and **edge cases**.

### 2.1. Hands-on

#### 2.1.1. Prepare source code and environment

Source: [StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation](https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation) on GitHub — lesson directory: [`3-swagger-api-documentation`](https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation/tree/main/3-swagger-api-documentation).

```bash
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation.git
cd fullstack-mastery-module-3-rest-api-development-documentation/3-swagger-api-documentation
```

#### 2.1.2. Architecture / components (stack + flow)

| Component | File | Role |
| --- | --- | --- |
| **SwaggerModule** | `bootstrap.ts` | Sets up OpenAPI document + Swagger UI |
| **CreateCatDto** | `src/modules/cat/dto/create-cat.dto.ts` | DTO with `@ApiProperty` |
| **CatController** | `src/modules/cat/cat.controller.ts` | `@ApiTags`, `@ApiOperation`, `@ApiResponse` |
| **TransformInterceptor** | `src/common/interceptors/transform.interceptor.ts` | Unified response envelope |
| **AllExceptionsFilter** | `src/common/filters/all-exceptions.filter.ts` | Unified error envelope |

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

##### 2.1.4.1. Flow 1 — Open Swagger UI

Open browser at **`http://localhost:3000/api`**. Swagger UI displays all endpoints with request/response schemas.

##### 2.1.4.2. Flow 2 — Call API from Swagger

- Step 1: open `POST /cats` on Swagger UI → click "Try it out".
- Step 2: fill body:

  ```json
  { "breed": "Persian", "age": 2 }
  ```

- Step 3: click "Execute".

  Or use terminal:

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/cats -Method Post -ContentType "application/json" -Body '{"breed":"Persian","age":2}'

  # macOS / Linux
  curl -s -X POST http://localhost:3000/cats -H "Content-Type: application/json" -d '{"breed":"Persian","age":2}'
  ```

  Response (HTTP 201): newly created cat, wrapped in unified envelope.

- Step 4: call `GET /cats/error-demo`.

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/cats/error-demo

  # macOS / Linux
  curl -s http://localhost:3000/cats/error-demo
  ```

  Response (HTTP 400): unified error envelope.

*If the responses match the format above:*

- *Swagger UI auto-generated — docs always match code decorators.*
- *@ApiProperty on DTO — Swagger displays accurate request/response schemas.*

#### 2.1.5. Cleanup

This lesson does not use Docker, no resource cleanup is needed.

#### 2.1.6. Further reading

- **NestJS OpenAPI:** Integrating `@nestjs/swagger` into NestJS. ([NestJS Docs](https://docs.nestjs.com/openapi/introduction))
- **OpenAPI Specification:** Standard for describing RESTful APIs. ([OpenAPI Spec](https://spec.openapis.org/oas/latest.html))
- **Swagger UI:** Interactive API documentation. ([Swagger](https://swagger.io/tools/swagger-ui/))

### 2.2. Theory — OpenAPI and Swagger Decorators

#### 2.2.1. OpenAPI Specification

**OpenAPI** (formerly Swagger) is a standard for describing RESTful APIs in JSON/YAML. **NestJS** uses `@nestjs/swagger` to generate OpenAPI spec from runtime decorators.

#### 2.2.2. Key Decorators

| Decorator | Used on | Purpose |
| --- | --- | --- |
| `@ApiTags('...')` | Controller | Groups endpoints on Swagger UI |
| `@ApiOperation({ summary })` | Method | Describes endpoint |
| `@ApiResponse({ status, description })` | Method | Describes response |
| `@ApiProperty({ example, description })` | DTO field | Describes field in schema |
| `@ApiBearerAuth()` | Controller/Method | Adds auth header |

#### 2.2.3. Edge cases to internalize

- **DTO not showing in Swagger:** Missing `@ApiProperty()` → empty schema. **Fix:** add `@ApiProperty()` to all DTO fields.
- **Auth header missing:** Forgot `addBearerAuth()` → can't test authenticated endpoints. **Fix:** configure `addBearerAuth()` + `@ApiBearerAuth()`.
- **Swagger exposed in production:** UI accessible → exposes API surface. **Fix:** only enable when `NODE_ENV !== 'production'`.
- **Response type mismatch:** `@ApiResponse` type doesn't match actual response. **Fix:** sync DTO type between controller and `@ApiResponse`.

## 3. Wrap-up

### 3.1. Common interview questions

- **Question 1:** Can Swagger replace Postman?
  - Sample answer: Swagger auto-generates docs from code; Postman is stronger for testing complex flows. The two tools complement each other.

- **Question 2:** Why is `@ApiProperty()` needed on every DTO field?
  - Sample answer: TypeScript types are erased at compile time; `@ApiProperty()` provides runtime metadata for Swagger.

- **Question 3:** Should Swagger UI be exposed in production?
  - Sample answer: No. Swagger exposes the entire API surface; only enable in development/staging.

# references
## 0
### alias
NestJS OpenAPI
### url
https://docs.nestjs.com/openapi/introduction
## 1
### alias
OpenAPI Specification
### url
https://spec.openapis.org/oas/latest.html

# minutesRead
15
