# Rule — `@RelationId` là cột ảo, KHÔNG dùng được trong `where`; filter qua relation

**`where: { userId: x }` trên field `@RelationId` ném `EntityPropertyNotFoundError` — phải filter qua relation `where: { user: { id: x } }` (hoặc QueryBuilder raw cột `user_id`).**

- `@RelationId` (vd `EnrollmentEntity.userId`/`.courseId`) chỉ populate SAU khi entity load xong — không phải cột DB thật nên `EntityManager.find({ where: {...} })` không query được trên nó.
- Sửa: `where: { user: { id: userId }, course: { id: courseId } }` — TypeORM auto-join FK thật. Hoặc QueryBuilder dùng thẳng `.where("enrollment.user_id = :id", { id })`.
- **Phân biệt**: property là `@Column` thật (vd `UserContentEntity.userId`) thì `where: { userId }` vẫn OK bình thường — chỉ `@RelationId` mới vỡ. Đọc entity trước khi viết filter.

> Đã áp: sweep 2026-06-17 fix 3 chỗ vỡ vì `where: { userId }` trên `@RelationId` — `my-course-outline.handler`, `contents.handler` (userId+courseId), `pin-course-project.resolver`.
> Nguồn: memory `be-relationid-not-queryable.md`.

[[index-on-relation-property-not-relationid]]
