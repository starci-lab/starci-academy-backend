// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handlers pull `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle (same guard as
// review-personal-project-task.handler.spec.ts).
import "@modules/bussiness"
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
    ActionType,
    CourseEntity,
    EnrollmentEntity,
    JobEntity,
    JobStatus,
    Locale,
    PricingPhase,
    PrimaryPostgreSQLModule,
    UserEntity,
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
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    UserService,
} from "@modules/bussiness"
import {
    CacheService,
} from "@modules/cache"
import {
    IncompletedJobsResolver,
} from "@features/api/core/graphql/queries/jobs/incompleted-jobs/incompleted-jobs.resolver"
import {
    IncompletedJobsService,
} from "@features/api/core/graphql/queries/jobs/incompleted-jobs/incompleted-jobs.service"
import {
    IncompletedJobsHandler,
} from "@features/api/core/graphql/queries/jobs/incompleted-jobs/incompleted-jobs.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the `incompletedJobs` query -- the caller's still-queued-or-processing
 * Git/Google-Docs submission jobs. No e2e coverage existed before this file
 * (`incompleted-jobs.handler.ts` has no `.spec.ts` sibling with a real schema at
 * all). Exercises the REAL `GraphQLMustEnrolledGuard` (-> real
 * `UserService.checkEnrollment` SQL against real `enrollments` rows) stacked in
 * front of the real CQRS query handler.
 *
 * MOCKED:
 *  - `CacheService` -- real class talks to Redis; stubbed to always MISS so
 *    `UserService.checkEnrollment` hits real Postgres every time (no stale
 *    cross-test cache to reason about) -- same pattern as
 *    `personal-project.e2e-spec.ts`.
 *  - `KeycloakAuthGraphQLGuard` -- no Keycloak server here; overridden to stamp
 *    `request.user` with whichever fake user the test "logs in" as.
 *  - `KeycloakJwksService` / `SessionService` / `CookieService` -- only needed so
 *    Nest can construct the real `KeycloakAuthGraphQLGuard` at compile time;
 *    `.overrideGuard` swaps its runtime behaviour, these are never invoked.
 *
 * REAL: Postgres (Testcontainers), the full GraphQL/Apollo wiring,
 * `GraphQLMustEnrolledGuard` + `UserService.checkEnrollment`, and
 * `IncompletedJobsHandler`'s real `jobs` query (status/actionType/user filter +
 * `queueAt DESC` order).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("incompletedJobs (e2e)",
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

        // UserService.checkEnrollment's only cache layer -- always miss, so the
        // guard hits real Postgres every time
        const cacheServiceMock = {
            get: jest.fn().mockResolvedValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        }

        /** Read-only course fixture, seeded once in `beforeAll`. */
        let course: CourseEntity

        const GRAPHQL_ENDPOINT = "/graphql"

        const QUERY = `
            query IncompletedJobs {
                incompletedJobs {
                    success
                    message
                    error
                    data { items { jobId status } }
                }
            }
        `

        /** POST the query, optionally with an `x-course-id` header. */
        const post = (courseId?: string) => {
            const req = request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: QUERY,
                })
            if (courseId) {
                req.set("x-course-id",
                    courseId)
            }
            return req
        }

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
                    // QueryBus + @QueryHandler discovery for IncompletedJobsHandler
                    CqrsModule,
                ],
                providers: [
                    IncompletedJobsResolver,
                    IncompletedJobsService,
                    IncompletedJobsHandler,
                    // REAL -- the enrollment gate under test, resolved lazily by
                    // @UseGuards() from this module's own provider graph
                    GraphQLMustEnrolledGuard,
                    // REAL -- checkEnrollment runs real SQL against real `enrollments`
                    UserService,
                    {
                        provide: CacheService,
                        useValue: cacheServiceMock,
                    },
                    // KeycloakAuthGraphQLGuard deps -- let Nest construct the real
                    // guard at compile time; `.overrideGuard` swaps its runtime
                    // behaviour below (same pattern as personal-project.e2e-spec.ts)
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

            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "fullstack-mastery-jobs-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // course (seeded in beforeAll) is read-only across the whole suite --
            // only per-test user/enrollment/job state is reset
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"enrollments\", \"jobs\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
            jest.clearAllMocks()
            cacheServiceMock.get.mockResolvedValue(undefined)
            cacheServiceMock.set.mockResolvedValue(undefined)
            cacheServiceMock.del.mockResolvedValue(undefined)
        })

        /** Seed a bare user (only keycloakId is required). */
        const seedUser = async (keycloakId: string): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                    }),
            )

        /** Seed a REAL, active (`is_enrolled = true`) enrollment for (user, course). */
        const seedEnrollment = async (user: UserEntity): Promise<EnrollmentEntity> =>
            entityManager.save(
                entityManager.create(EnrollmentEntity,
                    {
                        user,
                        course,
                        pricingPhase: PricingPhase.Regular,
                        isEnrolled: true,
                    }),
            )

        it("enrolled learner → only the caller's own still-queued/processing Git+GDocs jobs, newest queueAt first",
            async () => {
                currentUser = await seedUser("kc-jobs-enrolled")
                await seedEnrollment(currentUser)
                const otherUser = await seedUser("kc-jobs-other-user")

                const older = await entityManager.save(
                    entityManager.create(JobEntity,
                        {
                            userId: currentUser.id,
                            payload: "{}",
                            actionType: ActionType.ProcessGitSubmission,
                            status: JobStatus.Queued,
                            queueAt: new Date("2026-01-01T00:00:00.000Z"),
                        }),
                )
                const newer = await entityManager.save(
                    entityManager.create(JobEntity,
                        {
                            userId: currentUser.id,
                            payload: "{}",
                            actionType: ActionType.ProcessGoogleDocsSubmission,
                            status: JobStatus.Processing,
                            queueAt: new Date("2026-01-02T00:00:00.000Z"),
                        }),
                )
                // must NOT appear: already completed
                await entityManager.save(
                    entityManager.create(JobEntity,
                        {
                            userId: currentUser.id,
                            payload: "{}",
                            actionType: ActionType.ProcessGitSubmission,
                            status: JobStatus.Completed,
                        }),
                )
                // must NOT appear: a still-queued job, but wrong pipeline
                await entityManager.save(
                    entityManager.create(JobEntity,
                        {
                            userId: currentUser.id,
                            payload: "{}",
                            actionType: ActionType.JudgeCodingSubmission,
                            status: JobStatus.Queued,
                        }),
                )
                // must NOT appear: belongs to a DIFFERENT (also enrolled) user
                await entityManager.save(
                    entityManager.create(JobEntity,
                        {
                            userId: otherUser.id,
                            payload: "{}",
                            actionType: ActionType.ProcessGitSubmission,
                            status: JobStatus.Queued,
                        }),
                )

                const response = await post(course.id)

                expect(response.status).toBe(200)
                const body = response.body.data.incompletedJobs
                expect(body.success).toBe(true)
                expect(body.data.items).toEqual([
                    {
                        jobId: newer.id,
                        status: JobStatus.Processing,
                    },
                    {
                        jobId: older.id,
                        status: JobStatus.Queued,
                    },
                ])
            })

        it("caller with NO enrollment row → BLOCKED by GraphQLMustEnrolledGuard, jobs query never runs",
            async () => {
                currentUser = await seedUser("kc-jobs-not-enrolled")
                // no enrollment row at all for `course`
                await entityManager.save(
                    entityManager.create(JobEntity,
                        {
                            userId: currentUser.id,
                            payload: "{}",
                            actionType: ActionType.ProcessGitSubmission,
                            status: JobStatus.Queued,
                        }),
                )

                const response = await post(course.id)

                // the guard's thrown exception surfaces via Apollo's `formatError`
                // (a GraphQL transport error), not the interceptor's {success:false}
                // body -- guards run BEFORE interceptors (see personal-project.e2e-spec.ts)
                expect(response.body.data).toBeNull()
                expect(response.body.errors[0].extensions.code)
                    .toBe("ENROLLMENT_NOT_FOUND_EXCEPTION")
            })
    })
