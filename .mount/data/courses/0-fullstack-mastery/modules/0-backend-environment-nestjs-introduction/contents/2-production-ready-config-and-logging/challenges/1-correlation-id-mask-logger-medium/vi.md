# title
Correlation-id propagation và Winston formatter mask sensitive field cho PaymentGateway

# description
Nâng cấp app PaymentGateway ở challenge EASY thành một dịch vụ production-ready với 2 tính năng logging bắt buộc cho môi trường thật: (1) correlation-id propagation - mọi log trong cùng 1 request đều mang chung requestId, hỗ trợ cả trường hợp client đã gửi sẵn header x-request-id lẫn trường hợp server tự sinh; (2) formatter Winston chuyên dụng mask field nhạy cảm (password, cardNumber, cvv, webhookSecret) thành trước khi ghi - không dùng thủ thuật JSON.stringify(...).replace(...). Propagate requestId phải hoạt động xuyên qua các async boundary (Promise, setTimeout) bằng AsyncLocalStorage.

# requirements
## 0
### purpose
Nâng cấp project EASY thành service logging production-ready với correlation-id propagation và masking dữ liệu nhạy cảm.
### technicalConstraints
Codebase mới `correlation-id-mask-logger` phải giữ nguyên nền EASY: 3 namespace config, Winston console/file, fail-fast validation.
### proTipsHints
Fork từ bản EASY ổn định để chỉ tập trung thêm correlation + formatter.

## 1
### purpose
Propagate `requestId` xuyên suốt vòng đời request bằng AsyncLocalStorage.
### technicalConstraints
Middleware global đọc `x-request-id`; nếu là UUID v4 hợp lệ thì reuse, ngược lại sinh `crypto.randomUUID()`; luôn set response header `x-request-id`; lưu vào `AsyncLocalStorage`.
### proTipsHints
Kiểm tra 3 case: thiếu header, header hợp lệ, header sai format.

## 2
### purpose
Gắn `requestId` tự động vào log mà không phụ thuộc code gọi log.
### technicalConstraints
Tạo formatter `requestId` đọc từ `AsyncLocalStorage` và set `info.requestId` khi có context; log ngoài request không được crash.
### proTipsHints
Đặt formatter này trong `format.combine(...)` trước bước `json()`.

## 3
### purpose
Mask dữ liệu nhạy cảm tập trung tại logger layer.
### technicalConstraints
Formatter mask phải duyệt đệ quy object, key nhạy cảm `password/cardNumber/cvv/webhookSecret` (không phân biệt hoa thường) đổi thành `'***'`, chạy trước `winston.format.json()`.
### proTipsHints
Viết hàm recursive thuần object/array để dễ kiểm tra thủ công qua log và tái sử dụng.

## 4
### purpose
Chứng minh masking và propagation hoạt động bằng endpoint thực tế.
### technicalConstraints
`POST /payments/charge` nhận body chứa `password` + `card.number` + `card.cvv`, service log raw body để verify mask; `GET /payments/health` log trước/sau async boundary.
### proTipsHints
Dùng `await setTimeout` ngắn trong health endpoint để kiểm tra context propagation qua async boundary.

## 5
### purpose
Đảm bảo chất lượng triển khai masking bằng kiểm chứng runtime.
### technicalConstraints
Phải kiểm chứng được 4 tình huống masking chính: sensitive ở root, sensitive lồng nhau, field không nhạy cảm giữ nguyên, key khác hoa-thường vẫn bị mask.
### proTipsHints
Chuẩn bị sẵn 4 payload mẫu để chạy nhanh bằng curl và đối chiếu trực tiếp trong `logs/app.log`.

## 6
### purpose
Ngăn workaround sai kiến trúc và các anti-pattern bảo mật.
### technicalConstraints
Cấm `JSON.stringify(...).replace(...)` để mask; cấm global variable/singleton hack cho `requestId`; cấm hardcode secret.
### proTipsHints
Review theo checklist anti-pattern trước khi nộp để tránh mất toàn bộ điểm prompt masking.

### forbidden
- Dùng `JSON.stringify(...).replace(...)` để mask dữ liệu nhạy cảm -> **0 prompt masking**.
- Lưu `requestId` bằng global variable/singleton hack thay vì `AsyncLocalStorage` -> **0 prompt correlation propagation**.
- Hardcode secret thật trong code/log sample -> **0 prompt security hygiene**.
- Mất `requestId` khi qua async boundary -> **0 prompt async context**.

# prerequisites
## 0
### text
Đã hoàn thành challenge EASY `0-payment-gateway-config-namespaces-easy`.
## 1
### text
Hiểu middleware trong NestJS và vị trí middleware trong vòng đời request.
## 2
### text
Biết cơ bản `AsyncLocalStorage` (`node:async_hooks`) và ý nghĩa context propagation.
## 3
### text
Biết cách viết `winston.format` custom để can thiệp log trước khi serialize JSON.

# steps

## 0
### title
Fork/copy project EASY và cài thêm dependency
### body
**Các bước thực hiện**
- **Bước 1:** Copy/clone project EASY sang thư mục mới `correlation-id-mask-logger` (giữ nguyên 3 namespace config + Winston + fail-fast).
- **Bước 2:** Cài thêm dependency nếu chưa có:
  ```bash
  npm i uuid
  npm i -D @types/uuid
  ```
- **Bước 3:** Tạo folder mới `src/correlation/` và `src/logger/formatters/`.

**Yêu cầu tối thiểu cần đạt**
- Project mới tên `correlation-id-mask-logger`, boot được bằng `npm run start:dev`.
- Giữ nguyên 3 namespace config + Joi validation + Winston console/file từ EASY (không downgrade).
- Folder `src/correlation/` và `src/logger/formatters/` tồn tại.

**Nice to have**
- Thêm script `npm run lint` + `eslint` rule cấm import direct `winston.transports.Console` ngoài `logger.module.ts`.

## 1
### title
Tạo AsyncLocalStorage store và CorrelationIdMiddleware
### body
**Các bước thực hiện**
- **Bước 1:** Tạo `src/correlation/correlation.storage.ts`:
  ```ts
  import { AsyncLocalStorage } from 'node:async_hooks';
  export interface CorrelationStore { requestId: string }
  export const correlationStorage = new AsyncLocalStorage<CorrelationStore>();
  ```
- **Bước 2:** Tạo `src/correlation/correlation-id.middleware.ts`:
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
- **Bước 3:** Trong `AppModule` implement `configure(consumer: MiddlewareConsumer)` để apply `CorrelationIdMiddleware` cho `forRoutes('*')`.
- **Bước 4:** Tạo custom param decorator `@RequestId()` tiện dụng ở `src/correlation/request-id.decorator.ts` đọc từ `correlationStorage.getStore()?.requestId`.

**Yêu cầu tối thiểu cần đạt**
- Gửi request KHÔNG có header `x-request-id` -> response có header `x-request-id` là UUID v4 hợp lệ (match regex UUID v4).
- Gửi request CÓ header `x-request-id: 11111111-1111-4111-8111-111111111111` -> response trả về đúng giá trị đó (tái sử dụng).
- Gửi request CÓ header `x-request-id: not-a-uuid` -> server **không** tái sử dụng, trả UUID v4 mới.
- `correlationStorage` là **1 instance duy nhất** export từ module (không new mỗi request).

**Nice to have**
- Config regex accept luôn UUID v7 nếu muốn thử nghiệm id có thể sort theo thời gian.
- Thêm option cho phép custom tên header qua `.env` (`REQUEST_ID_HEADER`).

## 2
### title
Viết 2 Winston formatter: inject requestId + mask sensitive
### body
**Các bước thực hiện**
- **Bước 1:** Tạo `src/logger/formatters/request-id.formatter.ts`:
  ```ts
  import { format } from 'winston';
  import { correlationStorage } from '../../correlation/correlation.storage';
  export const requestIdFormat = format((info) => {
    const store = correlationStorage.getStore();
    if (store?.requestId) info.requestId = store.requestId;
    return info;
  });
  ```
- **Bước 2:** Tạo `src/logger/formatters/mask.formatter.ts` với hàm đệ quy:
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
- **Bước 3:** Trong `logger.module.ts`, cập nhật `format`:
  ```ts
  format: winston.format.combine(
    requestIdFormat(),
    maskFormat(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  )
  ```
- **Bước 4:** `PaymentGatewayService.charge(body)` log `this.logger.log({ message: 'charging', body }, PaymentGatewayService.name)` - log trực tiếp body raw để test masker.
- **Bước 5:** Chuẩn bị 4 payload kiểm chứng masking và chạy qua endpoint để đối chiếu log:
  - `{password: 'abc'}` -> `password` phải thành `'***'`
  - `{card: {number: '4111...', cvv: '123'}}` -> `card.number` và `card.cvv` phải thành `'***'`
  - `{username: 'alice', age: 30}` -> giữ nguyên vì không nhạy cảm
  - `{Password: 'x', CARDNUMBER: 'y'}` -> vẫn bị mask (không phân biệt hoa thường)

**Yêu cầu tối thiểu cần đạt**
- File `src/logger/formatters/mask.formatter.ts` tồn tại và là `winston.format((info) => ...)`; KHÔNG dùng `JSON.stringify(...).replace(...)`.
- Có bằng chứng log cho đủ 4 nhóm tình huống masking bắt buộc.
- Gọi `POST /payments/charge` với body chứa `password` + `card.cvv` + `card.number` -> trong `logs/app.log` các field đó là `"***"`, field `amount` và `orderId` KHÔNG bị mask.
- Mọi log phát sinh trong vòng đời 1 request có trường `requestId` bằng giá trị response header `x-request-id`.
- Log phát sinh NGOÀI request context (ví dụ log ở `main.ts` lúc bootstrap) không bị crash và không có field `requestId` (hoặc `requestId: undefined` bị loại bởi `json()`).

**Nice to have**
- Thêm option cho phép config list sensitive field qua `.env` (`LOG_SENSITIVE_KEYS=password,cvv,...`).
- Thêm formatter `redactLong` cắt string > 1000 ký tự thành `...(truncated)` để tránh log bloat.
- Viết script bash gọi song song 2 request để chứng minh `requestId` không bị cross-contaminate.

## 3
### title
Smoke test 4 kịch bản bằng curl (auto-generate id / tái sử dụng id / mask nested / health propagation)
### body
**Các bước thực hiện**
- **Bước 1:** Chạy `npm run start:dev`, mở 1 terminal khác để `tail -f logs/app.log`.
- **Bước 2:** Gọi `POST /payments/charge` không gửi `x-request-id` để verify auto-generate id và mask field nhạy cảm.
  ```bash
  curl -X POST http://localhost:3000/payments/charge \
    -H "Content-Type: application/json" \
    -d '{"orderId":"ORD-010","amount":250000,"password":"s3cret!","card":{"number":"4111111111111111","cvv":"123"}}' -i
  ```
  Kỳ vọng: response header có `x-request-id` dạng UUID v4; log của request này mask `password/card.number/card.cvv`.
- **Bước 3:** Gọi `POST /payments/charge` với `x-request-id` hợp lệ để verify cơ chế reuse id.
  ```bash
  curl -X POST http://localhost:3000/payments/charge \
    -H "x-request-id: 11111111-1111-4111-8111-111111111111" \
    -H "Content-Type: application/json" \
    -d '{"orderId":"ORD-011","amount":99000,"password":"p@ss","card":{"number":"5555444433332222","cvv":"999"}}' -i
  ```
  Kỳ vọng: response giữ nguyên `x-request-id: 11111111-1111-4111-8111-111111111111` và log dùng cùng requestId.
- **Bước 4:** Gọi `POST /payments/charge` với `x-request-id` sai format để verify server generate id mới.
  ```bash
  curl -X POST http://localhost:3000/payments/charge \
    -H "x-request-id: haha-not-a-uuid" \
    -H "Content-Type: application/json" \
    -d '{"orderId":"ORD-012","amount":1000,"password":"a","card":{"number":"0","cvv":"0"}}' -i
  ```
  Kỳ vọng: response header trả UUID mới khác `haha-not-a-uuid`; log request dùng UUID mới này.
- **Bước 5:** Gọi `GET /payments/health` với request id cố định để verify propagation qua async boundary.
  ```bash
  curl http://localhost:3000/payments/health \
    -H "x-request-id: 22222222-2222-4222-8222-222222222222" -i
  ```
  Kỳ vọng: endpoint log `requestId` ở cả trước và sau `await setTimeout(50ms)` với cùng giá trị `22222222-2222-4222-8222-222222222222`.
- **Bước 6:** Trong `README.md` mục **Smoke Test**, paste 4 block log JSON tương ứng 4 request trên. Highlight bằng bold: (a) response header `x-request-id`, (b) field `password` / `card.cvv` / `card.number` đã mask, (c) 2 dòng log health có cùng `requestId`.

**Yêu cầu tối thiểu cần đạt**
- Request không có `x-request-id` -> response header `x-request-id` là UUID v4 hợp lệ; cùng giá trị xuất hiện trong **mọi** dòng log của request đó.
- Request có `x-request-id: 11111111-1111-4111-8111-111111111111` -> response header trả đúng id đó; dòng log chứa `"requestId":"11111111-1111-4111-8111-111111111111"`.
- Request có `x-request-id: haha-not-a-uuid` -> response header là UUID v4 **khác** giá trị client gửi; log dùng UUID mới.
- Trong `logs/app.log` của request `ORD-010`: field `password` = `"***"`, `card.cvv` = `"***"`, `card.number` = `"***"`; field `orderId` và `amount` GIỮ NGUYÊN giá trị raw.
- Health endpoint: 2 dòng log (trước/sau `await setTimeout 50ms`) có cùng `requestId=22222222-2222-4222-8222-222222222222`, chứng minh AsyncLocalStorage propagate qua async boundary.

**Nice to have**
- Chạy 5 request song song (`&` trong bash) với `x-request-id` khác nhau và verify trong log KHÔNG có cross-contamination: mỗi `requestId` chỉ xuất hiện trong dòng log tương ứng request đó.
- Thêm 1 endpoint `POST /payments/slow` cố tình `await setTimeout(200)` 3 lần rồi log, verify vẫn cùng `requestId`.
- Lưu 4 lệnh curl vào script `docs/smoke-test.sh` để chạy lặp lại nhanh.

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
OpenTelemetry - Context propagation (tham khảo design)
### url
https://opentelemetry.io/docs/concepts/context/

# submissions
## 0
### type
githubUrl
### title
Link GitHub Repository
### description
Repository chứa source code đầy đủ: middleware correlation-id, 2 Winston formatter (`requestId` + `mask`), README với mục **Smoke Test** paste 4 block log JSON thật từ 4 kịch bản và mục **Design** giải thích vì sao dùng `AsyncLocalStorage` thay vì global. Commit `.env.example.*`, KHÔNG commit `.env.development` / `.env.production` thật.
### score
30
### prompts
#### 0
##### title
CorrelationIdMiddleware tái sử dụng / sinh mới / reject id sai format đúng quy tắc
##### score
8
##### promptText
Rubric chấm điểm (tối đa 8):

- Tiêu chí A (3 điểm): Middleware xử lý đúng 3 nhánh id (reuse hợp lệ, regenerate khi sai format, generate khi thiếu).
- Tiêu chí B (2 điểm): Response luôn có header `x-request-id`.
- Tiêu chí C (3 điểm): README có bằng chứng smoke test thật cho đủ 3 tình huống id.

Quy tắc chấm: đạt đủ tiêu chí nào thì nhận điểm tiêu chí đó; không đạt tiêu chí thì 0 điểm.
#### 1
##### title
AsyncLocalStorage propagate requestId vào mọi log trong request, kể cả sau await
##### score
6
##### promptText
Rubric chấm điểm (tối đa 6):

- Tiêu chí A (2 điểm): `correlationStorage` là một instance `AsyncLocalStorage` duy nhất và được set bằng `.run(...)` trong middleware.
- Tiêu chí B (2 điểm): Log trong cùng request (kể cả sau `await`) giữ cùng `requestId` với response header.
- Tiêu chí C (2 điểm): Không dùng workaround sai kiến trúc như global variable hoặc truyền `requestId` qua tham số service.

Quy tắc chấm: đạt đủ tiêu chí nào thì nhận điểm tiêu chí đó; không đạt tiêu chí thì 0 điểm.
#### 2
##### title
Winston mask formatter đệ quy, không dùng JSON.stringify hack
##### score
8
##### promptText
Rubric chấm điểm (tối đa 8):

- Tiêu chí A (3 điểm): `mask.formatter.ts` mask đệ quy đúng các key nhạy cảm (case-insensitive) và không dùng stringify-replace hack.
- Tiêu chí B (2 điểm): Có bằng chứng runtime cho đủ 4 nhóm tình huống masking bắt buộc.
- Tiêu chí C (3 điểm): Log thực tế của `ORD-010` mask đúng `password/card.number/card.cvv` nhưng giữ nguyên `orderId/amount`.

Quy tắc chấm: đạt đủ tiêu chí nào thì nhận điểm tiêu chí đó; không đạt tiêu chí thì 0 điểm.
#### 3
##### title
4 smoke scenario được document và pass đúng thứ tự trong README
##### score
8
##### promptText
Rubric chấm điểm (tối đa 8):

- Tiêu chí A (3 điểm): README có đủ 4 block log JSON thật tương ứng 4 scenario.
- Tiêu chí B (3 điểm): Mỗi block thể hiện rõ `requestId` và các field nhạy cảm đã mask.
- Tiêu chí C (2 điểm): Không dùng placeholder, log khớp hành vi mô tả từng scenario.

Quy tắc chấm: đạt đủ tiêu chí nào thì nhận điểm tiêu chí đó; không đạt tiêu chí thì 0 điểm.
## 1
### type
googleDocsUrl
### title
Design Note - vì sao AsyncLocalStorage + custom formatter thay vì middleware gắn requestId thủ công
### description
Link Google Docs (share `Anyone with link: Viewer`) tối thiểu 400 từ giải thích: (a) vì sao cần correlation-id ở prod; (b) so sánh `AsyncLocalStorage` vs request-scoped provider vs truyền qua tham số - trade-off về perf, maintainability, đi xuyên async boundary; (c) vì sao mask **phải** ở logger formatter layer thay vì ở controller/service (defense-in-depth). Kèm 1 sơ đồ Mermaid sequence: client -> middleware -> service -> logger formatter -> file.
### score
10
### prompts
#### 0
##### title
Giải thích đủ 3 ý a/b/c và có sơ đồ Mermaid
##### score
10
##### promptText
Rubric chấm điểm (tối đa 10):

- Tiêu chí A (3 điểm): Docs >= 400 từ và giải thích động cơ correlation-id trong hệ phân tán.
- Tiêu chí B (4 điểm): So sánh AsyncLocalStorage với alternative có trade-off kỹ thuật cụ thể.
- Tiêu chí C (3 điểm): Giải thích rõ vì sao mask đặt ở formatter layer và có sơ đồ Mermaid đúng flow.

Quy tắc chấm: đạt đủ tiêu chí nào thì nhận điểm tiêu chí đó; không đạt tiêu chí thì 0 điểm.

# outputs
## 0
### title
Triển khai correlation-id propagation đúng chuẩn production
### text
Bạn thiết kế được luồng requestId nhất quán từ header vào log, bao gồm cả trường hợp async boundary và request song song.
## 1
### title
Xây cơ chế mask dữ liệu nhạy cảm tập trung ở logger layer
### text
Bạn triển khai được formatter mask đệ quy và tự kiểm chứng bằng log thực tế, giảm rủi ro lộ secret do developer log raw payload.
## 2
### title
Đánh giá được thiết kế observability qua bằng chứng runtime
### text
Bạn dùng smoke test và log thực tế để chứng minh hành vi reuse/reject/generate requestId và hiệu quả masking theo từng kịch bản.

# difficulty
medium

# score
40
