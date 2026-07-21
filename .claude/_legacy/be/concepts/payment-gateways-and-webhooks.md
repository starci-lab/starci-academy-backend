# Concept — Payment gateways & webhooks (5-gateway)

> 5 module gateway thật: `src/modules/{payos,sepay,stripe,paypal,nowpayments}/` — mỗi cái có webhook controller riêng ở `src/features/api/core/http/<vendor>/` (xem [[rest-controller-pattern]] §webhook).

- **PayOS** (nội địa VN, `@payos/node` v2) — dùng S3 cho snapshot, `payos.providers.ts` cấu hình client.
- **Sepay** (nội địa VN, banking) — `sepay.client.ts`, webhook nested payload cần parse riêng.
- **Stripe / PayPal / NowPayments** (quốc tế + crypto) — mỗi vendor 1 module 3-file wrap SDK riêng, webhook verify signature theo chuẩn vendor (Stripe signing secret, PayPal webhook-id, NowPayments IPN HMAC).
- **Domain tracking** dùng chung: entity `transaction.entity.ts` + domain service `src/modules/bussiness/transactions/` — mọi gateway sau verify đều ghi transaction qua domain service, KHÔNG mỗi vendor tự viết logic ghi nhận riêng. `payment-gateway.entity.ts` (config per-gateway) + `pricing-phase.entity.ts` (giá theo giai đoạn).
- ⚠️ Webhook là **untrusted input** — luôn verify signature TRƯỚC khi update transaction/grant quyền, và đảm bảo idempotency (tránh xử lý trùng khi vendor retry webhook).
- Sau verify → grant/ghi nhận inline (vd grant AI tier) hoặc publish [[cqrs-commands-events]]/enqueue [[background-jobs-bullmq]] khi việc nặng (gửi mail xác nhận, đồng bộ enrollment).

> Nguồn: `src/modules/payos/`, `src/modules/sepay/`, `src/modules/stripe/`, `src/modules/paypal/`, `src/modules/nowpayments/`, `src/features/api/core/http/{payos,sepay,stripe,paypal,nowpayments}/`
