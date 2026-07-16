# Concept — Transactional email

> `src/modules/transactional-email/` — lớp mỏng điều phối NỘI DUNG email (touchpoint nào, locale nào, ai nhận), gọi xuống `@modules/mailer` để gửi thật.

- `pick-locale.ts` — chọn locale (vi/en) theo user, dùng chung cho mọi touchpoint (email bilingual — song ngữ, không phải 1 bản dịch cứng).
- `enqueue-learner-email.ts` — enqueue email cho learner (progress, nhắc nhở, digest) qua [[background-jobs-bullmq]] (`send-mail` processor), không gửi đồng bộ trong request path.
- `submission-result-email.ts` — email kết quả chấm submission (challenge/milestone) — trigger sau khi AI/reviewer chấm xong.
- `grant-emails.ts` — email xác nhận khi grant quyền (mua khoá học, nâng tier AI, membership) — thường trigger từ [[payment-gateways-and-webhooks]] sau verify.
- Template thật ở `templates/*.pug` (Pug), gửi qua SMTP Brevo. Trước khi gửi, check bloom filter (`bussiness/bloom-filters/` + `synchronizer/processors/sync-email-bloom-filter/`) để tránh gửi trùng cùng 1 touchpoint.
- Layer này KHÔNG chứa logic SMTP/Pug render (đó là `@modules/mailer`) — chỉ quyết định "gửi gì, cho ai, ngôn ngữ nào".

> Nguồn: `src/modules/transactional-email/`, `src/modules/mailer/`, `templates/`
