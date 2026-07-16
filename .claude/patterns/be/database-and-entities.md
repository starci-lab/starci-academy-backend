# BE code-style — Database & Entities (TypeORM)

Phạm vi: cách VIẾT entity + query TypeORM trong backend này (schema qua `synchronize`, không migration). Mọi rule ground 100% từ `src/modules/databases/postgresql/primary` và các handler/resolver thật. Đường dẫn tương đối `src/...`.

---

## 1. Entity kế thừa abstract, KHÔNG tự khai `id`/`createdAt`/`updatedAt`

Mọi entity có UUID kế thừa `UuidAbstractEntity` (đã có `id` uuid + `createdAt`/`updatedAt` timestamptz). Không lặp lại các cột đó.

✅ ĐÚNG — `src/modules/databases/postgresql/primary/entities/enrollment.entity.ts`
```ts
@Entity("enrollments")
export class EnrollmentEntity extends UuidAbstractEntity {
```
`id`/`createdAt`/`updatedAt` nằm sẵn trong `src/.../entities/abstract.ts` (`@PrimaryGeneratedColumn("uuid")`, `@CreateDateColumn`, `@UpdateDateColumn`).

❌ SAI — tự khai lại PK/timestamp trong entity con:
```ts
@PrimaryGeneratedColumn("uuid") id: string   // đã có ở UuidAbstractEntity
@CreateDateColumn() createdAt: Date            // trùng
```

---

## 2. `@Entity` tên bảng số nhiều snake_case; mỗi entity 1 file `*.entity.ts`

Bảng đặt tên số nhiều snake_case; class hậu tố `Entity`; 1 entity / 1 file trong `entities/`.

✅ ĐÚNG — `@Entity("challenges")` → `ChallengeEntity` (`entities/challenge.entity.ts`); `@Entity("activities")` → `ActivityEntity`.

❌ SAI — `@Entity("Challenge")` / số ít / class `Challenge` không hậu tố / gộp 2 entity 1 file.

---

## 3. `@Column` LUÔN khai `name` snake_case + `type` tường minh

Field TS là camelCase; cột DB là snake_case khai qua `name`. `type` luôn ghi rõ (`varchar`+`length`, `int`, `text`, `boolean`, `timestamptz`, `jsonb`, `enum`). `varchar` phải có `length`.

✅ ĐÚNG — `src/.../entities/challenge.entity.ts`
```ts
@Column({
    name: "display_id",
    type: "varchar",
    length: 255,
})
    displayId: string
```

❌ SAI — thiếu `name` (để TypeORM tự suy ra `displayId`), thiếu `type`, hoặc `varchar` không `length`:
```ts
@Column() displayId: string          // cột thành "displayId", lệch snake_case
@Column({ type: "varchar" }) x: string   // thiếu length
```

---

## 4. Cột enum: `type: "enum"` + `enum:` + `enumName:` cố định

Enum PG phải đặt `enumName` (tên type ổn định, snake_case) để `synchronize` không sinh type ngẫu nhiên.

✅ ĐÚNG — `src/.../entities/challenge.entity.ts`
```ts
@Column({
    name: "difficulty",
    type: "enum",
    enum: ChallengeDifficulty,
    enumName: "challenge_difficulty",
})
    difficulty: ChallengeDifficulty
```

❌ SAI — enum không `enumName` (type auto-name, dễ vỡ khi đổi cột):
```ts
@Column({ name: "difficulty", type: "enum", enum: ChallengeDifficulty })
```

---

## 5. Status "hay thêm giá trị mới" → dùng `varchar` union, KHÔNG enum PG

`synchronize=true` chạy ở dev/prod repo này. Thêm value vào 1 enum PG dùng chung ≥2 cột làm crash boot (DROP `_old` fail — xem MEMORY "synchronize enum ADD VALUE trap"). Với status vòng đời hay đổi (session state…), dùng `varchar` + union type TS.

✅ ĐÚNG — `src/.../entities/flashcard-quiz-session.entity.ts`
```ts
@Column({
    name: "status",
    type: "varchar",
    default: "in_progress",
})
    status: "in_progress" | "completed" | "abandoned"
```
Comment giải thích WHY ("avoids the TypeORM `synchronize` `ADD VALUE` footgun") — giữ nguyên khi copy pattern.

❌ SAI — nhét status hay-mở-rộng vào enum PG dùng chung nhiều bảng → boot crash khi thêm value.

---

## 6. Quan hệ FK: `@ManyToOne` + `@JoinColumn` có `name` + `foreignKeyConstraintName`

FK owner side khai `@JoinColumn` với `name` snake_case và `foreignKeyConstraintName` đặt tay theo mẫu `fk_<col>_<table>_<reftable>`. `onDelete` khai tường minh.

✅ ĐÚNG — `src/.../entities/enrollment.entity.ts`
```ts
@ManyToOne(
    () => UserEntity,
    (user: UserEntity) => user.enrollments,
    { onDelete: "CASCADE" },
)
@JoinColumn({
    name: "user_id",
    foreignKeyConstraintName: "fk_user_id_enrollments_users",
})
    user: UserEntity
```

❌ SAI — `@JoinColumn()` trống (tên FK constraint auto random, khó ổn định qua `synchronize`), hoặc thiếu `onDelete`.

---

## 7. Mỗi FK relation kèm 1 `@RelationId` phơi id (không load cả entity để lấy id)

Muốn đọc khoá ngoại mà không join, khai cột ảo `@RelationId`. Đây là idiom bắt buộc đi cùng relation.

✅ ĐÚNG — `src/.../entities/challenge.entity.ts`
```ts
@ManyToOne(() => ContentEntity, (content) => content.challenges, { onDelete: "CASCADE", nullable: false })
@JoinColumn({ name: "content_id", foreignKeyConstraintName: "fk_content_id_challenges_contents" })
    content: ContentEntity

@RelationId((challenge: ChallengeEntity) => challenge.content)
    contentId: string
```

❌ SAI — load `content` chỉ để đọc `content.id`:
```ts
const c = await em.findOne(ChallengeEntity, { where: { id }, relations: { content: true } })
const contentId = c.content.id   // dùng challenge.contentId (RelationId) là đủ
```

---

## 8. `@OneToMany` phía con LUÔN có inverse function; thêm `cascade: true` khi con thuộc-về cha

Collection dùng kiểu `Array<XEntity>` (không `X[]` — repo dùng `Array<>` 140 chỗ, `[]` gần như không). Con "sở hữu bởi" cha (translations/steps/requirements…) đặt `cascade: true` để save cha kéo theo con.

✅ ĐÚNG — `src/.../entities/challenge.entity.ts`
```ts
@OneToMany(
    () => ChallengeTranslationEntity,
    (translation: ChallengeTranslationEntity) => translation.challenge,
    { cascade: true },
)
    translations: Array<ChallengeTranslationEntity>
```

❌ SAI — `translations: ChallengeTranslationEntity[]` (lệch `Array<>`) hoặc `@OneToMany` thiếu inverse.

---

## 9. jsonb: khai `interface` cho shape, đừng để `any`

Cột `type: "jsonb"` gắn kiểu TS tường minh — interface xuất trong file (payload có cấu trúc) hoặc `Array<Record<string, unknown>>` (rubric tự do). Luôn `| null` nếu `nullable: true`.

✅ ĐÚNG — payload có shape, `src/.../entities/activity.entity.ts`
```ts
export interface ActivityMetadata { target?: ActivityTargetRef }

@Column({ name: "payload", type: "jsonb", nullable: true })
    payload: ActivityMetadata | null
```
✅ ĐÚNG — rubric tự do (`src/.../entities/challenge.entity.ts`): `outcomeCriteria: Array<Record<string, unknown>> | null`.

❌ SAI — `payload: any` / `payload: object` (mất type safety, vi phạm no-any).

---

## 10. Field NHẠY CẢM / nội bộ: `@Column` KHÔNG `@Field` → không lộ qua GraphQL

GraphQL expose bằng `@Field`. Cột nội bộ (rubric chấm, token mã hoá) cố tình BỎ `@Field` để không ra client. Ghi comment nêu rõ chủ đích.

✅ ĐÚNG — `src/.../entities/enrollment.entity.ts` (token mã hoá, không `@Field`):
```ts
// **NOT exposed via GraphQL** — the plaintext token must never leave the server.
@Column({ name: "personal_project_github_token_encrypted", type: "text", nullable: true })
    personalProjectGithubTokenEncrypted: string | null
```
✅ `challenge.entity.ts`: `outcomeCriteria` / `approachCriteria` — "deliberately NOT a `@Field`".

❌ SAI — thêm `@Field()` cho token/rubric nội bộ → rò rỉ ra API.

---

## 11. Truy vấn qua `EntityManager` inject, KHÔNG `@InjectRepository` từng entity

Handler/resolver/service inject 1 `EntityManager` primary bằng `@InjectPrimaryPostgreSQLEntityManager()` rồi gọi `em.find(Entity, …)`. Repo này không rải `@InjectRepository(XEntity)`.

✅ ĐÚNG — `src/features/api/core/graphql/queries/system/platform-stats/platform-stats.handler.ts`
```ts
constructor(
    @InjectPrimaryPostgreSQLEntityManager()
    private readonly entityManager: EntityManager,
) { super() }
...
await this.entityManager.count(ContentEntity)
```

❌ SAI — `@InjectRepository(ContentEntity) private repo: Repository<ContentEntity>` (không phải idiom repo này).

---

## 12. Load quan hệ bằng object `relations: { … }` lồng nhau (không mảng chuỗi)

`findOne`/`find` khai `relations` dạng object lồng (typed) để nạp nested; điều kiện lọc qua relation dùng object `where`.

✅ ĐÚNG — `src/.../mutations/contents/mark-as-readed/mark-as-readed.handler.ts`
```ts
await this.entityManager.findOne(ContentEntity, {
    where: { id: contentId },
    relations: { module: { course: true } },
})
```

❌ SAI — `relations: ["module", "module.course"]` (mảng chuỗi, lệch idiom hiện hành object-form).

---

## 13. Tránh N+1: gom id → 1 query `In(...)` → `Map`, KHÔNG query trong vòng lặp

Cần dữ liệu phụ cho từng row của 1 trang → gom hết id, truy vấn 1 lần với `In(ids)`, index bằng `Map`. `In` import từ `typeorm`.

✅ ĐÚNG — `src/.../queries/courses/courses/courses.resolver.ts`
```ts
const courseIds = response.data.map((course) => course.id)
const enrollments = courseIds.length > 0
    ? await this.entityManager.find(EnrollmentEntity, {
        where: { user: { id: user.id }, course: { id: In(courseIds) } },
    })
    : []
const isEnrolledByCourseId = new Map(
    enrollments.map((e) => [e.courseId, e.isEnrolled]),
)
response.data.forEach((course) => {
    course.isEnrolled = isEnrolledByCourseId.get(course.id) ?? false
})
```
Lưu ý: guard `courseIds.length > 0` trước khi bắn `In([])`.

❌ SAI — N+1, mỗi row 1 query:
```ts
for (const course of response.data) {
    course.isEnrolled = !!(await em.findOne(EnrollmentEntity, { where: { course: { id: course.id }, user: { id: user.id } } }))
}
```

---

## 14. Ghi nhiều-bảng-liên-đới trong 1 `entityManager.transaction`, truyền `entityManager` con xuống helper

Chuỗi write phải atomic (tạo/cập nhật + XP + activity + recompute projection) bọc trong `em.transaction(async (entityManager) => …)`; helper nhận `entityManager` của tx, không dùng lại `this.entityManager` ngoài.

✅ ĐÚNG — `src/.../mutations/contents/mark-as-readed/mark-as-readed.handler.ts`
```ts
await this.entityManager.transaction(async (entityManager) => {
    const saved = await entityManager.save(UserContentEntity, userContent)
    await writeXpHistory({ entityManager, userId: user.id, ... })
    await writeActivity({ entityManager, ... })
    await this.progressProjectionService.recompute({ userId: user.id, courseId, entityManager })
})
```
`EntityManager` khi chỉ dùng làm type nên `import type { EntityManager } from "typeorm"`.

❌ SAI — gọi từng `this.entityManager.save(...)` rời rạc không transaction → nửa-chừng-lỗi để lại state rác; hoặc trong tx lại gọi `this.entityManager` (ngoài tx) làm mất tính atomic.

---

## 15. Aggregate/COUNT nặng → `createQueryBuilder` + `getRawOne`, chạy song song `Promise.all`

Đếm/aggregate không cần hydrate entity thì dùng query builder raw; nhiều thống kê độc lập gom `Promise.all`. Kiểu raw row khai qua interface (`types.ts`), ép `Number(row?.count ?? 0)`.

✅ ĐÚNG — `src/.../queries/system/platform-stats/platform-stats.handler.ts`
```ts
const [learnersRow, totalLessons, totalCourses] = await Promise.all([
    this.entityManager
        .createQueryBuilder(EnrollmentEntity, "enrollment")
        .select("COUNT(DISTINCT enrollment.user_id)", "count")
        .getRawOne<DistinctLearnersRow>(),
    this.entityManager.count(ContentEntity),
    this.entityManager.count(CourseEntity),
])
return { totalLearners: Number(learnersRow?.count ?? 0), totalLessons, totalCourses }
```

❌ SAI — `find()` toàn bảng rồi `.length`/reduce trong JS để đếm; hoặc `getRawOne()` không khai kiểu row (raw luôn `string`, quên `Number(...)`).

---

## 16. Ràng buộc unique / index đặt ở class-level decorator, tên constraint tường minh

Idempotency / uniqueness khai `@Unique("UQ_...", [...])` hoặc `@Unique([...])`; index đọc-nhiều khai `@Index([...])`. Tên đặt tay để ổn định qua `synchronize`.

✅ ĐÚNG — `src/.../entities/enrollment.entity.ts`: `@Unique("UQ_enrollments_user_course", ["user", "course"])`.
✅ `src/.../entities/activity.entity.ts`: `@Unique(["type", "idempotencyKey"])` + `@Index(["user"])`.

❌ SAI — enforce uniqueness bằng cách `findOne` kiểm tra trước khi insert (race condition) thay vì ràng buộc DB.

---

## 17. Enum GraphQL: khai `enum` TS + `createEnumType` + `registerEnumType`, mỗi enum 1 file

Enum sống ở `enums/<kebab>.ts`: khai `enum` (value camelCase string), export `GraphQLType<Name> = createEnumType(...)`, rồi `registerEnumType` có `valuesMap` mô tả. Entity import enum + `GraphQLType<Name>` để dùng cho cột và `@Field`.

✅ ĐÚNG — `src/.../enums/activity-type.ts`
```ts
export enum ActivityType { LessonRead = "lessonRead", ... }
export const GraphQLTypeActivityType = createEnumType(ActivityType)
registerEnumType(GraphQLTypeActivityType, { name: "ActivityType", description: "...", valuesMap: { ... } })
```

❌ SAI — khai union string cột enum-GraphQL mà không `registerEnumType` (GraphQL không nhận), hoặc nhét nhiều enum vào 1 file lộn xộn.

---

## Idiom rút ra (để verify không bịa)

1. **`@RelationId` đi kèm mọi FK relation** — đọc `contentId`/`userId`/`courseId` không cần join; xác nhận thật ở `challenge.entity.ts` (`contentId`) và `enrollment.entity.ts` (`userId`,`courseId`).
2. **Chống N+1 = gom id + `In(...)` + `Map`** — mẫu sống ở `courses.resolver.ts` (comment ngay trong code: "looked up in ONE batched query … never N+1 per row"), có guard `courseIds.length > 0`.
3. **Status vòng đời = `varchar` union, KHÔNG enum PG** — để né `synchronize` `ADD VALUE` footgun; thật ở `flashcard-quiz-session.entity.ts` `status: "in_progress" | "completed" | "abandoned"`, đồng bộ với MockInterviewSession.
