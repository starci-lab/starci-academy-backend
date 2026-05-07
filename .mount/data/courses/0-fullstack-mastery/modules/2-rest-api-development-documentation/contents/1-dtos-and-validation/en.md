# title
DTOs and Validation in NestJS

# description
Hands-on building DTOs with class-validator and class-transformer in NestJS, ensuring input data is always valid before reaching the service layer.

# body

## 1. Opening

"Why does the API still accept unexpected fields from clients without any errors?" — a **Senior Engineer** asks during a security audit. A **Mid-level Developer** answers: "I validate on the frontend already." The answer shows awareness of UX validation, but misses depth on **server-side validation**: frontend validation is easily bypassed by curl/Postman, and without backend validation + whitelisting, dirty data leaks into the database — causing logic errors, security risks, and data corruption.

This lesson runs through two consecutive tracks:
- **Part 2.1**: **hands-on**, synchronized with the GitHub repository; the **stack** is **NestJS** + **PostgreSQL** (Docker), with **two verification flows** (valid payload; invalid payload).
- **Part 2.2**: **theory** clarifying **DTO pattern**, **ValidationPipe**, **class-validator** / **class-transformer**, and **edge cases** like **whitelist bypass**, **nested DTO**, and **PartialType**.

## 2. Core concepts

The lesson structure follows **practice-led theory**. First, learners clone the source, start **PostgreSQL** via **Docker Compose**, run **NestJS** via `nest start --watch`, and call APIs to observe validation in action. Then the **theory** section systematizes **core concepts** and analyzes in-depth **edge cases**.

### 2.1. Hands-on

#### 2.1.1. Prepare source code and environment

Source: [StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation](https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation) on GitHub — lesson directory: [`1-dtos-and-validation`](https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation/tree/main/1-dtos-and-validation).

```bash
git clone https://github.com/StarCi-Academy/fullstack-mastery-module-3-rest-api-development-documentation.git
cd fullstack-mastery-module-3-rest-api-development-documentation/1-dtos-and-validation
```

#### 2.1.2. Architecture / components (stack + flow)

| Component | File | Role |
| --- | --- | --- |
| **PostgreSQL** | `.docker/compose.yaml` | Stores users |
| **CreateUserDto** | `src/modules/user/dto/create-user.dto.ts` | Validates POST payload |
| **UserController** | `src/modules/user/user.controller.ts` | REST endpoints |
| **UserService** | `src/modules/user/user.service.ts` | CRUD logic |
| **ValidationPipe** | `bootstrap.ts` | Global pipe: validate + whitelist |

#### 2.1.3. Prerequisites and startup

##### 2.1.3.1. Prerequisites

- **Node.js** LTS, **npm**, **NestJS CLI**, **Docker Desktop**.
- **Windows:** API commands use **`Invoke-RestMethod`** (PowerShell). See parallel **`curl`** for macOS / Linux.

##### 2.1.3.2. Start

```bash
docker compose -f .docker/compose.yaml up -d

# Step 1: Install dependencies
npm install

# Step 2: Start in watch mode
nest start --watch
```

#### 2.1.4. Verification

##### 2.1.4.1. Flow 1 — Valid payload

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/users -Method Post -ContentType "application/json" -Body '{"name":"Alice","email":"alice@test.com"}'

  # macOS / Linux
  curl -s -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Alice","email":"alice@test.com"}'
  ```

  Response (HTTP 201): user created successfully.

##### 2.1.4.2. Flow 2 — Invalid payload

  ```bash
  # Windows (PowerShell)
  Invoke-RestMethod -Uri http://localhost:3000/users -Method Post -ContentType "application/json" -Body '{"name":123}'

  # macOS / Linux
  curl -s -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":123}'
  ```

  Response (HTTP 400): validation error messages.

*If the responses match the format above:*

- *ValidationPipe works — `@IsString()`, `@IsEmail()` reject wrong-typed payloads.*
- *Whitelist — unexpected fields stripped via `whitelist: true`.*

#### 2.1.5. Cleanup

When you are done, tear down to free resources.

```bash
# Step 1: Stop the running server
# Windows / macOS / Linux
Ctrl + C

# Step 2: Close Docker (if the lesson uses Docker)
docker compose -f .docker/compose.yaml down -v
```

#### 2.1.6. Further reading

- **class-validator:** Decorator-based validation library for TypeScript. ([GitHub](https://github.com/typestack/class-validator))
- **class-transformer:** Transforms plain objects to class instances. ([GitHub](https://github.com/typestack/class-transformer))
- **NestJS Validation:** ValidationPipe, whitelist, transform. ([NestJS Docs](https://docs.nestjs.com/techniques/validation))

### 2.2. Theory — DTO, ValidationPipe, and class-validator

#### 2.2.1. DTO Pattern

**DTO** (Data Transfer Object) is a class containing only data, no business logic. In NestJS, DTOs combine with **class-validator** decorators to validate input at the pipe layer.

#### 2.2.2. ValidationPipe

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Strip undeclared fields
  forbidNonWhitelisted: true, // Throw if unknown fields present
  transform: true,            // Auto-transform types
}));
```

#### 2.2.3. Edge cases to internalize

- **Whitelist bypass:** Missing `whitelist: true` → client sends unexpected fields to DB. **Fix:** always enable `whitelist` and `forbidNonWhitelisted`.
- **Nested DTO not validated:** Missing `@ValidateNested()` + `@Type()`. **Fix:** always use `@ValidateNested()` with `class-transformer`.
- **Partial update missing PartialType:** Update endpoint requires full DTO. **Fix:** use `PartialType(CreateDto)` for update.
- **Transform order:** `class-transformer` runs before `class-validator` — wrong transform passes validation but corrupts data. **Fix:** test both together.

## 3. Wrap-up

### 3.1. Common interview questions

- **Question 1:** How are DTOs different from TypeScript interfaces?
  - Sample answer: Interfaces are erased at compile time. DTOs are classes that exist at runtime, allowing validation decorators.

- **Question 2:** Why is whitelist needed in ValidationPipe?
  - Sample answer: Prevents clients from injecting unexpected fields into DB (mass assignment attack).

- **Question 3:** What problem does `PartialType` solve?
  - Sample answer: Creates update DTO from create DTO, making all fields optional without code duplication.

# references
## 0
### alias
NestJS Validation
### url
https://docs.nestjs.com/techniques/validation
## 1
### alias
class-validator
### url
https://github.com/typestack/class-validator

# minutesRead
15
