# title
Multi-environment configuration with 3 config namespaces and Winston structured logging for PaymentGateway

# description
Build a NestJS project for a PaymentGateway feature with production-ready config & logging. Configuration is split into 3 namespaces (app, database, payment), loaded by NODEENV from .env.development or .env.production, and validated against a Joi schema - a missing required variable crashes the app at startup (fail-fast), never halfway. Logging uses Winston with JSON console + file logs/app.log; every log carries level, timestamp, context.

# requirements
## 0
### purpose
Build a production-ready NestJS PaymentGateway project with environment-driven configuration and structured logging.
### technicalConstraints
Project folder must be `payment-gateway-config-namespaces`; business endpoint is `POST /payments/charge` with `{orderId, amount}`.
### proTipsHints
Scaffold module/controller/service first, then wire config and logger to reduce debugging scope.

## 1
### purpose
Split configuration into 3 clear namespaces for maintainability.
### technicalConstraints
Create `app.config.ts`, `database.config.ts`, `payment.config.ts` in `src/config/`, each using `registerAs('<namespace>', () => ({...}))`.
### proTipsHints
Keep namespace keys aligned with calls such as `ConfigService.get('payment.apiKey')`.

## 2
### purpose
Support environment switching safely with commit-safe templates.
### technicalConstraints
Use `.env.development` and `.env.production`; commit `.env.example.development` + `.env.example.production`; ignore real `.env.*`; keep at least 3 variables different between env files.
### proTipsHints
Use visibly different values like `APP_PORT`, `DB_NAME`, and `PAYMENT_PROVIDER` for easier verification.

## 3
### purpose
Enforce fail-fast validation for required environment variables.
### technicalConstraints
`ConfigModule.forRoot(...)` must load all 3 namespaces and Joi `validationSchema`; missing required variables must stop app boot immediately.
### proTipsHints
Use `abortEarly: true` to surface the first broken variable quickly during smoke tests.

## 4
### purpose
Standardize logs with Winston JSON format across console and file.
### technicalConstraints
Use global `nest-winston` with Console + `logs/app.log` transports, JSON format containing `level`, `timestamp`, `context`, `message`, and replace default Nest logger via `app.useLogger(...)`.
### proTipsHints
Set log level by environment (`debug` dev, `info` prod) and verify behavior in both modes.

## 5
### purpose
Preserve security and logging hygiene across the codebase.
### technicalConstraints
No hardcoded real secrets, no `console.*` in `src`, no real `.env.development` / `.env.production` committed.
### proTipsHints
Run `rg "console\\." src` before finalizing to catch violations quickly.

### forbidden
- Hardcoding real secrets in code or default config -> **0 security-hygiene prompt**.
- Using direct `console.*` in `src` instead of the project logger -> **0 logging-standard prompt**.
- Committing real `.env.development` / `.env.production` files -> **0 env-safety prompt**.
- Allowing app boot without fail-fast validation on required env vars -> **0 config-validation prompt**.

# prerequisites
## 0
### text
Completed the EASY cross-module DI challenge and understand standard NestJS module/controller/service flow.
## 1
### text
Know `@nestjs/config`, `registerAs`, and `ConfigService` at practical usage level.
## 2
### text
Understand `winston` concepts (formatters and transports) for JSON log validation.
## 3
### text
Understand `process.env`, dotenv files, and environment-specific runtime behavior.

# steps

## 0
### title
Bootstrap the project and install dependencies
### body
**Steps to follow**
- **Step 1:** Create the project:
  ```bash
  nest new payment-gateway-config-namespaces
  cd payment-gateway-config-namespaces
  ```
- **Step 2:** Install dependencies:
  ```bash
  npm i @nestjs/config joi nest-winston winston
  ```
- **Step 3:** Scaffold module + controller + service for `payment-gateway`:
  ```bash
  nest g module payment-gateway
  nest g controller payment-gateway
  nest g service payment-gateway
  ```
- **Step 4:** Add `.env.development` and `.env.production` to `.gitignore`; create empty `.env.example.development` and `.env.example.production` to commit.

**Minimum acceptance criteria**
- Project folder name is exactly `payment-gateway-config-namespaces`; `npm run start:dev` boots without errors.
- `package.json` lists all 4 dependencies: `@nestjs/config`, `joi`, `nest-winston`, `winston`.
- `PaymentGatewayModule`, `PaymentGatewayController`, `PaymentGatewayService` exist under `src/payment-gateway/`.
- `.gitignore` contains `.env.development` and `.env.production` (must NOT contain `.env.example.*`).

**Nice to have**
- Add `npm run start:prod` forcing `NODE_ENV=production` (use `cross-env` for Windows).
- Declare `engines.node >= 18` in `package.json`.

## 1
### title
Create 3 config namespaces with fail-fast Joi validation
### body
**Steps to follow**
- **Step 1:** Create `src/config/app.config.ts`:
  ```ts
  import { registerAs } from '@nestjs/config';
  export default registerAs('app', () => ({
    name: process.env.APP_NAME,
    port: Number(process.env.APP_PORT),
    nodeEnv: process.env.NODE_ENV,
  }));
  ```
- **Step 2:** Similarly create `src/config/database.config.ts` (`host`, `port`, `user`, `password`, `name`) and `src/config/payment.config.ts` (`provider`, `apiKey`, `timeoutMs`, `webhookSecret`); read the matching `DB_*` and `PAYMENT_*` env variables.
- **Step 3:** Create `src/config/validation.schema.ts` exporting a Joi schema marking every required variable; key examples:
  ```ts
  NODE_ENV: Joi.string().valid('development','production').required(),
  APP_PORT: Joi.number().integer().min(1).required(),
  DB_HOST: Joi.string().required(),
  PAYMENT_API_KEY: Joi.string().min(8).required(),
  ```
- **Step 4:** Inside `AppModule`, import:
  ```ts
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: [`.env.${process.env.NODE_ENV}`],
    load: [appConfig, databaseConfig, paymentConfig],
    validationSchema,
    validationOptions: { abortEarly: true, allowUnknown: false },
  })
  ```
- **Step 5:** Fill in `.env.development` and `.env.production` with all required variables; make sure at least **3 variables differ** between the two files (suggestion: `APP_PORT`, `DB_NAME`, `PAYMENT_PROVIDER`).

**Minimum acceptance criteria**
- The 3 files `src/config/{app,database,payment}.config.ts` exist; each default-exports a `registerAs(...)` call with the correct namespace.
- `ConfigService.get('payment.apiKey')` returns the value from `.env.development` when running with `NODE_ENV=development`.
- Running `NODE_ENV=development npm run start` loads `.env.development`; running `NODE_ENV=production npm run start` loads `.env.production`.
- Remove one required variable from `.env.development` and rerun -> the app **fails to boot**, stderr clearly names the missing variable (Joi message).
- `.env.development` vs `.env.production` differ on **at least 3 variables** (verify by eye or `diff .env.development .env.production`).

**Nice to have**
- Type the config via `namespace.type.ts` + generic `Type<AppConfig>` so that `ConfigService.get<AppConfig>('app')` returns the proper type.
- Add an `APP_VERSION` variable read from `package.json` at boot so it can be logged.
- Swap Joi for `class-validator` (optional alternative) to avoid an extra dependency.

## 2
### title
Wire Winston JSON logger with console + file transports and replace the default logger
### body
**Steps to follow**
- **Step 1:** Create `src/logger/logger.module.ts` with `WinstonModule.forRootAsync`:
  ```ts
  WinstonModule.forRootAsync({
    useFactory: (config: ConfigService) => ({
      level: config.get('app.nodeEnv') === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/app.log' }),
      ],
    }),
    inject: [ConfigService],
  })
  ```
- **Step 2:** Import `LoggerModule` into `AppModule`.
- **Step 3:** In `main.ts`, replace the default logger:
  ```ts
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  ```
- **Step 4:** Inside `PaymentGatewayService`, inject `@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService` and log in `charge(...)`:
  ```ts
  this.logger.log({ message: 'charging', orderId, amount }, PaymentGatewayService.name);
  ```
- **Step 5:** Add `logs/` to `.gitignore`.
- **Step 6:** Sweep the whole repo (`rg "console\\." src` or use IDE Find) and replace every `console.log/error/warn` with the Nest/Winston logger. No `console.*` must remain.

**Minimum acceptance criteria**
- The file `logs/app.log` is created when running `npm run start:dev`; every line is a valid JSON object (parses with `JSON.parse`).
- Every log entry contains `level`, `timestamp` (ISO 8601), `context`, `message`.
- The console also prints JSON (not Nest's default text formatter).
- Searching the whole repo: NO `console.log`, `console.error`, `console.warn`, `console.debug` remain in `src/`.
- Default level is `debug` when `NODE_ENV=development`; `info` when `NODE_ENV=production` (verify by emitting one `debug` line and confirming it is suppressed under production mode).

**Nice to have**
- Add a `File({ filename: 'logs/error.log', level: 'error' })` transport to isolate error logs.
- Rotate log files with `winston-daily-rotate-file` using a `YYYY-MM-DD` pattern.
- Attach default metadata `service: 'payment-gateway'` + `hostname: os.hostname()` to every log via `defaultMeta`.

## 3
### title
Smoke-test 3 scenarios: dev start, missing-env crash, payment charge with JSON log
### body
**Steps to follow**
- **Step 1:** Run the dev happy path:
  ```bash
  NODE_ENV=development npm run start:dev
  ```
  Verify the terminal boots without errors and prints JSON logs.
- **Step 2:** Call `POST /payments/charge` to verify charge flow and JSON logging.
  ```bash
  curl -X POST http://localhost:3000/payments/charge \
    -H "Content-Type: application/json" \
    -d '{"orderId":"ORD-001","amount":120000}'
  ```
  Expected: endpoint returns success with `orderId`, `amount`, `provider`, and `chargedAt`.
- **Step 3:** Open `logs/app.log`, read the latest line you just produced, confirm it is valid JSON with all 4 required fields. Copy one line and paste it into the README.
- **Step 4:** Test the crash-on-missing-env scenario: comment out `PAYMENT_API_KEY=...` in `.env.development`, rerun:
  ```bash
  NODE_ENV=development npm run start
  ```
  Verify the app **exits immediately** (non-zero exit code) with stderr containing `"PAYMENT_API_KEY" is required` (or equivalent Joi message).
- **Step 5:** Restore the commented variable.
- **Step 6:** Test production mode: `NODE_ENV=production npm run start` runs with `.env.production`; the logger level is `info` (no `debug` lines visible).
- **Step 7:** Open `README.md` and, under **Smoke Test**, paste: one JSON log line from the happy path, the full stderr from the crash, one JSON log line from production; with a brief description of each scenario.

**Minimum acceptance criteria**
- Happy path `POST /payments/charge` returns HTTP `201` with a body containing `orderId`, `amount`, `provider`, `chargedAt`.
- `logs/app.log` has a JSON line for that request, with `level="info"`, `timestamp`, `context="PaymentGatewayService"`, and a `message` or log fields.
- Missing-env case: the app exits with **non-zero exit code**, stderr contains a string naming the missing variable; NO request is served.
- Running with `NODE_ENV=production`: `debug` lines do NOT appear (only `info` and above).
- README's **Smoke Test** section pastes 3 real blocks (happy JSON log, full stderr crash, production JSON log).

**Nice to have**
- Add `npm run start:missing-env` that purposely unsets one variable to demo the crash quickly.
- Save the curl command into `docs/smoke-test.sh` for repeatable checks.
- Add a GIF of the terminal running the 3 scenarios sequentially to the README.

# outputs
## 0
### title
Design multi-namespace configuration per environment
### text
You can organize config into `app/database/payment` namespaces and load the correct env profile for each runtime mode.
## 1
### title
Apply fail-fast environment validation
### text
You can prevent unsafe startup by forcing the application to stop immediately when required env variables are missing.
## 2
### title
Implement production-grade structured logging
### text
You can configure Winston JSON logging consistently for console and file while enforcing no `console.*` and no hardcoded secrets.

# references
## 0
### alias
NestJS Configuration
### url
https://docs.nestjs.com/techniques/configuration
## 1
### alias
NestJS Configuration - Custom config files (registerAs)
### url
https://docs.nestjs.com/techniques/configuration#custom-configuration-files
## 2
### alias
NestJS Logger - Winston
### url
https://docs.nestjs.com/techniques/logger#using-a-winston-based-logger
## 3
### alias
Joi schema validation
### url
https://joi.dev/api/?v=17.13.3

# submissions
## 0
### type
githubUrl
### title
GitHub Repository Link
### description
Submit a GitHub repository link containing the full source code. The repo must include a `README.md` with: feature description, dev/prod run instructions, a 3-namespace config table, and a **Smoke Test** section pasting the 3 real scenarios (happy JSON log, crash stderr, production JSON log). Real `.env.development` / `.env.production` must not be committed; commit only `.env.example.development` + `.env.example.production` as templates.
### score
20
### prompts
#### 0
##### title
3 config namespaces load and are readable via ConfigService.get
##### score
6
##### promptText
Grading rubric (max 6):

- Criterion A (2 points): Exactly 3 namespace config files exist in `src/config/`, each implemented with `registerAs(...)`.
- Criterion B (2 points): `AppModule` configures `ConfigModule.forRoot` with all 3 namespaces in `load` and `isGlobal: true`.
- Criterion C (2 points): `ConfigService.get('payment.apiKey')` resolves correctly from the active environment.

Scoring rule: each criterion earns points only when fully met; missing/incorrect criteria earn 0 points.
#### 1
##### title
Env switching by NODE_ENV + fail-fast schema validation
##### score
6
##### promptText
Grading rubric (max 6):

- Criterion A (2 points): `NODE_ENV=development` and `NODE_ENV=production` load the correct env files.
- Criterion B (2 points): The two env files differ on at least 3 variables.
- Criterion C (2 points): Missing a required env variable stops app boot with non-zero exit code and clear stderr.

Scoring rule: each criterion earns points only when fully met; missing/incorrect criteria earn 0 points.
#### 2
##### title
Winston logs JSON with level/timestamp/context to console and file
##### score
4
##### promptText
Grading rubric (max 4):

- Criterion A (2 points): Logs are valid JSON in both console and `logs/app.log` and include `level`, `timestamp`, `context`, `message`.
- Criterion B (1 point): Log level behavior is correct (`debug` in development, `info` in production).
- Criterion C (1 point): Default Nest logger is replaced by Winston via `app.useLogger(...)`.

Scoring rule: each criterion earns points only when fully met; missing/incorrect criteria earn 0 points.
#### 3
##### title
No hardcoded secrets, no console.log
##### score
4
##### promptText
Grading rubric (max 4):

- Criterion A (1.5 points): No `console.log/error/warn/debug` usage remains under `src/`.
- Criterion B (1.5 points): No real secrets are hardcoded in source code.
- Criterion C (1 point): Real `.env.development` and `.env.production` are not committed.

Scoring rule: each criterion earns points only when fully met; missing/incorrect criteria earn 0 points.

# difficulty
easy

# score
20
