# INDEX — Concepts (kiến trúc backend)

> Bản đồ shelf `be/concepts/`. Mỗi file = 1 khái niệm kiến trúc, chưng cất từ `claude-legacy/pattern/*` + `claude-legacy/tech-integration/*` + `claude-legacy/cannon/CODE-CANNON.md`, đối chiếu lại `src/modules/**` thật. **Trạng thái**: ✓ = có module thật, đã viết đủ · TODO = có nhắc trong brief nhưng KHÔNG tìm thấy module thật tương ứng (không bịa).

## 1. Core arch (module/feature/API pattern)

| Concept | Trạng thái | Module anchor |
|---|---|---|
| [[module-layer-structure]] | ✓ | `src/modules/*` (pattern 3-file) |
| [[feature-layer]] | ✓ | `src/features/api/`, `src/modules/bussiness/` |
| [[graphql-resolver-pattern]] | ✓ | `src/features/api/core/graphql/` |
| [[rest-controller-pattern]] | ✓ | `src/features/api/core/http/` |
| [[envelope-response-shape]] | ✓ | `src/modules/api/apollo/server/graphql-types/` |
| [[abstract-exception-layer]] | ✓ | `src/modules/exceptions/` |

## 2. Data

| Concept | Trạng thái | Module anchor |
|---|---|---|
| [[typeorm-entities-and-relations]] | ✓ | `src/modules/databases/postgresql/primary/` |
| [[elasticsearch-sync]] | ✓ | `src/modules/elasticsearch/`, `src/modules/bussiness/es-sync/` |

## 3. Messaging / Realtime / CQRS

| Concept | Trạng thái | Module anchor |
|---|---|---|
| [[cqrs-commands-events]] | ✓ | `src/modules/cqrs/event-bus/` |
| [[cqrs-projection-and-cdc]] | ✓ | `src/modules/projection/`, `src/modules/bussiness/projections/` |
| [[messaging-nats-kafka]] | ✓ | `src/modules/event/nats/`, `src/modules/kafka/` |
| [[realtime-socketio]] | ✓ | `src/modules/socketio/`, `src/features/socketio/core/` (9 namespace thật) |
| [[background-jobs-bullmq]] | ✓ | `src/features/api/processors/`, `src/features/synchronizer/processors/` |

## 4. Integrations

| Concept | Trạng thái | Module anchor |
|---|---|---|
| [[ai-catalog-balancer-entitlement]] | ✓ | `src/modules/ai/` (balancer/, ping/, constants/) |
| [[rag-langchain]] | ✓ | `src/modules/langchain/`, `src/modules/rag/` |
| [[judge0-coding-execution]] | ✓ | `src/modules/judge0/` |
| [[payment-gateways-and-webhooks]] | ✓ | `src/modules/{payos,sepay,stripe,paypal,nowpayments}/` |
| [[auth-keycloak-session]] | ✓ | `src/modules/keycloak/`, `src/modules/session/`, `src/modules/membership/` |
| [[transactional-email]] | ✓ | `src/modules/transactional-email/`, `src/modules/mailer/` |
| [[media-dash-ffmpeg]] | ✓ | `src/modules/ffmpeg/`, `src/modules/bento4/` |
| [[observability-sentry-winston]] | ✓ | `src/modules/winston/`, `src/modules/sentry/` |

## 5. Content / Init

| Concept | Trạng thái | Module anchor |
|---|---|---|
| [[init-v2-and-seeders]] | ✓ | `src/modules/init/` (data-git/, diff/, scope/, seeders/) |
| [[mount-content-parsing]] | ✓ | `src/modules/init/seeders/shared/{extracts,merge}/` |

## 6. Ops

| Concept | Trạng thái | Module anchor |
|---|---|---|
| [[config-and-env]] | ✓ | `src/modules/env/`, `src/modules/filesystem/` |

## Ghi chú phạm vi

- Tất cả 24 concept trong brief đều có module thật hậu thuẫn — **không có TODO** trong lần chưng cất này.
- Module thật tồn tại nhưng KHÔNG có concept riêng (gộp/nhắc lồng trong file khác, hoặc cố ý để ngoài phạm vi 24 file yêu cầu): `captcha/ csrf/ helmet/ totp/ health/ routing/ client-context/ passport/ cookie/ cors/ throttler/ crypto/ code/ locale/ docs/ common/ native/ cache/ s3/ github/ googleapis/ axios/` — mở source trực tiếp khi cần, hoặc thêm concept mới nếu 1 trong số này trở thành trọng tâm sửa đổi thường xuyên.
- Nguồn chưng cất (long-form, giữ lại để tham chiếu sâu hơn khi 1 concept brief chưa đủ): `claude-legacy/pattern/*.md` (17 chương) · `claude-legacy/tech-integration/*.md` (22 chương) · `claude-legacy/cannon/CODE-CANNON.md`.
- Đối xứng FE: `.claude/fe/{components,engineering,features,foundations,layouts,patterns,principles,product}` — shelf FE không dùng tên `concepts/`, đây là điểm khác nhau về đặt tên thư mục giữa 2 phía (BE dùng `concepts/`, FE dùng nhiều shelf chuyên biệt hơn).
