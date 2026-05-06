# title
Protect API with DTO and ValidationPipe

# description
Implement an input data protection layer for a REST API using DTOs combined with ValidationPipe, preventing junk data and missing required fields.

# requirements
## 0
### purpose
Protect `POST /tasks` input data using DTOs and `ValidationPipe`.
### technicalConstraints
- Create `CreateTaskDto` with: `title` (`@IsString`, `@MinLength(3)`), `description` (`@IsString`, `@IsOptional`), `priority` (`@IsEnum(['low','medium','high'])`).
- Enable global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`.
- `POST /tasks` missing `title` must return 400; unknown fields such as `role` must be rejected.
### proTipsHints
- Type controller body as `CreateTaskDto` to ensure validation is enforced.
- Test valid, missing-field, invalid-enum, and unknown-field payloads.

# prerequisites
## 0
### title
Node.js
### text
Node.js >= 18
## 1
### title
NestJS CLI
### text
NestJS CLI installed for scaffold generation.
## 2
### title
Project dependencies
### text
Run `npm install` before implementation.
## 3
### title
Validation libraries
### text
Install `class-validator` and `class-transformer`.

# steps

## 0
### title
Initialize the project and install dependencies
### body
- **Steps to follow**
  - Step 1: Create a new project:
    ```bash
    nest new dtos-and-validation-easy
    ```
  - Step 2: Navigate to the project directory and install required libraries:
    ```bash
    cd dtos-and-validation-easy
    npm install class-validator class-transformer
    ```
  - Step 3: Start the application:
    ```bash
    nest start --watch
    ```
- **Minimum acceptance criteria**
  - The app runs successfully and both validation libraries are installed.
- **Nice to have**
  - Watch mode is stable for quick validation iteration.

## 1
### title
Create TasksModule and basic POST /tasks endpoint
### body
- **Steps to follow**
  - Step 1: Create `TasksModule`, `TasksService`, `TasksController` using the CLI or manually.
  - Step 2: In `TasksService`, declare an in-memory array and implement a `create(data)` method that adds a new task.
  - Step 3: In `TasksController`, create a `@Post()` endpoint that accepts a body and calls `TasksService.create()`.
  - Step 4: Import `TasksModule` into `AppModule`.
- **Minimum acceptance criteria**
  - `POST /tasks` accepts a valid body and returns 201 on success.
- **Nice to have**
  - Define clear task typing for service and controller.

## 2
### title
Create CreateTaskDto with class-validator decorators
### body
- **Steps to follow**
  - Step 1: Create file `create-task.dto.ts` in the `tasks/dto/` directory.
  - Step 2: Declare class `CreateTaskDto` with fields and decorators:
    - `title`: apply `@IsString()` and `@MinLength(3)`.
    - `description`: apply `@IsString()` and `@IsOptional()`.
    - `priority`: apply `@IsEnum(['low', 'medium', 'high'])`.
  - Step 3: In `TasksController`, change the body parameter type from `any` to `CreateTaskDto`:
    ```typescript
    @Post()
    create(@Body() createTaskDto: CreateTaskDto) { ... }
    ```
  - Step 4: Enable `ValidationPipe` globally in `main.ts`:
    ```typescript
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    ```
- **Minimum acceptance criteria**
  - Missing `title` or `title` shorter than 3 returns 400 with a clear error message.
- **Nice to have**
  - Error payloads are consistent and easy to understand.

## 3
### title
Test validation and whitelist behavior
### body
- **Steps to follow**
  - Step 1: Start the application:
    ```bash
    nest start --watch
    ```
  - Step 2: Send a valid request:
    ```bash
    curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Fix bug\",\"priority\":\"high\"}"
    ```
    Verify it returns 201 with the created task.
  - Step 3: Send a request missing `title`:
    ```bash
    curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"priority\":\"low\"}"
    ```
    Verify it returns 400 Bad Request with a message indicating `title` is required.
  - Step 4: Send a request with `title` too short:
    ```bash
    curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"AB\",\"priority\":\"low\"}"
    ```
    Verify it returns 400 with a message indicating `title` must have at least 3 characters.
  - Step 5: Send a request with an unknown field `role`:
    ```bash
    curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Fix bug\",\"priority\":\"high\",\"role\":\"admin\"}"
    ```
    Verify it returns 400 with a message indicating `role` is not allowed (`forbidNonWhitelisted`).
  - Step 6: Send a request with invalid `priority` value:
    ```bash
    curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Fix bug\",\"priority\":\"urgent\"}"
    ```
    Verify it returns 400 with a message indicating `priority` must be a valid enum value.
- **Minimum acceptance criteria**
  - Valid body -> 201 Created.
  - Missing `title` -> 400 Bad Request.
  - `title` < 3 characters -> 400 Bad Request.
  - Unknown field `role` -> 400 Bad Request (forbidNonWhitelisted).
  - Invalid `priority` enum -> 400 Bad Request.
- **Nice to have**
  - Add more payload permutations to harden validation behavior.

# references
## 0
### alias
NestJS Validation
### url
https://docs.nestjs.com/techniques/validation
## 1
### alias
class-validator GitHub
### url
https://github.com/typestack/class-validator
## 2
### alias
NestJS Pipes
### url
https://docs.nestjs.com/pipes

# submissions
## 0
### type
githubUrl
### title
GitHub Repository Link
### description
Submit the GitHub repository link containing your challenge source code.
### score
20
### prompts
#### 0
##### title
DTO decorators correct
##### score
10
##### promptText
Grading rubric (max 10):
- 4 points: `CreateTaskDto` includes `title`, `description`, and `priority`.
- 3 points: Each field has the required validation decorators.
- 3 points: Controller uses `CreateTaskDto` for the `@Body()` parameter.

Score by summing achieved criteria; missing required fields cannot receive points for that criterion.
#### 1
##### title
ValidationPipe configured correctly
##### score
10
##### promptText
Grading rubric (max 10):
- 4 points: Global `ValidationPipe` is enabled in `main.ts`.
- 3 points: Pipe config includes `whitelist: true` and `forbidNonWhitelisted: true`.
- 3 points: Missing required fields and unknown fields both return 400 with clear errors.

Score each criterion independently and total the points.

# difficulty
easy

# score
20
