# title
Build a RESTful Task Management API

# description
Build a REST API for managing tasks following RESTful conventions, using correct HTTP methods and returning accurate HTTP status codes.

# requirements
## 0
### purpose
Build `TasksController` and `TasksService` to manage tasks in-memory following RESTful conventions.
### technicalConstraints
- Required endpoints: `POST /tasks` (201), `GET /tasks` (200), `GET /tasks/:id` (200 or 404), `PATCH /tasks/:id` (200 or 404), `DELETE /tasks/:id` (204 or 404).
- URLs must use plural nouns (`/tasks`) and must not contain verbs.
- Keep the original CRUD intent and status-code expectations.
### proTipsHints
- Use `NotFoundException` for missing resources.
- Keep controller responsibilities (routing/status) separate from service logic.

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
NestJS CLI installed for scaffolding projects.
## 2
### title
Base dependencies
### text
Run `npm install` before implementation.

# steps

## 0
### title
Initialize the NestJS project
### body
- **Steps to follow**
  - Step 1: Create a new project using the CLI:
    ```bash
    nest new restful-api-crud-best-practices-easy
    ```
  - Step 2: Navigate to the project directory and start the app:
    ```bash
    cd restful-api-crud-best-practices-easy
    nest start --watch
    ```
- **Minimum acceptance criteria**
  - The application starts on port 3000 with no bootstrap errors.
- **Nice to have**
  - Stable watch-mode startup and clean startup logs.

## 1
### title
Create TasksModule, TasksService and TasksController
### body
- **Steps to follow**
  - Step 1: Create `TasksModule`, `TasksService`, `TasksController` using the CLI or manually.
  - Step 2: In `TasksService`, declare an in-memory array storing tasks with `id`, `title`, `description`, and `status` (default `"open"`).
  - Step 3: Register `TasksService` in `providers` and `TasksController` in `controllers` of `TasksModule`.
  - Step 4: Import `TasksModule` into `AppModule`.
- **Minimum acceptance criteria**
  - The module is loaded by NestJS and the app starts without errors.
- **Nice to have**
  - Clear task typing (interface/type) for stronger consistency.

## 2
### title
Implement all CRUD endpoints
### body
- **Steps to follow**
  - Step 1: In `TasksService`, implement `create`, `findAll`, `findOne`, `update`, `remove`; throw `NotFoundException` when a task does not exist.
  - Step 2: In `TasksController`, wire endpoints with the correct HTTP methods and status codes:
    - `@Post()` for `POST /tasks`.
    - `@Get()` for `GET /tasks`.
    - `@Get(':id')` for `GET /tasks/:id`.
    - `@Patch(':id')` for `PATCH /tasks/:id`.
    - `@Delete(':id')` for `DELETE /tasks/:id` with 204 on successful delete.
  - Step 3: Ensure URLs use plural nouns (`/tasks`), not verb-heavy paths.
- **Minimum acceptance criteria**
  - All five endpoints use the required methods and status codes.
- **Nice to have**
  - Consistent response payloads with readable client messages.

## 3
### title
Test the endpoints
### body
- **Steps to follow**
  - Step 1: Start the application:
    ```bash
    nest start --watch
    ```
  - Step 2: Create a new task:
    ```bash
    curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Learn REST\",\"description\":\"Study RESTful conventions\"}"
    ```
  - Step 3: List tasks:
    ```bash
    curl http://localhost:3000/tasks
    ```
  - Step 4: Fetch one task by id:
    ```bash
    curl http://localhost:3000/tasks/1
    ```
  - Step 5: Update a task:
    ```bash
    curl -X PATCH http://localhost:3000/tasks/1 -H "Content-Type: application/json" -d "{\"status\":\"done\"}"
    ```
  - Step 6: Delete a task:
    ```bash
    curl -X DELETE http://localhost:3000/tasks/1
    ```
- **Minimum acceptance criteria**
  - `POST /tasks` returns 201 with the created task body.
  - `GET /tasks` returns 200 with the task list.
  - `GET /tasks/:id` returns 200 when found, 404 when missing.
  - `PATCH /tasks/:id` returns 200 on success, 404 when missing.
  - `DELETE /tasks/:id` returns 204 on success, 404 when missing.
- **Nice to have**
  - Exercise more ids and bodies to confirm endpoint stability.

# references
## 0
### alias
NestJS Controllers
### url
https://docs.nestjs.com/controllers
## 1
### alias
NestJS Providers
### url
https://docs.nestjs.com/providers
## 2
### alias
HTTP Status Codes - MDN
### url
https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

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
Correct REST naming and HTTP methods
##### score
10
##### promptText
Grading rubric (max 10):
- 4 points: URLs use plural nouns (`/tasks`) and avoid verbs.
- 4 points: Correct HTTP methods are used for CRUD (`POST`, `GET`, `PATCH`, `DELETE`).
- 2 points: Controller uses correct route decorators.

Award 0 points if naming is wrong or core method-to-endpoint mapping is wrong.
#### 1
##### title
Correct HTTP status codes
##### score
10
##### promptText
Grading rubric (max 10):
- 3 points: `POST /tasks` returns 201 Created.
- 2 points: `GET /tasks` and `GET /tasks/:id` return 200 OK when found.
- 2 points: `PATCH /tasks/:id` returns 200 OK when updated.
- 2 points: `DELETE /tasks/:id` returns 204 No Content when deleted.
- 1 point: Missing resources return 404 via `NotFoundException`.

Score by totaling satisfied criteria; missing individual status behaviors deduct the matching points.

# difficulty
easy

# score
20
