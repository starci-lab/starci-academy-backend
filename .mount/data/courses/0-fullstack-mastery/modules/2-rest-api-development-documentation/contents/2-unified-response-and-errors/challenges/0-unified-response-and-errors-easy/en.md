# title
Unified Response and Global Error Handling

# description
Build a TransformInterceptor and AllExceptionsFilter to standardize all responses into a unified JSON structure for both success and error cases.

# requirements
## 0
### purpose
Standardize successful and error responses using global interceptor/filter in NestJS.
### technicalConstraints
- `TransformInterceptor` wraps success responses into `{ statusCode, message, data, timestamp }`.
- `AllExceptionsFilter` returns `{ statusCode, error, message, timestamp }` and must not leak stack traces.
- Both must be registered globally in `main.ts`.
- `GET /tasks` must return wrapped success format; arbitrary errors must be caught and returned safely.
### proTipsHints
- Read status code from HTTP response context for success wrapping.
- Map non-HTTP exceptions to status 500 with a safe message.

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
NestJS CLI installed for project generation.
## 2
### title
Base dependencies
### text
Run `npm install` before coding.

# steps

## 0
### title
Initialize the project and create a basic TasksModule
### body
- **Steps to follow**
  - Step 1: Create a new project:
    ```bash
    nest new unified-response-and-errors-easy
    ```
  - Step 2: Navigate to the project directory:
    ```bash
    cd unified-response-and-errors-easy
    ```
  - Step 3: Create `TasksModule`, `TasksService`, `TasksController` with a `GET /tasks` endpoint returning a sample task array and `GET /tasks/:id` throwing `NotFoundException` when not found.
  - Step 4: Start the application:
    ```bash
    nest start --watch
    ```
- **Minimum acceptance criteria**
  - `GET /tasks` returns sample data and `GET /tasks/999` returns default 404.
- **Nice to have**
  - Add a temporary crash endpoint for later filter verification.

## 1
### title
Build the TransformInterceptor
### body
- **Steps to follow**
  - Step 1: Create file `transform.interceptor.ts` in the `common/interceptors/` directory.
  - Step 2: Implement class `TransformInterceptor` implementing `NestInterceptor`. In the `intercept()` method, use `pipe(map(data => ...))` to wrap the response into:
    ```typescript
    {
      statusCode: context.switchToHttp().getResponse().statusCode,
      message: 'Success',
      data: data,
      timestamp: new Date().toISOString(),
    }
    ```
  - Step 3: Register it globally in `main.ts`:
    ```typescript
    app.useGlobalInterceptors(new TransformInterceptor());
    ```
- **Minimum acceptance criteria**
  - Every success response includes `statusCode`, `message`, `data`, and `timestamp`.
- **Nice to have**
  - Keep success `message` consistent across endpoints.

## 2
### title
Build the AllExceptionsFilter
### body
- **Steps to follow**
  - Step 1: Create file `all-exceptions.filter.ts` in the `common/filters/` directory.
  - Step 2: Implement class `AllExceptionsFilter` implementing `ExceptionFilter` with the `@Catch()` decorator (no parameters to catch all exception types).
  - Step 3: In the `catch(exception, host)` method:
    - If `exception` is an `HttpException`, extract `statusCode` and `message` from the exception.
    - If not an `HttpException`, return `statusCode: 500` and `message: 'Internal Server Error'`.
    - Return a JSON response in the format:
      ```typescript
      {
        statusCode: status,
        error: HttpStatus[status] || 'Internal Server Error',
        message: message,
        timestamp: new Date().toISOString(),
      }
      ```
    - Never expose the `stack trace` externally.
  - Step 4: Register it globally in `main.ts`:
    ```typescript
    app.useGlobalFilters(new AllExceptionsFilter());
    ```
- **Minimum acceptance criteria**
  - All exceptions return unified error JSON without stack traces.
- **Nice to have**
  - Centralize error message formatting for easier maintenance.

## 3
### title
Test the unified response format
### body
- **Steps to follow**
  - Step 1: Start the application:
    ```bash
    nest start --watch
    ```
  - Step 2: Call a successful endpoint:
    ```bash
    curl http://localhost:3000/tasks
    ```
    Verify the response has the format:
    ```json
    {
      "statusCode": 200,
      "message": "Success",
      "data": [...],
      "timestamp": "2025-..."
    }
    ```
  - Step 3: Call an endpoint with a non-existent id (NotFoundException):
    ```bash
    curl http://localhost:3000/tasks/999
    ```
    Verify the response has the format:
    ```json
    {
      "statusCode": 404,
      "error": "Not Found",
      "message": "...",
      "timestamp": "2025-..."
    }
    ```
  - Step 4: Create a temporary endpoint `GET /tasks/crash` in the controller that throws `new Error('Unexpected')` (non-HttpException error). Call this endpoint:
    ```bash
    curl http://localhost:3000/tasks/crash
    ```
    Verify the response returns 500 with safe JSON, no stack trace included.
- **Minimum acceptance criteria**
  - `GET /tasks` -> `{ statusCode: 200, message: "Success", data: [...], timestamp }`.
  - `GET /tasks/999` -> `{ statusCode: 404, error: "Not Found", message, timestamp }`.
  - `GET /tasks/crash` -> `{ statusCode: 500, error: "Internal Server Error", message, timestamp }` with no stack trace.
- **Nice to have**
  - Verify additional runtime failure cases to ensure stable error format.

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
## 2
### alias
NestJS First Steps
### url
https://docs.nestjs.com/first-steps

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
Interceptor wraps response correctly
##### score
10
##### promptText
Grading rubric (max 10):
- 4 points: `TransformInterceptor` is registered globally.
- 4 points: Successful responses contain `statusCode`, `message`, `data`, and `timestamp`.
- 2 points: `GET /tasks` returns wrapped data, not raw payload.

Score by summing achieved criteria; missing required fields loses corresponding points.
#### 1
##### title
Filter catches all exceptions safely
##### score
10
##### promptText
Grading rubric (max 10):
- 4 points: `AllExceptionsFilter` is registered globally and catches both HTTP and non-HTTP exceptions.
- 4 points: Error responses match `{ statusCode, error, message, timestamp }`.
- 2 points: No stack trace is exposed in any error case.

Score criteria independently and total the points.

# difficulty
easy

# score
20
