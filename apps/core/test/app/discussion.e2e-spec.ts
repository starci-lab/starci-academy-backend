import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    ActivityEntity,
    ActivityReactionEntity,
    ActivityType,
    CommentReactionEntity,
    ContentCommentEntity,
    ContentEntity,
    ContentReactionEntity,
    CourseEntity,
    EnrollmentEntity,
    Locale,
    ModuleEntity,
    PrimaryPostgreSQLModule,
    ReactionType,
    UserEntity,
} from "@modules/databases"
import {
    ActivityNotFoundException,
    ActivitySelfReactionException,
    CommentForbiddenException,
    CommentInvalidScopeException,
    CommentNotFoundException,
} from "@modules/exceptions"
import {
    CacheService,
} from "@modules/cache"
import {
    EventEmitterService,
} from "@modules/event"
import {
    CommentService,
    ContentEngagementProjectionService,
    ReactionService,
    UserService,
} from "@modules/bussiness"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the lesson-content discussion UGC write-flows —
 * `.claude/canon/be/enforce/authoring/testing.md` §2 names "a community post or
 * reaction" (the sibling domain to community) explicitly as a write flow that must
 * carry `*.e2e-spec.ts` coverage. Exercises {@link CommentService} and
 * {@link ReactionService} against REAL Postgres (Testcontainers) — not the
 * mocked-`EntityManager` unit level already covered by each service's own `.spec.ts`.
 *
 * In focus: the OWNERSHIP guard on comment update+delete (the IDOR class — a
 * non-author must never mutate someone else's comment), the content/course XOR scope
 * guard, the activity self-reaction guard, and soft-delete landing on the real
 * `is_deleted` column rather than removing the row.
 *
 * MOCKED (no external infra available in this harness, genuinely external to the
 * discussion domain under test):
 *  - `EventEmitterService` — real class fans out to EventEmitter2 + NATS; stubbed so
 *    a mutation's room-broadcast side effect never touches either.
 *  - `CacheService` — real class talks to Redis; stubbed to always miss so
 *    `UserService.resolveOrCreateTrialEnrollment` (react-to-content's enrollment
 *    anchor) hits real Postgres every time, never a stale cross-test cache entry
 *    (mirrors `flashcard-review.e2e-spec.ts`'s own mock of this same service).
 *
 * REAL: Postgres (Testcontainers), `CommentService` + `ReactionService` (the logic
 * under test), `ContentEngagementProjectionService` (only an `EntityManager`
 * dependency — the react-to-content aggregate projection runs for real), and
 * `UserService` (`resolveOrCreateTrialEnrollment` runs real SQL against real
 * `enrollments` rows).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Discussion UGC — comments + reactions (content/comment/activity) (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let commentService: CommentService
        let reactionService: ReactionService

        /** Read-only fixtures seeded ONCE — only per-test user/comment/reaction state is reset. */
        let course: CourseEntity
        let content: ContentEntity

        // CacheService always misses → UserService.resolveOrCreateTrialEnrollment hits
        // real Postgres every time (no stale cross-test cache to reason about).
        const cacheServiceMock = {
            get: jest.fn().mockResolvedValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        }
        const eventEmitterServiceMock = {
            emit: jest.fn().mockResolvedValue(undefined),
        }

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    // real Postgres against the Testcontainers DB — no hydration/
                    // resolvers/seeders, this focused app doesn't need them
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // REAL — the comment/reaction logic under test
                    CommentService,
                    ReactionService,
                    // REAL — only an EntityManager dependency, the projection runs for real
                    ContentEngagementProjectionService,
                    // REAL — resolveOrCreateTrialEnrollment runs real SQL against real rows
                    UserService,
                    {
                        provide: CacheService,
                        useValue: cacheServiceMock,
                    },
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterServiceMock,
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            commentService = app.get(CommentService)
            reactionService = app.get(ReactionService)

            // seed the read-only course/module/content fixtures ONCE — only
            // users/comments/reactions/enrollments are reset between tests (see afterEach)
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "fullstack-mastery-discussion-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            const courseModule = await entityManager.save(
                entityManager.create(ModuleEntity,
                    {
                        title: "Module 1",
                        displayId: "module-1-discussion-e2e",
                        description: "e2e fixture module",
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            content = await entityManager.save(
                entityManager.create(ContentEntity,
                    {
                        title: "Lesson 1",
                        displayId: "lesson-1-discussion-e2e",
                        body: "lesson body",
                        defaultLocale: Locale.En,
                        module: courseModule,
                    }),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"comment_reactions\", \"content_reactions\", \"activity_reactions\", \"activities\", \"content_comments\", \"content_engagement_projections\", \"enrollments\", \"users\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
            cacheServiceMock.get.mockResolvedValue(undefined)
            cacheServiceMock.set.mockResolvedValue(undefined)
            cacheServiceMock.del.mockResolvedValue(undefined)
        })

        /** Seed a bare user (only keycloakId is required by this suite). */
        const seedUser = async (keycloakId: string): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                    }),
            )

        describe("create/update/delete comment — content/course XOR scope + ownership guard",
            () => {
                it("createComment scoped to a lesson content persists content_id set, course_id null",
                    async () => {
                        const user = await seedUser("kc-comment-content-scope")

                        const comment = await commentService.createComment({
                            contentId: content.id,
                            body: "a lesson question",
                            user,
                        })

                        const row = await entityManager.findOneOrFail(ContentCommentEntity,
                            {
                                where: {
                                    id: comment.id,
                                },
                            })
                        expect(row.contentId).toBe(content.id)
                        expect(row.courseId).toBeNull()
                    })

                it("createComment scoped to a course (course-general \"hỏi chung khóa\") persists course_id set, content_id null",
                    async () => {
                        const user = await seedUser("kc-comment-course-scope")

                        const comment = await commentService.createComment({
                            courseId: course.id,
                            body: "a course-general question",
                            user,
                        })

                        const row = await entityManager.findOneOrFail(ContentCommentEntity,
                            {
                                where: {
                                    id: comment.id,
                                },
                            })
                        expect(row.courseId).toBe(course.id)
                        expect(row.contentId).toBeNull()
                    })

                it("createComment rejects a top-level comment scoped to BOTH content and course — CommentInvalidScopeException, writes nothing",
                    async () => {
                        const user = await seedUser("kc-comment-both-scope")

                        await expect(
                            commentService.createComment({
                                contentId: content.id,
                                courseId: course.id,
                                body: "ambiguous scope",
                                user,
                            }),
                        ).rejects.toBeInstanceOf(CommentInvalidScopeException)

                        const count = await entityManager.count(ContentCommentEntity)
                        expect(count).toBe(0)
                    })

                it("createComment rejects a top-level comment scoped to NEITHER content nor course — CommentInvalidScopeException",
                    async () => {
                        const user = await seedUser("kc-comment-neither-scope")

                        await expect(
                            commentService.createComment({
                                body: "no scope at all",
                                user,
                            }),
                        ).rejects.toBeInstanceOf(CommentInvalidScopeException)
                    })

                it("a REPLY inherits its scope from the parent, ignoring the caller's own (mismatched) scope fields — never spoofable",
                    async () => {
                        const author = await seedUser("kc-comment-reply-scope-author")
                        const question = await commentService.createComment({
                            courseId: course.id,
                            body: "course-general parent",
                            user: author,
                        })

                        // the caller passes contentId (wrong scope) alongside parentCommentId —
                        // the parent's scope must win, never the caller-supplied one
                        const reply = await commentService.createComment({
                            contentId: content.id,
                            parentCommentId: question.id,
                            body: "a reply",
                            user: author,
                        })

                        const row = await entityManager.findOneOrFail(ContentCommentEntity,
                            {
                                where: {
                                    id: reply.id,
                                },
                            })
                        expect(row.courseId).toBe(course.id)
                        expect(row.contentId).toBeNull()
                        expect(row.parentCommentId).toBe(question.id)
                    })

                it("updateComment: the AUTHOR can edit; a NON-author is rejected — CommentForbiddenException, body untouched (IDOR guard)",
                    async () => {
                        const author = await seedUser("kc-comment-owner-a")
                        const attacker = await seedUser("kc-comment-attacker-a")
                        const comment = await commentService.createComment({
                            contentId: content.id,
                            body: "original comment",
                            user: author,
                        })

                        const edited = await commentService.updateComment({
                            commentId: comment.id,
                            body: "edited comment",
                            user: author,
                        })
                        expect(edited.body).toBe("edited comment")

                        await expect(
                            commentService.updateComment({
                                commentId: comment.id,
                                body: "hijacked comment",
                                user: attacker,
                            }),
                        ).rejects.toBeInstanceOf(CommentForbiddenException)

                        const row = await entityManager.findOneOrFail(ContentCommentEntity,
                            {
                                where: {
                                    id: comment.id,
                                },
                            })
                        expect(row.body).toBe("edited comment")
                    })

                it("softDeleteComment: the AUTHOR can delete — is_deleted flips true on the SAME row, replies survive; a NON-author is rejected",
                    async () => {
                        const author = await seedUser("kc-comment-owner-b")
                        const attacker = await seedUser("kc-comment-attacker-b")
                        const comment = await commentService.createComment({
                            contentId: content.id,
                            body: "parent comment",
                            user: author,
                        })
                        await commentService.createComment({
                            parentCommentId: comment.id,
                            body: "child reply",
                            user: author,
                        })

                        await expect(
                            commentService.softDeleteComment({
                                commentId: comment.id,
                                user: attacker,
                            }),
                        ).rejects.toBeInstanceOf(CommentForbiddenException)

                        const beforeOwnerDelete = await entityManager.findOneOrFail(
                            ContentCommentEntity,
                            {
                                where: {
                                    id: comment.id,
                                },
                            },
                        )
                        expect(beforeOwnerDelete.isDeleted).toBe(false)

                        const result = await commentService.softDeleteComment({
                            commentId: comment.id,
                            user: author,
                        })
                        expect(result.id).toBe(comment.id)

                        // the row still exists — soft delete, not a removal
                        const row = await entityManager.findOneOrFail(ContentCommentEntity,
                            {
                                where: {
                                    id: comment.id,
                                },
                            })
                        expect(row.isDeleted).toBe(true)

                        // the reply row still exists — thread shape survives
                        const replyCount = await entityManager.count(ContentCommentEntity,
                            {
                                where: {
                                    parentComment: {
                                        id: comment.id,
                                    },
                                },
                            })
                        expect(replyCount).toBe(1)
                    })

                it("getCommentOrThrow: a non-existent comment id is a hard 404 (CommentNotFoundException)",
                    async () => {
                        const user = await seedUser("kc-comment-404")
                        await expect(
                            commentService.updateComment({
                                commentId: "44444444-4444-4444-8444-444444444444",
                                body: "irrelevant",
                                user,
                            }),
                        ).rejects.toBeInstanceOf(CommentNotFoundException)
                    })
            })

        describe("react-to-comment — upsert-by-unique, null removes",
            () => {
                it("first reaction inserts, same user re-reacting UPDATES the SAME row (no duplicate), null removes it",
                    async () => {
                        const author = await seedUser("kc-react-comment-author")
                        const reactor = await seedUser("kc-react-comment-user")
                        const comment = await commentService.createComment({
                            contentId: content.id,
                            body: "react to this",
                            user: author,
                        })

                        const first = await reactionService.reactToComment({
                            commentId: comment.id,
                            user: reactor,
                            type: ReactionType.Like,
                        })
                        expect(first.total).toBe(1)
                        expect(first.myReaction).toBe(ReactionType.Like)

                        const changed = await reactionService.reactToComment({
                            commentId: comment.id,
                            user: reactor,
                            type: ReactionType.Sad,
                        })
                        expect(changed.total).toBe(1)
                        expect(changed.myReaction).toBe(ReactionType.Sad)

                        const rowCount = await entityManager.count(CommentReactionEntity,
                            {
                                where: {
                                    comment: {
                                        id: comment.id,
                                    },
                                },
                            })
                        expect(rowCount).toBe(1)

                        const removed = await reactionService.reactToComment({
                            commentId: comment.id,
                            user: reactor,
                            type: null,
                        })
                        expect(removed.total).toBe(0)

                        const afterRemove = await entityManager.count(CommentReactionEntity,
                            {
                                where: {
                                    comment: {
                                        id: comment.id,
                                    },
                                },
                            })
                        expect(afterRemove).toBe(0)
                    })

                it("reacting to a non-existent comment is a hard 404 (CommentNotFoundException)",
                    async () => {
                        const reactor = await seedUser("kc-react-comment-404")
                        await expect(
                            reactionService.reactToComment({
                                commentId: "55555555-5555-4555-8555-555555555555",
                                user: reactor,
                                type: ReactionType.Like,
                            }),
                        ).rejects.toBeInstanceOf(CommentNotFoundException)
                    })
            })

        describe("react-to-activity — self-reaction guard, real row committed",
            () => {
                /** Seed a bare feed activity row owned by `owner`. */
                const seedActivity = async (owner: UserEntity): Promise<ActivityEntity> =>
                    entityManager.save(
                        entityManager.create(ActivityEntity,
                            {
                                user: owner,
                                type: ActivityType.LessonRead,
                                idempotencyKey: `lesson-read-${owner.id}`,
                                payload: null,
                            }),
                    )

                it("a DIFFERENT user can react; the row lands in activity_reactions",
                    async () => {
                        const owner = await seedUser("kc-activity-owner")
                        const reactor = await seedUser("kc-activity-reactor")
                        const activity = await seedActivity(owner)

                        const result = await reactionService.reactToActivity({
                            activityId: activity.id,
                            user: reactor,
                            type: ReactionType.Wow,
                        })
                        expect(result.total).toBe(1)
                        expect(result.myReaction).toBe(ReactionType.Wow)

                        const row = await entityManager.findOneOrFail(ActivityReactionEntity,
                            {
                                where: {
                                    activity: {
                                        id: activity.id,
                                    },
                                    user: {
                                        id: reactor.id,
                                    },
                                },
                            })
                        expect(row.type).toBe(ReactionType.Wow)
                    })

                it("the OWNER reacting to their own activity is rejected — ActivitySelfReactionException, writes nothing (never a self-like)",
                    async () => {
                        const owner = await seedUser("kc-activity-self")
                        const activity = await seedActivity(owner)

                        await expect(
                            reactionService.reactToActivity({
                                activityId: activity.id,
                                user: owner,
                                type: ReactionType.Like,
                            }),
                        ).rejects.toBeInstanceOf(ActivitySelfReactionException)

                        const count = await entityManager.count(ActivityReactionEntity)
                        expect(count).toBe(0)
                    })

                it("reacting to a non-existent activity is a hard 404 (ActivityNotFoundException)",
                    async () => {
                        const reactor = await seedUser("kc-activity-404")
                        await expect(
                            reactionService.reactToActivity({
                                activityId: "66666666-6666-4666-8666-666666666666",
                                user: reactor,
                                type: ReactionType.Like,
                            }),
                        ).rejects.toBeInstanceOf(ActivityNotFoundException)
                    })
            })

        describe("react-to-content — real row + real engagement-projection recompute + trial enrollment anchor",
            () => {
                it("first reaction inserts a row anchored to a resolve-or-created TRIAL enrollment, and the projection reflects it",
                    async () => {
                        const reactor = await seedUser("kc-react-content-user")

                        const summary = await reactionService.reactToContent({
                            contentId: content.id,
                            user: reactor,
                            type: ReactionType.Love,
                        })
                        expect(summary.total).toBe(1)
                        expect(summary.myReaction).toBe(ReactionType.Love)

                        const row = await entityManager.findOneOrFail(ContentReactionEntity,
                            {
                                where: {
                                    content: {
                                        id: content.id,
                                    },
                                    user: {
                                        id: reactor.id,
                                    },
                                },
                            })
                        expect(row.type).toBe(ReactionType.Love)

                        // anchored to a resolve-or-created TRIAL enrollment (is_enrolled: false)
                        const enrollment = await entityManager.findOneOrFail(EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: reactor.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            })
                        expect(enrollment.isEnrolled).toBe(false)
                        expect(row.enrollmentId).toBe(enrollment.id)

                        // the engagement projection recomputed for real — not a mock
                        const engagement = await reactionService.summarizeContent({
                            contentId: content.id,
                            userId: reactor.id,
                        })
                        expect(engagement.total).toBe(1)
                        expect(engagement.counts).toEqual([
                            {
                                type: ReactionType.Love,
                                count: 1,
                            },
                        ])
                    })

                it("re-reacting UPDATES the SAME row (no duplicate) and the projection total stays at 1",
                    async () => {
                        const reactor = await seedUser("kc-react-content-change")

                        await reactionService.reactToContent({
                            contentId: content.id,
                            user: reactor,
                            type: ReactionType.Like,
                        })
                        const changed = await reactionService.reactToContent({
                            contentId: content.id,
                            user: reactor,
                            type: ReactionType.Angry,
                        })
                        expect(changed.myReaction).toBe(ReactionType.Angry)
                        expect(changed.total).toBe(1)

                        const rowCount = await entityManager.count(ContentReactionEntity,
                            {
                                where: {
                                    content: {
                                        id: content.id,
                                    },
                                    user: {
                                        id: reactor.id,
                                    },
                                },
                            })
                        expect(rowCount).toBe(1)
                    })
            })
    })
