# title
Cấu hình đa môi trường với 3 namespace config và Winston structured logging cho PaymentGateway

# description
Dựng 1 project NestJS cho feature PaymentGateway với production-ready config & logging. Cấu hình được tách thành 3 namespace (app, database, payment), load theo NODEENV từ file .env.development hoặc .env.production, schema validate bằng Joi - thiếu biến bắt buộc thì app crash ngay khi start (fail-fast), không chạy nửa chừng. Logging dùng Winston ghi ra console JSON + file logs/app.log, mọi log có đủ level, timestamp, context.

# requirements
## 0
### purpose
Khởi tạo project NestJS cho PaymentGateway với cấu hình đa môi trường và logging production-ready.
### technicalConstraints
Tên thư mục bắt buộc là `payment-gateway-config-namespaces`; endpoint nghiệp vụ chính là `POST /payments/charge` nhận `{orderId, amount}`.
### proTipsHints
Làm xong skeleton module/controller/service trước khi nối config và logger để dễ debug từng lớp.

## 1
### purpose
Tách cấu hình thành 3 namespace rõ ràng để dễ quản lý theo domain.
### technicalConstraints
Phải có `app.config.ts`, `database.config.ts`, `payment.config.ts` trong `src/config/`, mỗi file dùng `registerAs('<namespace>', () => ({...}))`.
### proTipsHints
Giữ tên key nhất quán với `ConfigService.get('payment.apiKey')` để tránh mismatch runtime.

## 2
### purpose
Đảm bảo env theo môi trường chạy và có template commit-safe.
### technicalConstraints
Phải có `.env.development` và `.env.production`; commit `.env.example.development` + `.env.example.production`; file thật `.env.*` phải nằm trong `.gitignore`; tối thiểu 3 biến khác nhau giữa 2 môi trường.
### proTipsHints
Ưu tiên đổi các biến dễ quan sát như `APP_PORT`, `DB_NAME`, `PAYMENT_PROVIDER`.

## 3
### purpose
Áp fail-fast validation cho toàn bộ biến môi trường bắt buộc.
### technicalConstraints
`ConfigModule.forRoot(...)` phải load đủ 3 namespace và Joi `validationSchema`; thiếu biến bắt buộc thì app dừng ngay (không boot nửa chừng).
### proTipsHints
Giữ `abortEarly: true` để thấy lỗi đầu tiên rõ ràng khi smoke test missing-env.

## 4
### purpose
Chuẩn hóa logging bằng Winston structured JSON.
### technicalConstraints
Logger global qua `nest-winston`, bắt buộc có 2 transport console + `logs/app.log`, format JSON chứa `level`, `timestamp`, `context`, `message`; thay logger mặc định bằng `app.useLogger(...)`.
### proTipsHints
Đặt level theo `NODE_ENV` (`debug` cho dev, `info` cho prod) để verify hành vi môi trường.

## 5
### purpose
Giữ an toàn thông tin và chuẩn hóa cách log trong toàn codebase.
### technicalConstraints
Cấm hardcode secret thật; cấm `console.log/error/warn/debug` trong `src`; cấm commit `.env.development`/`.env.production` thật.
### proTipsHints
Dùng `rg "console\\." src` để quét nhanh trước khi chốt bài.

### forbidden
- Hardcode secret thật vào source code hoặc config mặc định -> **0 prompt security hygiene**.
- Dùng `console.*` trực tiếp trong `src` thay vì logger chuẩn -> **0 prompt logging standard**.
- Commit file `.env.development` / `.env.production` thật -> **0 prompt env safety**.
- Không fail-fast khi thiếu biến bắt buộc -> **0 prompt config validation**.

# prerequisites
## 0
### text
Hoàn thành challenge EASY cross-module DI và nắm cấu trúc module/controller/service cơ bản.
## 1
### text
Biết `@nestjs/config`, `registerAs`, `ConfigService` ở mức đọc cấu hình theo namespace.
## 2
### text
Biết cơ bản `winston` (format, transport) để đọc và kiểm tra log JSON.
## 3
### text
Hiểu `process.env`, dotenv và khác biệt giữa môi trường development/production.

# steps

## 0
### title
Khởi tạo project và cài đặt dependency
### body
**Các bước thực hiện**
- **Bước 1:** Tạo project:
  ```bash
  nest new payment-gateway-config-namespaces
  cd payment-gateway-config-namespaces
  ```
- **Bước 2:** Cài dependency:
  ```bash
  npm i @nestjs/config joi nest-winston winston
  ```
- **Bước 3:** Sinh module + controller + service cho `payment-gateway`:
  ```bash
  nest g module payment-gateway
  nest g controller payment-gateway
  nest g service payment-gateway
  ```
- **Bước 4:** Thêm `.env.development`, `.env.production` vào `.gitignore`; tạo `.env.example.development` và `.env.example.production` trống sẵn để commit.

**Yêu cầu tối thiểu cần đạt**
- Folder project tên đúng `payment-gateway-config-namespaces`; `npm run start:dev` boot không lỗi.
- `package.json` có đủ 4 dependency: `@nestjs/config`, `joi`, `nest-winston`, `winston`.
- `PaymentGatewayModule`, `PaymentGatewayController`, `PaymentGatewayService` tồn tại ở `src/payment-gateway/`.
- `.gitignore` chứa `.env.development` và `.env.production` (không chứa `.env.example.*`).

**Nice to have**
- Thêm script `npm run start:prod` chạy với `NODE_ENV=production` (dùng `cross-env` nếu cần Windows).
- Thêm `engines.node >= 18` trong `package.json`.

## 1
### title
Tạo 3 namespace config và schema validate Joi fail-fast
### body
**Các bước thực hiện**
- **Bước 1:** Tạo `src/config/app.config.ts`:
  ```ts
  import { registerAs } from '@nestjs/config';
  export default registerAs('app', () => ({
    name: process.env.APP_NAME,
    port: Number(process.env.APP_PORT),
    nodeEnv: process.env.NODE_ENV,
  }));
  ```
- **Bước 2:** Tạo tương tự `src/config/database.config.ts` (`host`, `port`, `user`, `password`, `name`) và `src/config/payment.config.ts` (`provider`, `apiKey`, `timeoutMs`, `webhookSecret`); đọc các biến env `DB_*`, `PAYMENT_*` tương ứng.
- **Bước 3:** Tạo `src/config/validation.schema.ts` export Joi schema require đầy đủ biến; mẫu quan trọng:
  ```ts
  NODE_ENV: Joi.string().valid('development','production').required(),
  APP_PORT: Joi.number().integer().min(1).required(),
  DB_HOST: Joi.string().required(),
  PAYMENT_API_KEY: Joi.string().min(8).required(),
  ```
- **Bước 4:** Trong `AppModule`, import:
  ```ts
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: [`.env.${process.env.NODE_ENV}`],
    load: [appConfig, databaseConfig, paymentConfig],
    validationSchema,
    validationOptions: { abortEarly: true, allowUnknown: false },
  })
  ```
- **Bước 5:** Điền `.env.development` và `.env.production` với đầy đủ biến; bắt buộc **≥ 3 biến** khác giá trị giữa 2 file (gợi ý: `APP_PORT`, `DB_NAME`, `PAYMENT_PROVIDER`).

**Yêu cầu tối thiểu cần đạt**
- 3 file `src/config/{app,database,payment}.config.ts` tồn tại; mỗi file export default hàm `registerAs(...)` với namespace đúng tên.
- `ConfigService.get('payment.apiKey')` đọc ra chuỗi từ env (type `string | undefined` trong TS, runtime là `string` khi env đủ).
- Chạy `NODE_ENV=development npm run start` load đúng `.env.development`; chạy `NODE_ENV=production npm run start` load đúng `.env.production`.
- Xoá 1 biến bắt buộc trong `.env.development` rồi chạy lại -> app **không boot được**, stderr in rõ biến nào thiếu (message của Joi).
- `.env.development` vs `.env.production` có **ít nhất 3 biến** khác giá trị (diff bằng mắt hoặc `diff .env.development .env.production`).

**Nice to have**
- Typed config bằng `namespace.type.ts` cộng generic `Type<AppConfig>` cho `ConfigService.get<AppConfig>('app')` trả đúng type.
- Thêm biến `APP_VERSION` đọc từ `package.json` lúc boot để log ra version.
- Dùng `class-validator` thay Joi (optional alternative) nếu muốn tránh thêm dep Joi.

## 2
### title
Cài đặt Winston logger JSON với console + file transport và thay logger mặc định
### body
**Các bước thực hiện**
- **Bước 1:** Tạo `src/logger/logger.module.ts` dùng `WinstonModule.forRootAsync`:
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
- **Bước 2:** Import `LoggerModule` vào `AppModule`.
- **Bước 3:** Trong `main.ts`, thay logger mặc định:
  ```ts
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  ```
- **Bước 4:** Trong `PaymentGatewayService`, inject `@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService` và log trong `charge(...)`:
  ```ts
  this.logger.log({ message: 'charging', orderId, amount }, PaymentGatewayService.name);
  ```
- **Bước 5:** Thêm `logs/` vào `.gitignore`.
- **Bước 6:** Quét toàn repo (`rg "console\\." src` hoặc dùng IDE Find) và thay mọi `console.log/error/warn` bằng logger Nest/Winston. Repo không được còn `console.*`.

**Yêu cầu tối thiểu cần đạt**
- File `logs/app.log` được sinh khi chạy `npm run start:dev`; mỗi dòng là 1 object JSON hợp lệ (parse được bằng `JSON.parse`).
- Mỗi log entry có đủ 4 field `level`, `timestamp` (ISO 8601), `context`, `message`.
- Console cũng log ra JSON (không phải format text mặc định của Nest).
- Tìm kiếm toàn repo: KHÔNG còn `console.log`, `console.error`, `console.warn`, `console.debug` ở bất kỳ file nào trong `src/`.
- Level mặc định khi `NODE_ENV=development` là `debug`; khi `NODE_ENV=production` là `info` (verify bằng cách log 1 dòng `debug` xem có xuất hiện trên production mode không).

**Nice to have**
- Thêm transport `File({ filename: 'logs/error.log', level: 'error' })` để tách error log.
- Rotate file bằng `winston-daily-rotate-file` với pattern `YYYY-MM-DD`.
- Thêm metadata `service: 'payment-gateway'` + `hostname: os.hostname()` vào mọi log qua `defaultMeta`.

## 3
### title
Smoke test 3 kịch bản: dev start, missing-env crash, payment charge log JSON
### body
**Các bước thực hiện**
- **Bước 1:** Chạy happy path dev:
  ```bash
  NODE_ENV=development npm run start:dev
  ```
  Verify terminal boot xong không lỗi, in log JSON.
- **Bước 2:** Gọi `POST /payments/charge` để verify luồng charge và log JSON.
  ```bash
  curl -X POST http://localhost:3000/payments/charge \
    -H "Content-Type: application/json" \
    -d '{"orderId":"ORD-001","amount":120000}'
  ```
  Kỳ vọng: endpoint trả thành công với `orderId`, `amount`, `provider`, `chargedAt`.
- **Bước 3:** Mở `logs/app.log` đọc dòng mới nhất vừa sinh; đảm bảo là JSON hợp lệ với đủ 4 field. Copy 1 dòng paste vào README.
- **Bước 4:** Test crash-on-missing-env: comment dòng `PAYMENT_API_KEY=...` trong `.env.development`, chạy lại:
  ```bash
  NODE_ENV=development npm run start
  ```
  Verify app **thoát ngay** (exit code ≠ 0) với stderr in rõ `"PAYMENT_API_KEY" is required` (hoặc message tương đương từ Joi).
- **Bước 5:** Khôi phục biến env đã comment.
- **Bước 6:** Test prod mode: `NODE_ENV=production npm run start` chạy được với `.env.production`; log ở level `info` (không thấy `debug`).
- **Bước 7:** Vào `README.md` mục **Smoke Test**, paste: 1 dòng log JSON happy path, full stderr của lần crash, 1 dòng log prod mode; kèm mô tả ngắn từng kịch bản.

**Yêu cầu tối thiểu cần đạt**
- Happy path `POST /payments/charge` trả HTTP `201` với body chứa đủ `orderId`, `amount`, `provider`, `chargedAt`.
- `logs/app.log` có dòng JSON ứng với request trên, có đủ `level="info"`, `timestamp`, `context="PaymentGatewayService"`, `message` hoặc trường log.
- Missing-env case: app thoát với **exit code ≠ 0**, stderr có string chứa tên biến bị thiếu; **không** có request nào được serve.
- Chạy với `NODE_ENV=production`: log `debug` **không** xuất hiện (chỉ `info` trở lên).
- README mục **Smoke Test** paste 3 block thật (happy log JSON, full stderr crash, prod log JSON).

**Nice to have**
- Thêm script `npm run start:missing-env` cố tình unset 1 biến rồi chạy để demo crash nhanh.
- Lưu lệnh curl vào `docs/smoke-test.sh` để chạy lại nhanh.
- Thêm GIF terminal chạy 3 kịch bản tuần tự vào README.

# outputs
## 0
### title
Thiết kế được config đa namespace theo môi trường
### text
Bạn tách được config theo `app/database/payment`, load đúng theo `NODE_ENV`, và kiểm soát khác biệt cấu hình giữa development và production.
## 1
### title
Áp dụng fail-fast validation cho env
### text
Bạn đảm bảo app dừng ngay khi thiếu biến bắt buộc thay vì chạy ở trạng thái lỗi tiềm ẩn.
## 2
### title
Thiết lập structured logging production-ready
### text
Bạn cấu hình được Winston JSON log nhất quán ở console và file, đồng thời giữ codebase sạch khỏi `console.*` và hardcoded secret.

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
Link GitHub Repository
### description
Source code đầy đủ với `README.md` gồm: mô tả feature, cách chạy dev/prod, bảng 3 namespace config, mục **Smoke Test** paste 3 kịch bản thật (happy log JSON, crash stderr, prod log JSON). Không commit `.env.development` / `.env.production` thật; commit `.env.example.development` + `.env.example.production` làm template.
### score
20
### prompts
#### 0
##### title
3 namespace config load được và đọc qua ConfigService.get
##### score
6
##### promptText
Rubric chấm điểm (tối đa 6):

- Tiêu chí A (2 điểm): Có đúng 3 file config namespace trong `src/config/` và mỗi file dùng `registerAs(...)` đúng namespace.
- Tiêu chí B (2 điểm): `AppModule` cấu hình `ConfigModule.forRoot` với `load` đủ 3 namespace và `isGlobal: true`.
- Tiêu chí C (2 điểm): `ConfigService.get('payment.apiKey')` đọc đúng giá trị theo env đang chạy.

Quy tắc chấm: đạt đầy đủ tiêu chí nào thì nhận điểm tiêu chí đó; thiếu/sai tiêu chí thì tiêu chí đó nhận 0 điểm.
#### 1
##### title
Env switching theo NODE_ENV + schema validate fail crash ngay lập tức
##### score
6
##### promptText
Rubric chấm điểm (tối đa 6):

- Tiêu chí A (2 điểm): `NODE_ENV=development` và `NODE_ENV=production` load đúng file env tương ứng.
- Tiêu chí B (2 điểm): 2 file env có tối thiểu 3 biến khác nhau.
- Tiêu chí C (2 điểm): Thiếu biến bắt buộc làm app thoát ngay với exit code khác 0 và stderr nêu biến thiếu.

Quy tắc chấm: đạt đầy đủ tiêu chí nào thì nhận điểm tiêu chí đó; thiếu/sai tiêu chí thì tiêu chí đó nhận 0 điểm.
#### 2
##### title
Winston logger ghi JSON có level/timestamp/context vào console và file
##### score
4
##### promptText
Rubric chấm điểm (tối đa 4):

- Tiêu chí A (2 điểm): Log ra JSON hợp lệ ở cả console và `logs/app.log` với đủ `level`, `timestamp`, `context`, `message`.
- Tiêu chí B (1 điểm): Level theo môi trường đúng (`debug` ở development, `info` ở production).
- Tiêu chí C (1 điểm): Logger mặc định của Nest đã thay bằng Winston qua `app.useLogger(...)`.

Quy tắc chấm: đạt đầy đủ tiêu chí nào thì nhận điểm tiêu chí đó; thiếu/sai tiêu chí thì tiêu chí đó nhận 0 điểm.
#### 3
##### title
Không hardcode secret, không console.log
##### score
4
##### promptText
Rubric chấm điểm (tối đa 4):

- Tiêu chí A (1.5 điểm): Không còn `console.log/error/warn/debug` trong `src/`.
- Tiêu chí B (1.5 điểm): Không hardcode secret thật trong code; chỉ dùng placeholder rõ ràng hoặc throw.
- Tiêu chí C (1 điểm): `.env.development` và `.env.production` thật không được commit vào git.

Quy tắc chấm: đạt đầy đủ tiêu chí nào thì nhận điểm tiêu chí đó; thiếu/sai tiêu chí thì tiêu chí đó nhận 0 điểm.

# difficulty
easy

# score
20
