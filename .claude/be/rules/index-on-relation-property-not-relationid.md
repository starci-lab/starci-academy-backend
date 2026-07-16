# Rule — Composite `@Index`/`@Unique` dùng RELATION PROPERTY, không dùng `@RelationId` virtual column

**`@Index([...])`/`@Unique([...])` trên entity phải liệt kê tên property quan hệ (`user`, `card`), KHÔNG liệt kê property `@RelationId` (`userId`, `quizCardId`).**

- `@RelationId` là cột ảo (populate sau khi load) — TypeORM metadata builder ném lỗi lúc init: `Index/Unique "..." contains column that is missing in the entity: userId`, làm **toàn bộ `DataSource.initialize()` fail boot**, không riêng gì entity đó.
- Cách sửa: `@Index(["user", "card"])` — TypeORM tự resolve về cột FK thật (`user_id`, `card_id`) qua `@ManyToOne`.
- Single-column index trên `@Column` thật (không phải `@RelationId`) thì giữ nguyên, không bị ảnh hưởng.

> Đã áp: nợ đã fix 2 case boot-breaking 2026-05-29 — `coding-submission.entity.ts` (`@Index(["userId","codingProblemId"])` → sửa) và `user_quiz_card_progress` (`@Unique(["userId","quizCardId"])` → `@Unique(["user","card"])`).
> Nguồn: memory `feedback-index-relation-columns.md` · entity thật `src/modules/databases/postgresql/primary/entities/activity-reaction.entity.ts` (dùng `@RelationId` đúng cách, không đưa vào composite index).

[[relationid-virtual-not-queryable]]
