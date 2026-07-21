# `.claude/be` — StarCi Backend canon (rules + concepts)

> Song sinh với `.claude/fe/` nhưng cho BACKEND (`starci-academy-backend`: NestJS + TypeORM + GraphQL + CQRS + Postgres
> + NATS/Kafka + BullMQ + Elasticsearch + Keycloak + 5 payment gateway + AI/RAG). **Backend KHÔNG có build-skill riêng**
> — methodology dựng đến từ hệ FE (brainstorm→proposal→apply gen sang); backend chỉ cần **CANON để mần đúng chuẩn**:
>
> - **`rules/`** — HARD conventions khi viết code BE (module layout · service flat · naming · params/result · JSDoc ·
>   no-inline-nested-interface · index-on-relation · no-barrel · log-typed-exception · english-comments · CQRS-no-inline-aggregate…). 1 rule = 1 file.
> - **`concepts/`** — KIẾN TRÚC / cách-hệ-chạy (module-layer · feature-layer · CQRS-projection+CDC · GraphQL resolver ·
>   REST · TypeORM entity/relations · envelope-response · abstract-exception · BullMQ background · NATS/Kafka messaging ·
>   Elasticsearch sync · AI balancer/entitlement · payment-gateway+webhook · Keycloak auth · init-v2 seeder · mount-parsing…). 1 concept = 1 file.

## Nguồn distill (grounded — không bịa)
- `../../claude-legacy/pattern/` (17 chương kiến trúc) + `../../claude-legacy/tech-integration/` (22 chương tích hợp) + `../../claude-legacy/cannon/CODE-CANNON.md` (code pattern rút từ source).
- `../../.cursor/rules/starci-academy.mdc` (SSOT coding-conventions) + skill `coding-conventions`.
- Source THẬT: `src/modules/**` (ai, api, bussiness, cqrs, databases, elasticsearch, event, exceptions, projection, socketio, keycloak, kafka, judge0, {nowpayments,payos,paypal,sepay,stripe}, rag, transactional-email…).
- Backend `feedback-*` memories (service-folder, index-relation, jsdoc-strict, no-inline-nested, cqrs-no-inline-aggregate, log-typed-exception, relationid-not-queryable…).

## Quan hệ với `fe/`
- `fe/engineering/` chứa vài rule THUẦN BACKEND (envelope-nullable · opaque-global-id · shared-modules-global · asset-sync · secrets…) — lọt sang lúc dọn fe/. Reconcile: cái nào thuần-BE nên trỏ/dời về `be/`; cross-link, đừng nhân đôi.
- Audit sức khoẻ 2 cây: skill **`/starci-doc-audit`**.

## Dùng
- Viết/sửa code BE → tra `be/concepts/` (kiến trúc phần đụng) + `be/rules/` (convention) TRƯỚC.
- Rule/concept mới tái dùng → ghi thẳng đúng bucket (1 file), giữ ngắn. KHÔNG `drafts/`.
- **`proposals/`** — việc BE lớn quá để build ngay (vd migration nhiều file) → ghi 1 checklist ở đây thay
  vì build vội; session sau đọc lại build tiếp. Mirror tinh thần `fe/proposals/` nhưng nhẹ hơn (chưa cần
  BACKLOG.md riêng — số lượng còn ít).
