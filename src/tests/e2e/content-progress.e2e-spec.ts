import request from "supertest"
import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
    CanActivate,
    ExecutionContext,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
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
    ActivityType,
    ContentEntity,
    CourseEntity,
    Locale,
    ModuleEntity,
    PrimaryPostgreSQLModule,
    UserContentEntity,
    UserEntity,
    XpHistoryEntity,
    XpSource,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakJwksService,
} from "@modules/keycloak"
import {
    SessionService,
} from "@modules/session"
import {
    CookieService,
} from "@modules/cookie"
import {
    CacheService,
} from "@modules/cache"
import {
    PingResolver,
} from "@tests/helpers"
import {
    GraphQLEnrollmentGuard,
    ProgressProjectionService,
    ReactionService,
    UserService,
} from "@modules/bussiness"
import {
    FLAT_POINTS,
} from "@features/api/processors/ai/shared/xp"
import {
    MarkAsReadedHandler,
} from "@features/api/core/graphql/mutations/contents/mark-as-readed/mark-as-readed.handler"
import {
    MarkAsReadedResolver,
} from "@features/api/core/graphql/mutations/contents/mark-as-readed/mark-as-readed.resolver"
import {
    MarkAsReadedService,
} from "@features/api/core/graphql/mutations/contents/mark-as-readed/mark-as-readed.service"
import {
    ToggleFavouriteHandler,
} from "@features/api/core/graphql/mutations/contents/toggle-favourite/toggle-favourite.handler"
import {
    ToggleFavouriteResolver,
} from "@features/api/core/graphql/mutations/contents/toggle-favourite/toggle-favourite.resolver"
import {
    ToggleFavouriteService,
} from "@features/api/core/graphql/mutations/contents/toggle-favourite/toggle-favourite.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Mirrors `MarkAsReadedHandler`'s own (unexported) constant. */
const LESSON_READ_XP = 3

/**
 * e2e for the two "content complete" progress mutations -- `markContentAsReaded`
 * and `toggleFavourite` -- over REAL HTTP + REAL Postgres (Testcontainers), not
 * the mocked-DB unit level (see `mark-as-readed.handler.spec.ts` /
 * `toggle-favourite.handler.spec.ts`).
 *
 * Business rules under test (`MarkAsReadedHandler` / `ToggleFavouriteHandler`):
 *  - A deliberate mark-as-read (`silent: false`) credits `LESSON_READ_XP` XP +
 *    `FLAT_POINTS.lessonRead` Coin exactly once, keyed by the `(source, refId)`
 *    unique constraint on `xp_histories` -- re-marking already-read content never
 *    double-credits.
 *  - `silent: true` (the auto-mark-on-scroll path) updates the read flag but
 *    grants NOTHING -- no XP row, no activity row -- so passive scrolling never
 *    spends the one-time reward; a later deliberate claim on the same content
 *    still grants once.
 *  - `toggleFavourite` records a `LessonBookmarked` activity only when turning
 *    the favourite ON (never on unfavouriting), idempotent on the
 *    `UserContentEntity` row id so re-favouriting the same content never
 *    duplicates the feed entry.
 *
 * MOCKED (no external infra available in this harness):
 *  - `ReactionService` -- real class talks to the view-count cache/projection
 *    graph unrelated to this spec's assertions; stubbed to a no-op.
 *  - `CacheService` -- always misses, so `UserService` hits real Postgres.
 *  - `KeycloakAuthGraphQLGuard` -- overridden to stamp `request.user` with
 *    whichever fake user the test "logs in" as (no Keycloak server here).
 *
 * REAL: Postgres (Testcontainers), `MarkAsReadedHandler` / `ToggleFavouriteHandler`
 * (the mutations under test), `UserService` (`resolveOrCreateTrialEnrollment`
 * runs real SQL), `ProgressProjectionService`, `GraphQLEnrollmentGuard`, and the
 * plain `writeXpHistory` / `writeActivity` functions (operate directly on the
 * real `EntityManager`, no DI needed) -- so the XP ledger + Coin credit + home-feed
 * activity are asserted as real committed rows, not mocked calls.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Content progress mutations — markContentAsReaded / toggleFavourite (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager

        /** The "logged in" user the overridden Keycloak guard stamps onto the request. */
        let currentUser: UserEntity | null = null

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

        /** Fixture ids shared by every test (seeded once -- read-only material). */
        let course: CourseEntity
        let content: ContentEntity

        const reactionServiceMock = {
            invalidateViewCount: jest.fn().mockResolvedValue(undefined),
        }
        const cacheServiceMock = {
            get: jest.fn().mockResolvedValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        }

        const GRAPHQL_ENDPOINT = "/graphql"

        const MARK_AS_READED_MUTATION = `
            mutation Mark($request: MarkAsReadedRequest!) {
                markContentAsReaded(request: $request) {
                    success
                    error
                }
            }
        `
        const TOGGLE_FAVOURITE_MUTATION = `
            mutation Toggle($request: ToggleFavouriteRequest!) {
                toggleFavourite(request: $request) {
                    success
                    error
                }
            }
        `

        /** POST a GraphQL mutation with a single `$request` variable. */
        const gql = (query: string, input: Record<string, unknown>) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query,
                    variables: {
                        request: input,
                    },
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
                    // CommandBus + @CommandHandler discovery for both handlers
                    CqrsModule,
                ],
                providers: [
                    PingResolver,
                    MarkAsReadedResolver,
                    MarkAsReadedService,
                    MarkAsReadedHandler,
                    ToggleFavouriteResolver,
                    ToggleFavouriteService,
                    ToggleFavouriteHandler,
                    // REAL -- resolveOrCreateTrialEnrollment runs real SQL
                    UserService,
                    // REAL -- only entityManager dep, recomputes the progress row
                    ProgressProjectionService,
                    // REAL -- the permissive enrollment-context guard mark-as-readed uses
                    GraphQLEnrollmentGuard,
                    {
                        provide: ReactionService,
                        useValue: reactionServiceMock,
                    },
                    {
                        provide: CacheService,
                        useValue: cacheServiceMock,
                    },
                    // guard deps -- let Nest construct the real guard at compile
                    // time; `.overrideGuard` swaps its runtime behaviour below
                    {
                        provide: KeycloakJwksService,
                        useValue: {
                        },
                    },
                    {
                        provide: SessionService,
                        useValue: {
                        },
                    },
                    {
                        provide: CookieService,
                        useValue: {
                        },
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

            // seed the read-only course/content fixtures ONCE -- only users/
            // enrollments/user_contents/xp_histories/activities are reset between
            // tests (see afterEach)
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "fullstack-mastery-progress-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            const courseModule = await entityManager.save(
                entityManager.create(ModuleEntity,
                    {
                        title: "Module 1",
                        displayId: "module-1-progress-e2e",
                        description: "e2e fixture module",
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            content = await entityManager.save(
                entityManager.create(ContentEntity,
                    {
                        title: "Intro Lesson",
                        displayId: "intro-lesson-progress-e2e",
                        body: "unused-db-scalar-body",
                        defaultLocale: Locale.En,
                        isPremium: false,
                        module: courseModule,
                    }),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // course/content fixtures (seeded in beforeAll) are read-only across the
            // whole suite; everything else is per-test.
            await entityManager.query(
                "TRUNCATE TABLE \"xp_histories\", \"activities\", \"user_contents\", \"enrollments\", \"users\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
            jest.clearAllMocks()
            reactionServiceMock.invalidateViewCount.mockResolvedValue(undefined)
            cacheServiceMock.get.mockResolvedValue(undefined)
            cacheServiceMock.set.mockResolvedValue(undefined)
            cacheServiceMock.del.mockResolvedValue(undefined)
        })

        /** Seed a bare user with a starting Coin balance of 0 (only keycloakId required otherwise). */
        const seedUser = async (keycloakId: string): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                        coinBalance: 0,
                    }),
            )

        it("deliberate mark-as-read (silent: false) → isRead=true + XP/Coin credited once + a LessonRead activity row; re-marking is idempotent (no double credit)",
            async () => {
                const user = await seedUser("kc-mark-readed-deliberate")
                currentUser = user

                const first = await gql(MARK_AS_READED_MUTATION,
                    {
                        contentId: content.id,
                        readed: true,
                        silent: false,
                    })
                expect(first.status).toBe(200)
                expect(first.body.data.markContentAsReaded.success).toBe(true)

                const userContent = await entityManager.findOneOrFail(UserContentEntity,
                    {
                        where: {
                            userId: user.id,
                            contentId: content.id,
                        },
                    })
                expect(userContent.isRead).toBe(true)
                // the enrollment-centric re-key: a trial enrollment is auto-created
                // and the row keys off it going forward
                expect(userContent.enrollmentId).toBeTruthy()

                const xpRow = await entityManager.findOneOrFail(XpHistoryEntity,
                    {
                        where: {
                            user: {
                                id: user.id,
                            },
                            source: XpSource.LessonRead,
                        },
                    })
                expect(xpRow.amount).toBe(LESSON_READ_XP)
                expect(xpRow.points).toBe(FLAT_POINTS.lessonRead)
                expect(xpRow.refId).toBe(userContent.id)

                const reloadedUser = await entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            id: user.id,
                        },
                    })
                expect(reloadedUser.coinBalance).toBe(FLAT_POINTS.lessonRead)

                const activityRow = await entityManager.findOneOrFail(ActivityEntity,
                    {
                        where: {
                            user: {
                                id: user.id,
                            },
                            type: ActivityType.LessonRead,
                        },
                    })
                expect(activityRow.idempotencyKey).toBe(userContent.id)

                // re-marking the same content as read must NOT double-credit
                const second = await gql(MARK_AS_READED_MUTATION,
                    {
                        contentId: content.id,
                        readed: true,
                        silent: false,
                    })
                expect(second.status).toBe(200)
                expect(second.body.data.markContentAsReaded.success).toBe(true)

                expect(await entityManager.count(XpHistoryEntity,
                    {
                        where: {
                            user: {
                                id: user.id,
                            },
                            source: XpSource.LessonRead,
                        },
                    })).toBe(1)
                const stillReloadedUser = await entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            id: user.id,
                        },
                    })
                expect(stillReloadedUser.coinBalance).toBe(FLAT_POINTS.lessonRead)
            })

        it("silent auto-mark (silent: true) updates read state but grants NOTHING; a later deliberate claim on the same content still grants once",
            async () => {
                const user = await seedUser("kc-mark-readed-silent")
                currentUser = user

                const silent = await gql(MARK_AS_READED_MUTATION,
                    {
                        contentId: content.id,
                        readed: true,
                        silent: true,
                    })
                expect(silent.status).toBe(200)
                expect(silent.body.data.markContentAsReaded.success).toBe(true)

                const userContent = await entityManager.findOneOrFail(UserContentEntity,
                    {
                        where: {
                            userId: user.id,
                            contentId: content.id,
                        },
                    })
                expect(userContent.isRead).toBe(true)
                expect(await entityManager.count(XpHistoryEntity)).toBe(0)
                expect(await entityManager.count(ActivityEntity)).toBe(0)
                const untouchedUser = await entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            id: user.id,
                        },
                    })
                expect(untouchedUser.coinBalance).toBe(0)

                // the learner then deliberately claims the reward on the page the
                // auto-mark already silently marked read -- must still grant once
                const claim = await gql(MARK_AS_READED_MUTATION,
                    {
                        contentId: content.id,
                        readed: true,
                        silent: false,
                    })
                expect(claim.status).toBe(200)
                expect(claim.body.data.markContentAsReaded.success).toBe(true)

                expect(await entityManager.count(XpHistoryEntity)).toBe(1)
                const claimedUser = await entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            id: user.id,
                        },
                    })
                expect(claimedUser.coinBalance).toBe(FLAT_POINTS.lessonRead)
            })

        it("toggleFavourite records a LessonBookmarked activity only when turning ON, never on unfavouriting, and never duplicates on re-favouriting",
            async () => {
                const user = await seedUser("kc-toggle-favourite")
                currentUser = user

                const on = await gql(TOGGLE_FAVOURITE_MUTATION,
                    {
                        contentId: content.id,
                        isFavorite: true,
                    })
                expect(on.status).toBe(200)
                expect(on.body.data.toggleFavourite.success).toBe(true)

                const favourited = await entityManager.findOneOrFail(UserContentEntity,
                    {
                        where: {
                            userId: user.id,
                            contentId: content.id,
                        },
                    })
                expect(favourited.isFavorite).toBe(true)
                expect(await entityManager.count(ActivityEntity,
                    {
                        where: {
                            user: {
                                id: user.id,
                            },
                            type: ActivityType.LessonBookmarked,
                        },
                    })).toBe(1)

                const off = await gql(TOGGLE_FAVOURITE_MUTATION,
                    {
                        contentId: content.id,
                        isFavorite: false,
                    })
                expect(off.status).toBe(200)
                expect(off.body.data.toggleFavourite.success).toBe(true)

                const unfavourited = await entityManager.findOneOrFail(UserContentEntity,
                    {
                        where: {
                            userId: user.id,
                            contentId: content.id,
                        },
                    })
                expect(unfavourited.isFavorite).toBe(false)
                // unfavouriting never writes an activity row -- still exactly 1
                expect(await entityManager.count(ActivityEntity,
                    {
                        where: {
                            user: {
                                id: user.id,
                            },
                            type: ActivityType.LessonBookmarked,
                        },
                    })).toBe(1)

                const onAgain = await gql(TOGGLE_FAVOURITE_MUTATION,
                    {
                        contentId: content.id,
                        isFavorite: true,
                    })
                expect(onAgain.status).toBe(200)
                expect(onAgain.body.data.toggleFavourite.success).toBe(true)

                const refavourited = await entityManager.findOneOrFail(UserContentEntity,
                    {
                        where: {
                            userId: user.id,
                            contentId: content.id,
                        },
                    })
                expect(refavourited.isFavorite).toBe(true)
                // idempotencyKey = the SAME UserContentEntity row id across every
                // toggle -- re-favouriting never duplicates the feed entry
                expect(await entityManager.count(ActivityEntity,
                    {
                        where: {
                            user: {
                                id: user.id,
                            },
                            type: ActivityType.LessonBookmarked,
                        },
                    })).toBe(1)
            })
    })
