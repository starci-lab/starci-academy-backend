# title
CRUD Article with JwtAuthGuard, RolesGuard, custom Pipe and LoggingInterceptor

# description
Push the pipeline to a production-grade scenario: a CRUD Article feature with Authentication (fake-decoded token), Authorization by role, a custom Pipe for a query parameter, and an Interceptor timing every request. This challenge verifies your ability to stack guards in the correct order (JwtAuthGuard must run before RolesGuard because RolesGuard needs to read req.user), place logic in the right layer, and handle the 3 required edge cases for auth/role/validation.

# requirements
## 0
### purpose
Build a NestJS CRUD `Article` feature with stable in-memory mock data so auth/role/validation flows can be tested reliably.
### technicalConstraints
Project folder must be `article-auth-role-crud`. Required endpoints: public `GET /articles?tag=<tag>`, authenticated `POST /articles`, authenticated `PATCH /articles/:id`, admin-only `DELETE /articles/:id`.
### proTipsHints
Seed 3 fixed sample records first; this makes smoke-test expectations deterministic.

## 1
### purpose
Implement authentication in `JwtAuthGuard` using one fake-token contract.
### technicalConstraints
`Authorization: Bearer user-<role>-<id>` must be parsed into `req.user = {id, role}`; missing/invalid format must return `UnauthorizedException` with `code: "UNAUTHENTICATED"`.
### proTipsHints
Use one regex/token parser helper to avoid duplicated parsing logic.

## 2
### purpose
Implement authorization with `@Roles` metadata and `RolesGuard`.
### technicalConstraints
`RolesGuard` must read metadata via `Reflector`; unauthorized roles must throw `ForbiddenException` with `code: "FORBIDDEN_ROLE"`.
### proTipsHints
Return early when no roles metadata is present to avoid blocking routes unintentionally.

## 3
### purpose
Enforce input quality through query pipe + DTO validation.
### technicalConstraints
`TrimAndLowercasePipe` trims/lowercases query `tag`; empty after trim throws `BadRequestException` with `code: "EMPTY_TAG"`. `CreateArticleDto` must use the required `class-validator` rules.
### proTipsHints
Enable global `ValidationPipe` with `whitelist`, `transform`, and `forbidNonWhitelisted`.

## 4
### purpose
Standardize observability and error contracts for all requests.
### technicalConstraints
`LoggingInterceptor` must log `[LOG] <method> <url> <statusCode> <durationMs>ms`. `AllExceptionsFilter` must normalize errors into `{code, message}` and map unknown errors to `INTERNAL_ERROR`.
### proTipsHints
Keep logging and exception mapping in dedicated files to preserve layer boundaries.

## 5
### purpose
Preserve strict execution order and layer responsibilities in the pipeline.
### technicalConstraints
Must register guards as `@UseGuards(JwtAuthGuard, RolesGuard)` in this exact order. Forbidden: role checks in controller, token decoding in middleware/interceptor.
### proTipsHints
Use a review checklist: auth in guard, validation in pipe/DTO, business logic in service/controller.

### forbidden
- Reversing guard order (`RolesGuard` before `JwtAuthGuard`) -> **0 auth-flow prompt**.
- Performing role checks directly in controller/service instead of `RolesGuard` -> **0 authorization-layer prompt**.
- Decoding tokens in middleware/interceptor instead of auth guard -> **0 authentication-layer prompt**.
- Skipping `{code, message}` error contract or interceptor log format -> **0 observability/error-contract prompt**.

# prerequisites
## 0
### text
Completed the EASY `BookController` pipeline challenge and understand base execution order across middleware/guard/pipe/interceptor/filter.
## 1
### text
Comfortable with `@UseGuards`, `@SetMetadata`, and `Reflector` for handler/class-level authorization logic.
## 2
### text
Know `class-validator`, `ValidationPipe`, and `ExceptionFilter` to enforce input constraints and normalize errors.

# steps

## 0
### title
Scaffold the project and 4 Article CRUD endpoints over mock data
### body
**Steps to follow**
- **Step 1:** Create the project:
  ```bash
  nest new article-auth-role-crud
  cd article-auth-role-crud
  nest g module article
  nest g controller article
  nest g service article
  ```
- **Step 2:** Inside `ArticleService`, declare `private readonly articles: Article[]` with 3 sample articles (ids `1`, `2`, `3`; each with `title`, `content`, `tag`); implement `list(tag?: string)`, `create(dto)`, `update(id, dto)`, `remove(id)` working directly on the in-memory array.
- **Step 3:** Inside `ArticleController`, declare 4 handlers matching the 4 endpoints above, with **no guard/pipe/interceptor attached yet**; accept body as `any` for now, return data straight from the service.
- **Step 4:** Run `npm run start:dev` and hit `GET /articles` via curl or browser to verify the endpoint returns 3 articles.

**Minimum acceptance criteria**
- Project folder name is exactly `article-auth-role-crud`; `npm run start:dev` boots without errors.
- `ArticleService` implements all 4 methods `list`, `create`, `update`, `remove`; the mock array is seeded with 3 items.
- `GET /articles` returns a 3-element array; `GET /articles?tag=nest` filters correctly (tag validation can come later).
- No guard/pipe/interceptor is attached to the controller yet (verify via code + the request succeeds without any header).

**Nice to have**
- Declare `interface Article { id: number; title: string; content: string; tag: string }` in `src/article/article.types.ts`.
- Generate a new article `id` via `Math.max(...ids)+1` instead of incrementing manually.

## 1
### title
Implement JwtAuthGuard, RolesGuard, the @Roles decorator, and register them in the correct order
### body
**Steps to follow**
- **Step 1:** Create `src/common/guards/jwt-auth.guard.ts` exporting `JwtAuthGuard implements CanActivate`. In `canActivate`: get `req = ctx.switchToHttp().getRequest()`; if `Authorization` is missing or does not start with `Bearer ` -> `throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'Missing Bearer token' })`. Take `token = auth.slice(7)`; if it does not match `^user-(admin|member)-(\d+)$` -> `UnauthorizedException` `code: 'UNAUTHENTICATED'`. Attach `req.user = { id: Number(match[2]), role: match[1] }`; log `[JWT] user=${req.user.role}#${req.user.id}`; return `true`.
- **Step 2:** Create `src/common/decorators/roles.decorator.ts` exporting `const Roles = (...roles: string[]) => SetMetadata('roles', roles)`.
- **Step 3:** Create `src/common/guards/roles.guard.ts` exporting `RolesGuard implements CanActivate`. Inject `Reflector`. In `canActivate(ctx)`: `const required = this.reflector.getAllAndOverride<string[]>('roles', [ctx.getHandler(), ctx.getClass()])`; if `!required || required.length === 0` -> return `true`. Read `req.user`; if `!req.user` -> `UnauthorizedException` (defensive); if `!required.includes(req.user.role)` -> `throw new ForbiddenException({ code: 'FORBIDDEN_ROLE', message: \`Required role: \${required.join(',')}\` })`. Log `[ROLES] ok for ${req.user.role}`.
- **Step 4:** In `ArticleController`, attach `@UseGuards(JwtAuthGuard, RolesGuard)` at class level. Skip the guard for `GET /articles` via a `@SkipAuth()` decorator (create `src/common/decorators/skip-auth.decorator.ts` exporting `SetMetadata('skipAuth', true)`); update `JwtAuthGuard` to read this metadata via `Reflector` and skip when present. Attach `@SkipAuth()` to the `GET /articles` handler.
- **Step 5:** Attach `@Roles('admin')` only to the `DELETE /articles/:id` handler.

**Minimum acceptance criteria**
- The 2 guard files live at `src/common/guards/{jwt-auth,roles}.guard.ts`, one class per file; the 2 decorators live under `src/common/decorators/`.
- `@UseGuards(JwtAuthGuard, RolesGuard)` is declared in **the correct order** (`JwtAuthGuard` first) at `ArticleController` level.
- `POST /articles` without `Authorization` returns `401` `UNAUTHENTICATED`.
- `DELETE /articles/1` with token `user-member-42` returns `403` `FORBIDDEN_ROLE`.
- `DELETE /articles/1` with token `user-admin-1` succeeds (status 200/204 depending on implementation).
- `GET /articles` works without any header thanks to `@SkipAuth()`.

**Nice to have**
- Extract the token regex into a `TOKEN_PATTERN` constant for easier maintenance.
- Add a `@CurrentUser()` param decorator to read `req.user` cleanly.
- Extract the two roles `admin` and `member` into a `UserRole` enum instead of string literals.

## 2
### title
Implement TrimAndLowercasePipe, CreateArticleDto, LoggingInterceptor and ExceptionFilter
### body
**Steps to follow**
- **Step 1:** Create `src/common/pipes/trim-lowercase.pipe.ts` exporting `TrimAndLowercasePipe implements PipeTransform<string, string>`. In `transform(value)`: if `value == null` -> return `value`; `const v = String(value).trim().toLowerCase()`; if `v.length === 0` -> `throw new BadRequestException({ code: 'EMPTY_TAG', message: 'tag must not be empty after trim' })`; log `[PIPE] tag=${v}`; return `v`.
- **Step 2:** Apply the pipe on the query: `list(@Query('tag', TrimAndLowercasePipe) tag?: string)` inside `ArticleController`. Note: the pipe only runs when `tag` is actually sent; when the client omits `tag`, the pipe is not invoked.
- **Step 3:** Create `src/article/dto/create-article.dto.ts`: class `CreateArticleDto` with `title` decorated by `@IsString() @IsNotEmpty() @MinLength(3)`, `content` by `@IsString() @IsNotEmpty()`, `tag` by `@IsString() @IsOptional()`. In `main.ts`, enable `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }))`.
- **Step 4:** Change the `POST /articles` handler signature to accept `@Body() dto: CreateArticleDto`; the `PATCH /articles/:id` handler uses `@Body() dto: UpdateArticleDto` (built with `PartialType(CreateArticleDto)`).
- **Step 5:** Create `src/common/interceptors/logging.interceptor.ts` exporting `LoggingInterceptor implements NestInterceptor`. In `intercept(ctx, next)`: `const start = Date.now(); const req = ctx.switchToHttp().getRequest(); return next.handle().pipe(tap(() => { const res = ctx.switchToHttp().getResponse(); console.log(\`[LOG] \${req.method} \${req.url} \${res.statusCode} \${Date.now() - start}ms\`) }))`. Register globally via `APP_INTERCEPTOR`.
- **Step 6:** Create `src/common/filters/all-exceptions.filter.ts` exporting `@Catch() AllExceptionsFilter` (logic mirrors the EASY BookController challenge); register globally via `APP_FILTER`.

**Minimum acceptance criteria**
- The 3 files `trim-lowercase.pipe.ts`, `logging.interceptor.ts`, `all-exceptions.filter.ts` exist at the exact paths; `CreateArticleDto` has every decorator above.
- `GET /articles?tag=%20Nest%20` succeeds and filters by `tag = "nest"` (trimmed + lowercased).
- `GET /articles?tag=` (empty after trim) returns `400` with body `{code: "EMPTY_TAG", ...}`.
- `POST /articles` with body `{ "content": "abc" }` (missing `title`) returns `400` body `{code, message}`; no stacktrace leaks.
- Every successful request produces exactly one `[LOG] METHOD URL STATUS <N>ms` line.
- `ValidationPipe` has `forbidNonWhitelisted: true`; sending a body with an unknown field (e.g. `{ title, content, hack: 1 }`) returns `400`.

**Nice to have**
- Add a lightweight metrics hook: the interceptor pushes each `durationMs` into `Map<route, number[]>` and exposes `GET /metrics` returning p50/p95 computed from the map (internal, no extra lib).
- Use `class-transformer`'s `@Expose` to serialize the response to DTO fields only.
- Extract a global `CommonModule` grouping the 3 global providers (interceptor + filter + guard) for cleanliness.

## 3
### title
Smoke-test 4 scenarios via curl (happy + auth fail + role fail + validation fail)
### body
**Steps to follow**
- **Step 1:** Run `npm run start:dev`; open a separate terminal to watch the logs.
- **Step 2:** Call `POST /articles` with an admin token to verify happy-path article creation.
  ```bash
  curl -X POST http://localhost:3000/articles \
    -H "Authorization: Bearer user-admin-1" \
    -H "Content-Type: application/json" \
    -d '{"title":"Intro to NestJS pipeline","content":"Request lifecycle","tag":"nest"}' -i
  ```
  Expected: HTTP `201`, response includes generated `id` and `tag: "nest"`.
- **Step 3:** Call `POST /articles` without token to verify auth failure.
  ```bash
  curl -X POST http://localhost:3000/articles \
    -H "Content-Type: application/json" \
    -d '{"title":"Should fail","content":"no auth"}' -i
  ```
  Expected: HTTP `401`, body contains `code: "UNAUTHENTICATED"`, and no `[ROLES]` log appears.
- **Step 4:** Call `DELETE /articles/1` with a member token to verify role failure.
  ```bash
  curl -X DELETE http://localhost:3000/articles/1 \
    -H "Authorization: Bearer user-member-42" -i
  ```
  Expected: HTTP `403`, body contains `code: "FORBIDDEN_ROLE"`, and controller log is absent.
- **Step 5:** Call `GET /articles?tag=%20` to verify query validation failure.
  ```bash
  curl "http://localhost:3000/articles?tag=%20" -i
  ```
  Expected: HTTP `400`, body contains `code: "EMPTY_TAG"`, and logs show `[PIPE]` but no controller line.
- **Step 6:** Paste the 4 real responses (headers + JSON body) and the 4 matching terminal log blocks into `README.md` under the **Smoke Test** section.

**Minimum acceptance criteria**
- Happy path returns HTTP `201` with a body containing the new article (auto-generated `id`) and `tag: "nest"`; logs contain `[LOG] POST /articles 201 ...ms`.
- Missing token returns HTTP `401` body `{code: "UNAUTHENTICATED", ...}`; logs do NOT contain `[ROLES]` (the first guard blocks before `RolesGuard` runs).
- `DELETE` as member returns HTTP `403` body `{code: "FORBIDDEN_ROLE", ...}`; logs contain `[JWT]` but NO controller line (the roles guard blocks after jwt passes).
- `?tag=%20` returns HTTP `400` body `{code: "EMPTY_TAG", ...}`; logs contain `[PIPE]` but NO controller line.
- README has a **Smoke Test** section with the 4 real JSON responses + 4 matching real log blocks, pasted verbatim.

**Nice to have**
- Save all 4 curl commands into `docs/smoke-test.sh` for repeatable checks.
- Draw a Mermaid sequence diagram in the README showing `client -> JwtAuthGuard -> RolesGuard -> Controller`.
- Add a GIF capturing terminal logs + terminal responses for the 4 calls.

# outputs
## 0
### title
Apply auth and role checks at the correct pipeline layers
### text
You can implement authentication in `JwtAuthGuard`, authorization in `RolesGuard`, and justify why guard order directly affects correctness.
## 1
### title
Enforce reliable input and error contracts for CRUD APIs
### text
You can combine query pipes and DTO validation to reject invalid input early while keeping error responses consistent as `{code, message}`.
## 2
### title
Validate critical auth/role/validation edge cases confidently
### text
You can design smoke tests for failure scenarios and use logs to prove where requests stop in the lifecycle.

# references
## 0
### alias
NestJS Guards
### url
https://docs.nestjs.com/guards
## 1
### alias
NestJS Custom Decorators
### url
https://docs.nestjs.com/custom-decorators
## 2
### alias
NestJS Pipes - Custom Pipe
### url
https://docs.nestjs.com/pipes#custom-pipes
## 3
### alias
NestJS Interceptors
### url
https://docs.nestjs.com/interceptors
## 4
### alias
NestJS Testing
### url
https://docs.nestjs.com/fundamentals/testing

# submissions
## 0
### type
githubUrl
### title
GitHub Repository Link
### description
Submit a GitHub repository link containing the full source code. The repo must include a `README.md` with: feature description, a `Layer | File | Scope` table, and a **Smoke Test** section with the 4 real responses + 4 log blocks.
### score
24
### prompts
#### 0
##### title
Guards are stacked in the correct order and @Roles metadata is used correctly
##### score
8
##### promptText
Grading rubric (max 8):

- Criterion A (3 points): `ArticleController` uses `@UseGuards(JwtAuthGuard, RolesGuard)` in the correct order (`JwtAuthGuard` first).
- Criterion B (2 points): `DELETE /articles/:id` has `@Roles('admin')` and `RolesGuard` reads metadata via `Reflector.getAllAndOverride(...)`.
- Criterion C (3 points): No token decode/role checks exist in middleware/interceptor/controller (auth stays in `JwtAuthGuard` only).

Scoring rule: each criterion earns points only when fully met; missing/incorrect criteria earn 0 points.
#### 1
##### title
TrimAndLowercasePipe trims + lowercases + rejects empty
##### score
6
##### promptText
Grading rubric (max 6):

- Criterion A (2 points): `GET /articles?tag=%20Nest%20` returns 200 and behaves as `tag === "nest"` after trim/lowercase.
- Criterion B (2 points): `GET /articles?tag=%20` returns 400 with `code: "EMPTY_TAG"`.
- Criterion C (2 points): `GET /articles` without `tag` returns full list successfully.

Scoring rule: each criterion earns points only when fully met; missing/incorrect criteria earn 0 points.
#### 2
##### title
4 smoke-test scenarios return the right status + shape
##### score
10
##### promptText
Grading rubric (max 10):

- Criterion A (3 points): Happy path `POST /articles` with `Bearer user-admin-1` and valid payload returns 201 with `id`, `title`, and `tag`.
- Criterion B (2 points): Missing token returns 401 with `code: "UNAUTHENTICATED"`.
- Criterion C (2 points): `DELETE /articles/1` with `Bearer user-member-42` returns 403 with `code: "FORBIDDEN_ROLE"`.
- Criterion D (2 points): `GET /articles?tag=%20` returns 400 with `code: "EMPTY_TAG"`.
- Criterion E (1 point): README includes all 4 real responses for those scenarios.

Scoring rule: each criterion earns points only when fully met; missing/incorrect criteria earn 0 points.
## 1
### type
googleDocsUrl
### title
Design note - Where should auth logic live in the pipeline (optional)
### description
(Optional, not required.) A ~1-page Google Docs analyzing why auth/role logic must live in a `Guard` rather than in a `Middleware` or an `Interceptor`, with concrete trade-offs for this challenge's context.
### score
10
### prompts
#### 0
##### title
Compares the 3 candidate layers (Middleware / Guard / Interceptor)
##### score
5
##### promptText
Grading rubric (max 5):

- Criterion A (2 points): Compares all 3 layers: `Middleware`, `Guard`, and `Interceptor`.
- Criterion B (2 points): Uses at least 3 clear technical comparison criteria.
- Criterion C (1 point): Each criterion includes a winner and concrete rationale.

Scoring rule: each criterion earns points only when fully met; missing/incorrect criteria earn 0 points.
#### 1
##### title
Concludes by choosing Guard with concrete reasons for this challenge
##### score
5
##### promptText
Grading rubric (max 5):

- Criterion A (2 points): Provides an explicit final decision to use `Guard` for auth/role in this challenge.
- Criterion B (2 points): Gives at least 2 concrete, challenge-specific technical reasons.
- Criterion C (1 point): Reasons connect clearly to pipeline order and/or handler metadata usage.

Scoring rule: each criterion earns points only when fully met; missing/incorrect criteria earn 0 points.

# difficulty
medium

# score
34
