# 08 — Email & Notifications

| Tech | Path | Ghi chú |
|------|------|---------|
| **Mailer** | `src/modules/mailer/` | `@nestjs-modules/mailer` + Pug templates. SMTP (Brevo). |
| **Email templates** | `templates/` | File `.pug`. |
| **Send-mail processor** | `src/features/api/processors/send-mail/` | BullMQ consumer. |
| **Email bloom filter** | `src/modules/bussiness/bloom-filters/` + `src/features/synchronizer/processors/sync-email-bloom-filter/` | Dedup email sends. |

## Flow gửi mail

1. Service business gọi `mailer.sendMail({ template, context, to })`.
2. Nếu async → push job vào BullMQ queue, consumer ở `features/api/processors/send-mail/` xử lý.
3. Trước khi gửi, check bloom filter (`bloom-filters/`) để tránh gửi trùng.
4. Pug template render từ `templates/<name>.pug`.

## Thêm template mới

1. Tạo `templates/<name>.pug`.
2. Gọi từ service với `template: '<name>'` và context object.
