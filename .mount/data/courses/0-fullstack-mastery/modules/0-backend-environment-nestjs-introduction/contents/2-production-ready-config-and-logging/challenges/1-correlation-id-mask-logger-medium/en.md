# title
Correlation-id propagation and Winston formatter masking sensitive fields for PaymentGateway

# description
Upgrade the EASY PaymentGateway app into a production-ready service with two logging capabilities that are non-negotiable in production: (1) correlation-id propagation - every log line within the same request carries the same requestId, whether the client already sent x-request-id or the server generates it; (2) a dedicated Winston formatter that masks sensitive fields (password, cardNumber, cvv, webhookSecret) into before writing - no JSON.stringify(...).replace(...) hacks. requestId propagation must work across async boundaries (Promise, setTimeout) via AsyncLocalStorage.

# requirements
## 0
### purpose
Upgrade the EASY project into a production-ready logging service with request correlation and sensitive-data masking.
### technicalConstraints
Use a new project `correlation-id-mask-logger` while preserving EASY foundations: 3 config namespaces, Winston console/file logging, and fail-fast env validation.
### proTipsHints
Start from a stable EASY baseline so changes focus only on correlation and formatter behavior.

## 1
### purpose
Propagate `requestId` through the full request lifecycle using AsyncLocalStorage.
### technicalConstraints
Global middleware must read `x-request-id`; reuse only valid UUID v4 values, otherwise generate `crypto.randomUUID()`; always set response `x-request-id`; store active id in `AsyncLocalStorage`.
### proTipsHints
Validate all three id flows explicitly: missing, valid incoming, invalid incoming.

## 2
### purpose
Inject request correlation metadata into logs automatically.
### technicalConstraints
Implement a `requestId` formatter that reads from `AsyncLocalStorage` and writes `info.requestId` only when context exists; non-request logs must remain valid.
### proTipsHints
Place this formatter in `format.combine(...)` before serialization.

## 3
### purpose
Mask sensitive values centrally at logger layer.
### technicalConstraints
Implement recursive mask formatter for case-insensitive keys `password/cardNumber/cvv/webhookSecret`, replacing values with `'***'`, and run it before `winston.format.json()`.
### proTipsHints
Keep masking logic pure and recursive over objects/arrays to simplify runtime verification and reuse.

## 4
### purpose
Prove masking and propagation with real endpoint behavior.
### technicalConstraints
`POST /payments/charge` must log raw body containing sensitive fields for masking verification; `GET /payments/health` must log before and after an async boundary.
### proTipsHints
Use a short awaited delay in health flow to validate async-context continuity.

## 5
### purpose
Guarantee masking reliability through runtime verification.
### technicalConstraints
You must verify 4 masking scenarios: root sensitive field, nested sensitive field, non-sensitive fields unchanged, and case-insensitive key handling.
### proTipsHints
Prepare 4 sample payloads and validate their masked outputs directly in `logs/app.log`.

## 6
### purpose
Prevent unsafe shortcuts and architecture violations.
### technicalConstraints
Forbidden: stringify-replace masking, global/singleton requestId hacks, hardcoded secrets, or dropping EASY security rules.
### proTipsHints
Use a pre-submit checklist to catch anti-patterns before grading.

### forbidden
- Using `JSON.stringify(...).replace(...)` for sensitive-data masking -> **0 masking prompt**.
- Storing request context via global/singleton hacks instead of `AsyncLocalStorage` -> **0 correlation-propagation prompt**.
- Hardcoding real secrets in code or logs -> **0 security-hygiene prompt**.
- Losing `requestId` across async boundaries -> **0 async-context prompt**.

# prerequisites
## 0
### text
Completed `0-payment-gateway-config-namespaces-easy` successfully.
## 1
### text
Understand how NestJS middleware runs in the request lifecycle.
## 2
### text
Know basic `AsyncLocalStorage` behavior (`node:async_hooks`) and why context propagation matters.
## 3
### text
Know how to implement and register custom `winston.format` functions.

# steps

## 0
### title
Fork/copy the EASY project and install extra dependencies
### body
**Steps to follow**
- **Step 1:** Copy/clone the EASY project into a new folder `correlation-id-mask-logger` (keep the 3 config namespaces + Winston + fail-fast intact).
- **Step 2:** Install extra dependencies if not already present:
  ```bash
  npm i uuid
  npm i -D @types/uuid
  ```
- **Step 3:** Create new folders `src/correlation/` and `src/logger/formatters/`.

**Minimum acceptance criteria**
- New project is named `correlation-id-mask-logger`, boots with `npm run start:dev`.
- The 3 config namespaces + Joi validation + Winston console/file from EASY are preserved (no downgrade).
- `src/correlation/` and `src/logger/formatters/` folders exist.

**Nice to have**
- Add `npm run lint` + an `eslint` rule banning direct imports of `winston.transports.Console` outside `logger.module.ts`.

## 1
### title
Create the AsyncLocalStorage store and CorrelationIdMiddleware
### body
**Steps to follow**
- **Step 1:** Create `src/correlation/correlation.storage.ts`:
  ```ts
  import { AsyncLocalStorage } from 'node:async_hooks';
  export interface CorrelationStore { requestId: string }
  export const correlationStorage = new AsyncLocalStorage<CorrelationStore>();
  ```
- **Step 2:** Create `src/correlation/correlation-id.middleware.ts`:
  ```ts
  import { Injectable, NestMiddleware } from '@nestjs/common';
  import { randomUUID } from 'node:crypto';
  import { correlationStorage } from './correlation.storage';

  const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  @Injectable()
  export class CorrelationIdMiddleware implements NestMiddleware {
    use(req: any, res: any, next: () => void) {
      const incoming = req.headers['x-request-id'];
      const requestId = typeof incoming === 'string' && UUID_V4.test(incoming)
        ? incoming
        : randomUUID();
      res.setHeader('x-request-id', requestId);
      correlationStorage.run({ requestId }, () => next());
    }
  }
  ```
- **Step 3:** In `AppModule`, implement `configure(consumer: MiddlewareConsumer)` to apply `CorrelationIdMiddleware` via `forRoutes('*')`.
- **Step 4:** Create a convenience param decorator `@RequestId()` at `src/correlation/request-id.decorator.ts` that reads from `correlationStorage.getStore()?.requestId`.

**Minimum acceptance criteria**
- A request WITHOUT `x-request-id` -> the response `x-request-id` header is a valid UUID v4 (matches the UUID v4 regex).
- A request WITH `x-request-id: 11111111-1111-4111-8111-111111111111` -> the response echoes the same value (reused).
- A request WITH `x-request-id: not-a-uuid` -> the server does NOT reuse it and returns a fresh UUID v4.
- `correlationStorage` is a **single instance** exported from the module (not re-created per request).

**Nice to have**
- Extend the regex to accept UUID v7 to experiment with time-sortable ids.
- Allow the header name to be configured via `.env` (`REQUEST_ID_HEADER`).

## 2
### title
Write the two Winston formatters: inject requestId + mask sensitive data
### body
**Steps to follow**
- **Step 1:** Create `src/logger/formatters/request-id.formatter.ts`:
  ```ts
  import { format } from 'winston';
  import { correlationStorage } from '../../correlation/correlation.storage';
  export const requestIdFormat = format((info) => {
    const store = correlationStorage.getStore();
    if (store?.requestId) info.requestId = store.requestId;
    return info;
  });
  ```
- **Step 2:** Create `src/logger/formatters/mask.formatter.ts` with a recursive walker:
  ```ts
  import { format } from 'winston';

  const SENSITIVE = new Set(['password','cardnumber','cvv','webhooksecret']);

  function maskRecursive(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(maskRecursive);
    if (value && typeof value === 'object') {
      const out: any = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = SENSITIVE.has(k.toLowerCase()) ? '***' : maskRecursive(v);
      }
      return out;
    }
    return value;
  }

  export const maskFormat = format((info) => maskRecursive(info) as any);
  ```
- **Step 3:** In `logger.module.ts`, update `format`:
  ```ts
  format: winston.format.combine(
    requestIdFormat(),
    maskFormat(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  )
  ```
- **Step 4:** `PaymentGatewayService.charge(body)` logs `this.logger.log({ message: 'charging', body }, PaymentGatewayService.name)` - logging the raw body is intentional, to test the masker.
- **Step 5:** Prepare and run 4 masking verification payloads through the endpoint:
  - `{password: 'abc'}` -> `password` must become `'***'`
  - `{card: {number: '4111...', cvv: '123'}}` -> `card.number` and `card.cvv` must become `'***'`
  - `{username: 'alice', age: 30}` -> unchanged (no sensitive key)
  - `{Password: 'x', CARDNUMBER: 'y'}` -> still masked (case-insensitive behavior)

**Minimum acceptance criteria**
- `src/logger/formatters/mask.formatter.ts` exists and is a `winston.format((info) => ...)`; it does NOT use `JSON.stringify(...).replace(...)`.
- Runtime evidence exists for all 4 required masking scenario groups.
- Calling `POST /payments/charge` with a body containing `password` + `card.cvv` + `card.number` -> those fields appear as `"***"` in `logs/app.log`, while `amount` and `orderId` are NOT masked.
- Every log emitted within the request lifecycle has a `requestId` field equal to the response `x-request-id` header.
- Logs emitted OUTSIDE the request context (e.g. at `main.ts` bootstrap time) do not crash and do not carry `requestId` (or `requestId: undefined` is stripped by `json()`).

**Nice to have**
- Allow the sensitive key list to be configured via `.env` (`LOG_SENSITIVE_KEYS=password,cvv,...`).
- Add a `redactLong` formatter that truncates strings > 1000 characters into `...(truncated)` to avoid log bloat.
- Add a small bash script that sends 2 concurrent requests and demonstrates no `requestId` cross-contamination.

## 3
### title
Smoke-test 4 scenarios via curl (auto-generate id / reuse id / mask nested / health propagation)
### body
**Steps to follow**
- **Step 1:** Run `npm run start:dev`, open another terminal and `tail -f logs/app.log`.
- **Step 2:** Call `POST /payments/charge` without `x-request-id` to verify auto-generated id and sensitive-field masking.
  ```bash
  curl -X POST http://localhost:3000/payments/charge \
    -H "Content-Type: application/json" \
    -d '{"orderId":"ORD-010","amount":250000,"password":"s3cret!","card":{"number":"4111111111111111","cvv":"123"}}' -i
  ```
  Expected: response header includes UUID v4 `x-request-id`; logs for this request mask `password/card.number/card.cvv`.
- **Step 3:** Call `POST /payments/charge` with a valid client `x-request-id` to verify reuse behavior.
  ```bash
  curl -X POST http://localhost:3000/payments/charge \
    -H "x-request-id: 11111111-1111-4111-8111-111111111111" \
    -H "Content-Type: application/json" \
    -d '{"orderId":"ORD-011","amount":99000,"password":"p@ss","card":{"number":"5555444433332222","cvv":"999"}}' -i
  ```
  Expected: response keeps `x-request-id: 11111111-1111-4111-8111-111111111111` and logs carry the same id.
- **Step 4:** Call `POST /payments/charge` with malformed `x-request-id` to verify server-side regeneration.
  ```bash
  curl -X POST http://localhost:3000/payments/charge \
    -H "x-request-id: haha-not-a-uuid" \
    -H "Content-Type: application/json" \
    -d '{"orderId":"ORD-012","amount":1000,"password":"a","card":{"number":"0","cvv":"0"}}' -i
  ```
  Expected: response returns a fresh UUID v4 different from `haha-not-a-uuid`; logs use that fresh UUID.
- **Step 5:** Call `GET /payments/health` with a fixed request id to verify async-boundary propagation.
  ```bash
  curl http://localhost:3000/payments/health \
    -H "x-request-id: 22222222-2222-4222-8222-222222222222" -i
  ```
  Expected: endpoint logs `requestId` both before and after `await setTimeout(50ms)` with the same value `22222222-2222-4222-8222-222222222222`.
- **Step 6:** In `README.md` under **Smoke Test**, paste 4 JSON log blocks from the 4 requests. Highlight (in bold): (a) the response `x-request-id`, (b) masked `password` / `card.cvv` / `card.number` fields, (c) the two health logs sharing the same `requestId`.

**Minimum acceptance criteria**
- Request without `x-request-id` -> response `x-request-id` is a valid UUID v4; the same value appears on **every** log line produced by that request.
- Request with `x-request-id: 11111111-1111-4111-8111-111111111111` -> response echoes the same value; the log line contains `"requestId":"11111111-1111-4111-8111-111111111111"`.
- Request with `x-request-id: haha-not-a-uuid` -> response `x-request-id` is a **different** valid UUID v4; the log uses the new UUID.
- In `logs/app.log` for `ORD-010`: `password="***"`, `card.cvv="***"`, `card.number="***"`; `orderId` and `amount` retain their raw values.
- Health endpoint: the two log lines (pre/post `await setTimeout 50ms`) share `requestId=22222222-2222-4222-8222-222222222222`, proving AsyncLocalStorage crosses the async boundary.

**Nice to have**
- Fire 5 concurrent requests (`&` in bash) with distinct `x-request-id`s and verify the log has no cross-contamination - each `requestId` only appears in lines of its own request.
- Add a `POST /payments/slow` endpoint that `await setTimeout(200)` three times then logs, proving the `requestId` is stable.
- Save all 4 curl commands in `docs/smoke-test.sh` for repeatable checks.

# references
## 0
### alias
Node.js - AsyncLocalStorage
### url
https://nodejs.org/api/async_context.html#class-asynclocalstorage
## 1
### alias
NestJS - Middleware
### url
https://docs.nestjs.com/middleware
## 2
### alias
Winston - Creating custom formats
### url
https://github.com/winstonjs/winston#creating-custom-formats
## 3
### alias
OpenTelemetry - Context propagation (design reference)
### url
https://opentelemetry.io/docs/concepts/context/

# submissions
## 0
### type
githubUrl
### title
GitHub Repository Link
### description
Submit a GitHub repository with the full source: correlation-id middleware, two Winston formatters (`requestId` + `mask`), masker unit tests, a README whose **Smoke Test** section pastes the 4 real JSON log blocks from the 4 scenarios, and a **Design** section explaining why `AsyncLocalStorage` was chosen over globals. Commit `.env.example.*`, never commit real `.env.development` / `.env.production`.
### score
30
### prompts
#### 0
##### title
CorrelationIdMiddleware reuses / generates / rejects request ids by the rules
##### score
8
##### promptText
Grading rubric (max 8):

- Criterion A (3 points): Middleware handles all 3 id branches correctly (reuse valid UUID, regenerate invalid, generate when missing).
- Criterion B (2 points): Response always includes `x-request-id`.
- Criterion C (3 points): README smoke test contains real proof for all id scenarios.

Scoring rule: each criterion earns points only when fully met; missing/incorrect criteria earn 0 points.
#### 1
##### title
AsyncLocalStorage propagates requestId into every log, including after await
##### score
6
##### promptText
Grading rubric (max 6):

- Criterion A (2 points): `correlationStorage` is a single `AsyncLocalStorage` instance set via `.run(...)` in middleware.
- Criterion B (2 points): Logs inside one request keep the same `requestId`, including after `await`.
- Criterion C (2 points): No architecture workarounds (global variables, singleton hacks, or parameter-passing requestId) are used.

Scoring rule: each criterion earns points only when fully met; missing/incorrect criteria earn 0 points.
#### 2
##### title
Winston mask formatter walks recursively, no JSON.stringify hack
##### score
8
##### promptText
Grading rubric (max 8):

- Criterion A (3 points): `mask.formatter.ts` recursively masks sensitive keys case-insensitively and avoids stringify/regex hacks.
- Criterion B (2 points): Runtime evidence covers all 4 required masking scenario groups.
- Criterion C (3 points): Real `ORD-010` logs show masked sensitive fields while keeping `orderId` and `amount` unchanged.

Scoring rule: each criterion earns points only when fully met; missing/incorrect criteria earn 0 points.
#### 3
##### title
The 4 smoke scenarios are documented and pass in order in the README
##### score
8
##### promptText
Grading rubric (max 8):

- Criterion A (3 points): README includes 4 real JSON log blocks for all 4 required scenarios.
- Criterion B (3 points): Each block clearly shows `requestId` and masked sensitive fields.
- Criterion C (2 points): No placeholders are used; logs match described behavior.

Scoring rule: each criterion earns points only when fully met; missing/incorrect criteria earn 0 points.
## 1
### type
googleDocsUrl
### title
Design Note - why AsyncLocalStorage + custom formatter instead of a manual request-id middleware
### description
Share a Google Doc (`Anyone with link: Viewer`) of at least 400 words explaining: (a) why correlation-id matters in production; (b) comparing `AsyncLocalStorage` vs request-scoped provider vs parameter passing - trade-offs in performance, maintainability, and crossing async boundaries; (c) why masking **must** live at the logger formatter layer rather than in the controller/service (defense-in-depth). Include a Mermaid sequence diagram: client -> middleware -> service -> logger formatter -> file.
### score
10
### prompts
#### 0
##### title
Explains all 3 points a/b/c and includes the Mermaid diagram
##### score
10
##### promptText
Grading rubric (max 10):

- Criterion A (3 points): Doc is >= 400 words and explains production motivation for correlation-id.
- Criterion B (4 points): AsyncLocalStorage is compared against alternatives with concrete trade-offs.
- Criterion C (3 points): Formatter-layer masking rationale is clear and accompanied by a correct Mermaid flow diagram.

Scoring rule: each criterion earns points only when fully met; missing/incorrect criteria earn 0 points.

# outputs
## 0
### title
Implement production-safe request correlation
### text
You can propagate a stable requestId across middleware, services, and async boundaries without cross-request leakage.
## 1
### title
Centralize sensitive-data masking at logger layer
### text
You can build recursive masking in Winston formatters and validate it from real logs so sensitive payload fields are protected by default.
## 2
### title
Validate observability behavior with runtime evidence
### text
You can prove request-id reuse/reject/generate and masking behavior through real smoke-test logs and structured verification.

# difficulty
medium

# score
40
