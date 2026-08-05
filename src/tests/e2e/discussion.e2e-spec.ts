import request from "supertest"
import {
    Test,
} from "@nestjs/testing"
import type {
    CanActivate,
    ExecutionContext,
    INestApplication,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    ApolloServerModule,
    ApolloServerType,
} from "@modules/api"
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
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    CacheService,
} from "@modules/cache"
import {
    EventEmitterService,
} from "@modules/event"
import {
    CommentService,
    ContentEngagementProjectionService,
    GraphQLEnrollmentGuard,
    ReactionService,
    UserService,
} from "@modules/bussiness"
import {
    ContentCommentsResolver,
    ContentCommentsService,
} from "@features/api/core/graphql/queries/discussion/content-comments"
import {
    ContentReactionsResolver,
    ContentReactionsService,
} from "@features/api/core/graphql/queries/discussion/content-reactions"
import {
    ReactToContentResolver,
    ReactToContentService,
} from "@features/api/core/graphql/mutations/discussion/react-to-content"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the lesson-content discussion UGC write-flows --
 * `.claude/canon/be/enforce/authoring/testing.md` §2 names "a community post or
 * reaction" (the sibling domain to community) explicitly as a write flow that must
 * carry `*.e2e-spec.ts` coverage. Exercises {@link CommentService} and
 * {@link ReactionService} against REAL Postgres (Testcontainers) -- not the
 * mocked-`EntityManager` unit level already covered by each service's own `.spec.ts`.
 *
 * In focus: the OWNERSHIP guard on comment update+delete (the IDOR class -- a
 * non-author must never mutate someone else's comment), the content/course XOR scope
 * guard, the activity self-reaction guard, and soft-delete landing on the real
 * `is_deleted` column rather than removing the row.
 *
 * MOCKED (no external infra available in this harness, genuinely external to the
 * discussion domain under test):
 *  - `EventEmitterService` -- real class fans out to EventEmitter2 + NATS; stubbed so
 *    a mutation's room-broadcast side effect never touches either.
 *  - `CacheService` -- real class talks to Redis; stubbed to always miss so
 *    `UserService.resolveOrCreateTrialEnrollment` (react-to-content's enrollment
 *    anchor) hits real Postgres every time, never a stale cross-test cache entry
 *    (mirrors `flashcard-review.e2e-spec.ts`'s own mock of this same service).
 *
 * REAL: Postgres (Testcontainers), `CommentService` + `ReactionService` (the logic
 * under test), `ContentEngagementProjectionService` (only an `EntityManager`
 * dependency -- the react-to-content aggregate projection runs for real), and
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

        /** Read-only fixtures seeded ONCE -- only per-test user/comment/reaction state is reset. */
        let course: CourseEntity
        let content: ContentEntity

        // CacheService always misses -> UserService.resolveOrCreateTrialEnrollment hits
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
                    // real Postgres against the Testcontainers DB -- no hydration/
                    // resolvers/seeders, this focused app doesn't need them
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // REAL -- the comment/reaction logic under test
                    CommentService,
                    ReactionService,
                    // REAL -- only an EntityManager dependency, the projection runs for real
                    ContentEngagementProjectionService,
                    // REAL -- resolveOrCreateTrialEnrollment runs real SQL against real rows
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

            // seed the read-only course/module/content fixtures ONCE -- only
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

                it("createComment scoped to a course (course-general question) persists course_id set, content_id null",
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

                        // the caller passes contentId (wrong scope) alongside parentCommentId --
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

                        // the row still exists -- soft delete, not a removal
                        const row = await entityManager.findOneOrFail(ContentCommentEntity,
                            {
                                where: {
                                    id: comment.id,
                                },
                            })
                        expect(row.isDeleted).toBe(true)

                        // the reply row still exists -- thread shape survives
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

                        // the engagement projection recomputed for real -- not a mock
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

/**
 * e2e for the discussion READ resolvers (`contentComments`, `contentReactions`)
 * plus the `reactToContent` mutation -- driven over REAL HTTP through Apollo
 * (`ApolloServerModule` + guards), not the bare domain-service calls above. All
 * three GraphQL operations require `KeycloakAuthGraphQLGuard`
 * (`reactToContent` additionally chains `GraphQLEnrollmentGuard`); none of that
 * guard wiring had ever been exercised -- the block above calls the services
 * directly, bypassing every guard entirely.
 *
 * MOCKED (same externals as the block above):
 *  - `EventEmitterService`, `CacheService` (always-miss, see the block above).
 *
 * REAL: Postgres (Testcontainers), the full Apollo/GraphQL stack, every resolver +
 * query/mutation service under test, `CommentService`/`ReactionService`/
 * `ContentEngagementProjectionService`/`UserService`, and `GraphQLEnrollmentGuard`
 * (permissive here -- no `x-course-id` header is sent, matching how the FE calls
 * these two operations today). `KeycloakAuthGraphQLGuard` is overridden with a fake
 * `CanActivate` (mirrors `progress-query.e2e-spec.ts`) since there is no live
 * Keycloak server in this harness.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Discussion GraphQL — contentComments/contentReactions queries + reactToContent mutation (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager

        /** Read-only fixtures, seeded once -- distinct displayIds from the block above. */
        let course: CourseEntity
        let content: ContentEntity

        /** The "logged in" user the overridden guard stamps onto the request; null = unauthenticated. */
        let currentUser: UserEntity | null = null

        // mirrors progress-query.e2e-spec.ts's fakeAuthGuard: denies (-> Nest's
        // default ForbiddenException) when nobody is "logged in".
        const fakeAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                if (!currentUser) {
                    return false
                }
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = currentUser
                return true
            },
        }

        const cacheServiceMock = {
            get: jest.fn().mockResolvedValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        }
        const eventEmitterServiceMock = {
            emit: jest.fn().mockResolvedValue(undefined),
        }

        const GRAPHQL_ENDPOINT = "/graphql"

        const CONTENT_COMMENTS_QUERY = `
            query ContentCommentsRead($request: ContentCommentsRequest!) {
                contentComments(request: $request) {
                    success
                    message
                    error
                    data {
                        comments {
                            id
                            body
                            parentCommentId
                        }
                        total
                    }
                }
            }
        `
        const CONTENT_REACTIONS_QUERY = `
            query ContentReactionsRead($request: ContentReactionsRequest!) {
                contentReactions(request: $request) {
                    success
                    message
                    error
                    data {
                        total
                        myReaction
                    }
                }
            }
        `
        const REACT_TO_CONTENT_MUTATION = `
            mutation ReactToContentWrite($request: ReactToContentRequest!) {
                reactToContent(request: $request) {
                    success
                    message
                    error
                    data {
                        total
                        myReaction
                    }
                }
            }
        `

        const post = (query: string, variables: Record<string, unknown>) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query,
                    variables,
                })

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // REAL -- resolvers + their query/mutation services under test
                    ContentCommentsResolver,
                    ContentCommentsService,
                    ContentReactionsResolver,
                    ContentReactionsService,
                    ReactToContentResolver,
                    ReactToContentService,
                    // REAL -- the domain services + guard the resolvers delegate to
                    CommentService,
                    ReactionService,
                    ContentEngagementProjectionService,
                    UserService,
                    GraphQLEnrollmentGuard,
                    {
                        provide: CacheService,
                        useValue: cacheServiceMock,
                    },
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterServiceMock,
                    },
                ],
            })
                .overrideGuard(KeycloakAuthGraphQLGuard)
                .useValue(fakeAuthGuard)
                .compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )

            // read-only course/module/content fixtures, seeded ONCE -- distinct
            // displayIds from the direct-service block above (same DB, same suite)
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "fullstack-mastery-discussion-gql-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            const courseModule = await entityManager.save(
                entityManager.create(ModuleEntity,
                    {
                        title: "Module 1",
                        displayId: "module-1-discussion-gql-e2e",
                        description: "e2e fixture module",
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            content = await entityManager.save(
                entityManager.create(ContentEntity,
                    {
                        title: "Lesson 1",
                        displayId: "lesson-1-discussion-gql-e2e",
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
                "TRUNCATE TABLE \"comment_reactions\", \"content_reactions\", \"content_comments\", \"content_engagement_projections\", \"enrollments\", \"users\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
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

        describe("contentComments query",
            () => {
                it("an AUTHENTICATED viewer lists a lesson's top-level comments",
                    async () => {
                        const author = await seedUser("kc-gql-content-comments-author")
                        const topLevel = await entityManager.save(
                            entityManager.create(ContentCommentEntity,
                                {
                                    content,
                                    user: author,
                                    body: "a lesson question",
                                }),
                        )
                        await entityManager.save(
                            entityManager.create(ContentCommentEntity,
                                {
                                    content,
                                    user: author,
                                    parentComment: topLevel,
                                    body: "a reply",
                                }),
                        )

                        currentUser = author
                        const response = await post(CONTENT_COMMENTS_QUERY,
                            {
                                request: {
                                    contentId: content.id,
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.contentComments
                        expect(body.success).toBe(true)
                        expect(body.data.total).toBe(1)
                        expect(body.data.comments[0].id).toBe(topLevel.id)
                    })

                it("auth denied: an UNAUTHENTICATED request is rejected before the resolver runs",
                    async () => {
                        // currentUser left null -- the auth guard must deny before the query runs
                        const response = await post(CONTENT_COMMENTS_QUERY,
                            {
                                request: {
                                    contentId: content.id,
                                },
                            })

                        expect(response.body.errors).toBeDefined()
                        expect(response.body.errors.length).toBeGreaterThan(0)
                    })
            })

        describe("contentReactions query",
            () => {
                it("an AUTHENTICATED viewer reads the aggregate summary + their own pick",
                    async () => {
                        const reactor = await seedUser("kc-gql-content-reactions-user")
                        await entityManager.save(
                            entityManager.create(ContentReactionEntity,
                                {
                                    content,
                                    user: reactor,
                                    type: ReactionType.Wow,
                                }),
                        )

                        currentUser = reactor
                        const response = await post(CONTENT_REACTIONS_QUERY,
                            {
                                request: {
                                    contentId: content.id,
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.contentReactions
                        expect(body.success).toBe(true)
                        expect(body.data.total).toBe(1)
                        expect(body.data.myReaction).toBe("wow")
                    })

                it("auth denied: an UNAUTHENTICATED request is rejected before the resolver runs",
                    async () => {
                        const response = await post(CONTENT_REACTIONS_QUERY,
                            {
                                request: {
                                    contentId: content.id,
                                },
                            })

                        expect(response.body.errors).toBeDefined()
                        expect(response.body.errors.length).toBeGreaterThan(0)
                    })
            })

        describe("reactToContent mutation",
            () => {
                it("an AUTHENTICATED viewer reacts to a content — real row + recomputed summary over GraphQL",
                    async () => {
                        currentUser = await seedUser("kc-gql-react-to-content-user")

                        const response = await post(REACT_TO_CONTENT_MUTATION,
                            {
                                request: {
                                    contentId: content.id,
                                    type: "love",
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.reactToContent
                        expect(body.success).toBe(true)
                        expect(body.data.total).toBe(1)
                        expect(body.data.myReaction).toBe("love")

                        const row = await entityManager.findOneOrFail(ContentReactionEntity,
                            {
                                where: {
                                    content: {
                                        id: content.id,
                                    },
                                    user: {
                                        id: currentUser.id,
                                    },
                                },
                            })
                        expect(row.type).toBe(ReactionType.Love)
                    })

                it("auth denied: an UNAUTHENTICATED request is rejected before the resolver runs, writes NO row",
                    async () => {
                        // currentUser left null -- the auth guard must deny before the mutation runs
                        const response = await post(REACT_TO_CONTENT_MUTATION,
                            {
                                request: {
                                    contentId: content.id,
                                    type: "love",
                                },
                            })

                        expect(response.body.errors).toBeDefined()
                        expect(response.body.errors.length).toBeGreaterThan(0)
                        const count = await entityManager.count(ContentReactionEntity,
                            {
                                where: {
                                    content: {
                                        id: content.id,
                                    },
                                },
                            })
                        expect(count).toBe(0)
                    })
            })
    })
