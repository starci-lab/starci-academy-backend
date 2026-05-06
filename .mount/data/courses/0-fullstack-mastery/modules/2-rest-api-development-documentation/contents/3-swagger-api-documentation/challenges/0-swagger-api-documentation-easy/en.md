# title
Automatic API Documentation with Swagger

# description
Integrate Swagger into a NestJS project to automatically generate live API documentation from code, allowing Frontend to test directly on the web interface.

# requirements
## 0
### purpose
Integrate Swagger to generate API documentation automatically and enable direct endpoint testing.
### technicalConstraints
- Install `@nestjs/swagger` and expose Swagger UI at `/docs`.
- Add `@ApiTags()` to controller and `@ApiOperation()` + `@ApiResponse()` to each endpoint.
- Add `@ApiProperty()` with `example` for every DTO property.
- Enable `addBearerAuth()` in `DocumentBuilder`.
### proTipsHints
- Keep title/description/version clear for frontend consumers.
- Ensure documented response codes match actual endpoint behavior.

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
NestJS CLI installed for project setup.
## 2
### title
Project dependencies
### text
Run `npm install` before Swagger integration.
## 3
### title
Swagger package
### text
Install `@nestjs/swagger`.

# steps

## 0
### title
Initialize the project and install Swagger
### body
- **Steps to follow**
  - Step 1: Create a new project:
    ```bash
    nest new swagger-api-documentation-easy
    ```
  - Step 2: Navigate to the project directory and install the Swagger library:
    ```bash
    cd swagger-api-documentation-easy
    npm install @nestjs/swagger
    ```
  - Step 3: Start the application:
    ```bash
    nest start --watch
    ```
- **Minimum acceptance criteria**
  - The app starts successfully and `@nestjs/swagger` is installed.
- **Nice to have**
  - Prepare a basic task module to validate docs immediately.

## 1
### title
Configure Swagger in main.ts
### body
- **Steps to follow**
  - Step 1: In `main.ts`, import `SwaggerModule` and `DocumentBuilder` from `@nestjs/swagger`.
  - Step 2: Create the Swagger configuration using `DocumentBuilder`:
    ```typescript
    const config = new DocumentBuilder()
      .setTitle('Task Management API')
      .setDescription('Auto-generated API documentation for Task management')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    ```
  - Step 3: Create the document and mount Swagger UI:
    ```typescript
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    ```
  - Step 4: Start the application and navigate to `http://localhost:3000/docs` in the browser.
- **Minimum acceptance criteria**
  - Swagger UI is accessible at `/docs` and shows Bearer Authorize control.
- **Nice to have**
  - Metadata values are descriptive and production-friendly.

## 2
### title
Apply Swagger decorators to Controller and DTO
### body
- **Steps to follow**
  - Step 1: Create `TasksModule` with `TasksController` and `TasksService` (if not already created). Implement at least 2 endpoints: `POST /tasks` and `GET /tasks`.
  - Step 2: Create `CreateTaskDto` with fields `title` and `description`. Apply `@ApiProperty()` with `example` to each field:
    ```typescript
    @ApiProperty({ example: 'Fix login bug', description: 'Title of the task' })
    title: string;

    @ApiProperty({ example: 'Fix the login failure issue', description: 'Detailed description', required: false })
    description?: string;
    ```
  - Step 3: Apply `@ApiTags('Tasks')` to `TasksController`.
  - Step 4: Apply `@ApiOperation()` and `@ApiResponse()` to each endpoint:
    ```typescript
    @Post()
    @ApiOperation({ summary: 'Create a new task' })
    @ApiResponse({ status: 201, description: 'Task created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    create(@Body() dto: CreateTaskDto) { ... }
    ```
  - Step 5: Repeat similarly for `GET /tasks` with appropriate `@ApiOperation()` and `@ApiResponse()`.
- **Minimum acceptance criteria**
  - Swagger UI shows endpoint tags, summaries, request body schema examples, and response statuses.
- **Nice to have**
  - Endpoint descriptions include practical usage context.

## 3
### title
Test Swagger UI and try live requests
### body
- **Steps to follow**
  - Step 1: Start the application:
    ```bash
    nest start --watch
    ```
  - Step 2: Open a browser and navigate to `http://localhost:3000/docs`.
  - Step 3: Verify the Swagger UI interface:
    - Confirm the `Tasks` group displays the endpoints.
    - Confirm each endpoint has a summary and response statuses.
    - Confirm `POST /tasks` has a request body schema with examples from `@ApiProperty`.
  - Step 4: Use the "Try it out" button on Swagger UI to send `POST /tasks` with a sample body:
    ```json
    {
      "title": "Test from Swagger",
      "description": "Testing API documentation"
    }
    ```
    Verify you receive a 201 success response.
  - Step 5: Use "Try it out" to send `GET /tasks` and verify it returns the list of tasks.
  - Step 6: Click the "Authorize" button, enter any Bearer token, and confirm the Authorize button works (even without actual authentication logic).
- **Minimum acceptance criteria**
  - Swagger UI at `/docs` displays all endpoints with tags, summaries, and response codes.
  - Request body of `POST /tasks` has a schema with example values.
  - "Try it out" sends requests successfully and receives responses.
  - The Authorize button is displayed and functional.
- **Nice to have**
  - Docs include clear success/error examples for faster frontend integration.

# references
## 0
### alias
NestJS OpenAPI (Swagger)
### url
https://docs.nestjs.com/openapi/introduction
## 1
### alias
NestJS OpenAPI Decorators
### url
https://docs.nestjs.com/openapi/decorators
## 2
### alias
NestJS OpenAPI Types and Parameters
### url
https://docs.nestjs.com/openapi/types-and-parameters

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
Swagger config and decorators complete
##### score
10
##### promptText
Grading rubric (max 10):
- 3 points: `DocumentBuilder` includes `title`, `description`, `version`, and `addBearerAuth()`.
- 3 points: `SwaggerModule.setup()` is mounted at `/docs`.
- 2 points: Controller includes `@ApiTags()`.
- 2 points: Each endpoint includes `@ApiOperation()` and `@ApiResponse()`.

Score by summing achieved criteria; missing core setup loses points for the corresponding criterion.
#### 1
##### title
DTO has complete ApiProperty
##### score
10
##### promptText
Grading rubric (max 10):
- 5 points: Every `CreateTaskDto` property has `@ApiProperty()` with a specific `example`.
- 3 points: Swagger UI renders request-body schema with those examples.
- 2 points: No DTO property is missing Swagger decorators.

Score each criterion independently and total the points.

# difficulty
easy

# score
20
