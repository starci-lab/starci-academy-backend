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
    ChallengeDifficulty,
    ChallengeEntity,
    ChallengeSubmissionEntity,
    ContentEntity,
    CourseEntity,
    EnrollmentEntity,
    Locale,
    MilestoneEntity,
    MilestoneTaskEntity,
    ModuleEntity,
    PricingPhase,
    PrimaryPostgreSQLModule,
    SubmissionType,
    UserChallengeSubmissionAttemptEntity,
    UserChallengeSubmissionEntity,
    UserEntity,
    UserMilestoneTaskAttemptEntity,
    UserMilestoneTaskEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    ChallengeProgressService,
    PersonalProjectProgressService,
} from "@modules/bussiness"
import {
    UserService,
} from "@modules/bussiness"
import {
    CacheKey,
    CacheService,
} from "@modules/cache"
import {
    MountStorageService,
} from "@modules/filesystem"
import {
    ChallengeSubmissionProgressResolver,
} from "@features/api/core/graphql/queries/challenges/challenge-submission-progress/challenge-submission-progress.resolver"
import {
    ChallengeSubmissionProgressService,
} from "@features/api/core/graphql/queries/challenges/challenge-submission-progress/challenge-submission-progress.service"
import {
    ChallengeSubmissionProgressHandler,
} from "@features/api/core/graphql/queries/challenges/challenge-submission-progress/challenge-submission-progress.handler"
import {
    MilestoneTaskProgressResolver,
} from "@features/api/core/graphql/queries/personal-project/milestone-task-progress/milestone-task-progress.resolver"
import {
    MilestoneTaskProgressService,
} from "@features/api/core/graphql/queries/personal-project/milestone-task-progress/milestone-task-progress.service"
import {
    MilestoneTaskProgressHandler,
} from "@features/api/core/graphql/queries/personal-project/milestone-task-progress/milestone-task-progress.handler"
import {
    TestHelpersModule,
} from "@tests/helpers"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Fraction of max score an attempt must reach to pass (both trackers use the same knob here). */
const PASS_THRESHOLD = 0.7

/**
 * e2e for the two progress QUERY reads -- `.artifacts/states/progress/findings.md`
 * #4: "no e2e coverage for either progress read path", both `.handler.spec.ts`
 * files mock the `EntityManager` + service entirely, so neither the real
 * multi-table join ({@link ChallengeProgressService.computeProgress} /
 * {@link PersonalProjectProgressService.computeProgress}) nor the derived
 * status/score/currentTask logic has ever run against a real schema.
 *
 * This file seeds real challenge/milestone fixtures plus real user-submission
 * and user-milestone-task-attempt rows against Testcontainers Postgres, then
 * asserts the GraphQL response against what the REAL join computes -- not a
 * hand-written expectation that merely mirrors the source.
 *
 * MOCKED (no external infra in this harness):
 *  - `MountStorageService` -- real class reads a mounted app-config file for
 *    `systemConfig.{challenge,task}.passThreshold`; stubbed to a fixed 0.7.
 *  - `CacheService` -- real class talks to Redis. The challenge-progress side
 *    doesn't use it at all (it is a Postgres CQRS projection, TTL-checked off
 *    `updated_at`); the milestone-task side uses it as its ONLY cache layer,
 *    so it is stubbed to always MISS -- every `milestoneTaskProgress` read in
 *    this file exercises the real `computeProgress` join, never a cached value.
 *  - `KeycloakAuthGraphQLGuard` -- no Keycloak server here; overridden to stamp
 *    `request.user` with whichever fake user the test "logs in" as.
 *
 * REAL: Postgres (Testcontainers), the full GraphQL/Apollo wiring, both CQRS
 * query handlers, `ChallengeProgressService` (including its
 * `user_challenge_progress_projections` UPSERT + TTL lazy-refresh), and
 * `PersonalProjectProgressService`'s per-task N+1 read loop.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Progress query reads (e2e)",
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

        const mountStorageServiceMock = {
            appConfig: {
                systemConfig: {
                    challenge: {
                        passThreshold: PASS_THRESHOLD,
                    },
                    task: {
                        passThreshold: PASS_THRESHOLD,
                    },
                },
            },
        }
        // milestone-task-progress's ONLY cache layer -- always miss, so every
        // read in this file exercises the real join, never a stale cached value.
        const cacheServiceMock = {
            get: jest.fn().mockResolvedValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        }

        /** Read-only fixtures, seeded once in `beforeAll`. */
        let course: CourseEntity
        let challengeNotStarted: ChallengeEntity
        let challengeInProgress: ChallengeEntity
        let challengeFailed: ChallengeEntity
        let challengeCompleted: ChallengeEntity
        let submissionInProgress: ChallengeSubmissionEntity
        let submissionFailed: ChallengeSubmissionEntity
        let submissionCompleted: ChallengeSubmissionEntity
        let taskCompleted: MilestoneTaskEntity
        let taskFailed: MilestoneTaskEntity
        let taskNotStarted: MilestoneTaskEntity

        const GRAPHQL_ENDPOINT = "/graphql"

        const CHALLENGE_PROGRESS_QUERY = `
            query ChallengeProgress($request: ChallengeSubmissionProgressRequest!) {
                challengeSubmissionProgress(request: $request) {
                    success
                    message
                    error
                    data {
                        completionTasks {
                            id
                            lastScore
                            maxScore
                            completed
                            status
                            numAttempts
                        }
                    }
                }
            }
        `
        const MILESTONE_PROGRESS_QUERY = `
            query MilestoneProgress($request: MilestoneTaskProgressRequest!) {
                milestoneTaskProgress(request: $request) {
                    success
                    message
                    error
                    data {
                        completionTasks {
                            id
                            lastScore
                            maxScore
                            completed
                            numAttempts
                        }
                        currentTask {
                            id
                        }
                    }
                }
            }
        `

        const post = (query: string, courseId: string) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query,
                    variables: {
                        request: {
                            courseId,
                        },
                    },
                })

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    // QueryBus + @QueryHandler discovery for both handlers
                    CqrsModule,
                ],
                providers: [
                    ChallengeSubmissionProgressResolver,
                    ChallengeSubmissionProgressService,
                    ChallengeSubmissionProgressHandler,
                    MilestoneTaskProgressResolver,
                    MilestoneTaskProgressService,
                    MilestoneTaskProgressHandler,
                    // REAL -- the joins under test
                    ChallengeProgressService,
                    PersonalProjectProgressService,
                    // REAL -- injected by MilestoneTaskProgressHandler but unused by its
                    // visible logic; still needs to resolve for DI to compile
                    UserService,
                    {
                        provide: CacheService,
                        useValue: cacheServiceMock,
                    },
                    {
                        provide: MountStorageService,
                        useValue: mountStorageServiceMock,
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

            // --- read-only course/challenge/milestone fixtures, seeded ONCE ---
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "fullstack-mastery-progress-query-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            const courseModule = await entityManager.save(
                entityManager.create(ModuleEntity,
                    {
                        title: "Module 1",
                        displayId: "module-1-progress-query-e2e",
                        description: "e2e fixture module",
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            const content = await entityManager.save(
                entityManager.create(ContentEntity,
                    {
                        title: "Lesson 1",
                        displayId: "lesson-1-progress-query-e2e",
                        body: "unused",
                        defaultLocale: Locale.En,
                        module: courseModule,
                    }),
            )

            const makeChallenge = (
                displayId: string,
                sortIndex: number,
            ): Promise<ChallengeEntity> =>
                entityManager.save(
                    entityManager.create(ChallengeEntity,
                        {
                            title: `Challenge ${displayId}`,
                            displayId,
                            description: "e2e fixture challenge",
                            score: 100,
                            difficulty: ChallengeDifficulty.Medium,
                            sortIndex,
                            defaultLocale: Locale.En,
                            content,
                        }),
                )
            challengeNotStarted = await makeChallenge("challenge-not-started",
                0)
            challengeInProgress = await makeChallenge("challenge-in-progress",
                1)
            challengeFailed = await makeChallenge("challenge-failed",
                2)
            challengeCompleted = await makeChallenge("challenge-completed",
                3)

            const makeSubmission = (
                challenge: ChallengeEntity,
            ): Promise<ChallengeSubmissionEntity> =>
                entityManager.save(
                    entityManager.create(ChallengeSubmissionEntity,
                        {
                            type: SubmissionType.GithubUrl,
                            title: "Submission",
                            score: 100,
                            orderIndex: 0,
                            challenge,
                        }),
                )
            // seeds the row (a real submission with no graded attempt) -- the
            // "notStarted" progress case reads it from the DB, not from a var
            await makeSubmission(challengeNotStarted)
            submissionInProgress = await makeSubmission(challengeInProgress)
            submissionFailed = await makeSubmission(challengeFailed)
            submissionCompleted = await makeSubmission(challengeCompleted)

            const milestone = await entityManager.save(
                entityManager.create(MilestoneEntity,
                    {
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            const makeTask = (
                displayId: string,
                sortIndex: number,
            ): Promise<MilestoneTaskEntity> =>
                entityManager.save(
                    entityManager.create(MilestoneTaskEntity,
                        {
                            displayId,
                            title: `Task ${displayId}`,
                            maxScore: 100,
                            sortIndex,
                            defaultLocale: Locale.En,
                            milestone,
                        }),
                )
            // sort order: completed(0) -> failed(1) -> notStarted(2) -- proves
            // currentTask picks the FIRST uncompleted one (failed), not merely
            // the first one in the array
            taskCompleted = await makeTask("task-completed",
                0)
            taskFailed = await makeTask("task-failed",
                1)
            taskNotStarted = await makeTask("task-not-started",
                2)
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // enrollments CASCADE-truncates user_challenge_submissions(+attempts),
            // user_milestone_tasks(+attempts), and user_challenge_progress_projections
            // -- every mutable row this suite writes. Challenge/milestone/task
            // fixtures (seeded in beforeAll) are read-only across the whole suite.
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"enrollments\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
            jest.clearAllMocks()
            cacheServiceMock.get.mockResolvedValue(undefined)
            cacheServiceMock.set.mockResolvedValue(undefined)
            cacheServiceMock.del.mockResolvedValue(undefined)
        })

        const seedUser = async (keycloakId: string): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                    }),
            )

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

        describe("challengeSubmissionProgress",
            () => {
                it("computes notStarted / inProgress / failed / completed from the REAL join — not a hand-picked stub",
                    async () => {
                        currentUser = await seedUser("kc-challenge-progress")
                        const enrollment = await seedEnrollment(currentUser)

                        // challengeNotStarted: no user submission row at all
                        // challengeInProgress: a user submission row exists, zero attempts
                        await entityManager.save(
                            entityManager.create(UserChallengeSubmissionEntity,
                                {
                                    enrollment,
                                    submission: submissionInProgress,
                                    submissionUrl: "https://github.com/starci/in-progress",
                                }),
                        )
                        // challengeFailed: one attempt, below the 0.7 pass threshold (40 < 70)
                        const userSubmissionFailed = await entityManager.save(
                            entityManager.create(UserChallengeSubmissionEntity,
                                {
                                    enrollment,
                                    submission: submissionFailed,
                                    submissionUrl: "https://github.com/starci/failed",
                                }),
                        )
                        await entityManager.save(
                            entityManager.create(UserChallengeSubmissionAttemptEntity,
                                {
                                    attemptNumber: 1,
                                    score: 40,
                                    submissionUrl: "https://github.com/starci/failed",
                                    defaultLocale: Locale.En,
                                    userChallengeSubmission: userSubmissionFailed,
                                }),
                        )
                        // challengeCompleted: TWO attempts -- the LATEST by attemptNumber (not
                        // insertion order) must win: attempt 1 fails, attempt 2 passes
                        const userSubmissionCompleted = await entityManager.save(
                            entityManager.create(UserChallengeSubmissionEntity,
                                {
                                    enrollment,
                                    submission: submissionCompleted,
                                    submissionUrl: "https://github.com/starci/completed",
                                }),
                        )
                        await entityManager.save(
                            entityManager.create(UserChallengeSubmissionAttemptEntity,
                                {
                                    attemptNumber: 1,
                                    score: 30,
                                    submissionUrl: "https://github.com/starci/completed",
                                    defaultLocale: Locale.En,
                                    userChallengeSubmission: userSubmissionCompleted,
                                }),
                        )
                        await entityManager.save(
                            entityManager.create(UserChallengeSubmissionAttemptEntity,
                                {
                                    attemptNumber: 2,
                                    score: 90,
                                    submissionUrl: "https://github.com/starci/completed-retry",
                                    defaultLocale: Locale.En,
                                    userChallengeSubmission: userSubmissionCompleted,
                                }),
                        )

                        const response = await post(CHALLENGE_PROGRESS_QUERY,
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.challengeSubmissionProgress
                        expect(body.success).toBe(true)
                        const tasks = body.data.completionTasks as Array<{
                            id: string
                            lastScore: number
                            maxScore: number
                            completed: boolean
                            status: string
                            numAttempts: number
                        }>
                        expect(tasks).toHaveLength(4)
                        const byId = (id: string) => tasks.find((t) => t.id === id)

                        expect(byId(challengeNotStarted.id)).toEqual({
                            id: challengeNotStarted.id,
                            lastScore: 0,
                            maxScore: 100,
                            completed: false,
                            status: "notStarted",
                            numAttempts: 0,
                        })
                        expect(byId(challengeInProgress.id)).toEqual({
                            id: challengeInProgress.id,
                            lastScore: 0,
                            maxScore: 100,
                            completed: false,
                            status: "inProgress",
                            numAttempts: 0,
                        })
                        expect(byId(challengeFailed.id)).toEqual({
                            id: challengeFailed.id,
                            lastScore: 40,
                            maxScore: 100,
                            completed: false,
                            status: "failed",
                            numAttempts: 1,
                        })
                        expect(byId(challengeCompleted.id)).toEqual({
                            id: challengeCompleted.id,
                            lastScore: 90,
                            maxScore: 100,
                            completed: true,
                            status: "completed",
                            numAttempts: 2,
                        })

                        // the projection row was actually written by the real recompute
                        const projectionRows = await entityManager.query(
                            "SELECT value FROM user_challenge_progress_projections WHERE enrollment_id = $1",
                            [enrollment.id],
                        )
                        expect(projectionRows).toHaveLength(1)
                        expect(projectionRows[0].value.completionTasks).toHaveLength(4)
                    })

                it("stale projection row (past TTL) is ignored — the real join recomputes it, not the cached lie",
                    async () => {
                        currentUser = await seedUser("kc-challenge-stale-projection")
                        const enrollment = await seedEnrollment(currentUser)
                        // no user submissions at all -> the REAL answer for every challenge
                        // is notStarted/0 -- seed a stale, WRONG cached row to prove it's
                        // ignored rather than trusted past its TTL (5 minutes)
                        await entityManager.query(
                            `INSERT INTO user_challenge_progress_projections (enrollment_id, value, updated_at)
                             VALUES ($1, $2::jsonb, now() - interval '10 minutes')`,
                            [
                                enrollment.id,
                                JSON.stringify({
                                    completionTasks: [
                                        {
                                            id: "wrong-cached-id",
                                            lastScore: 999,
                                            maxScore: 999,
                                            completed: true,
                                            status: "completed",
                                            numAttempts: 999,
                                        },
                                    ],
                                }),
                            ],
                        )

                        const response = await post(CHALLENGE_PROGRESS_QUERY,
                            course.id)

                        const tasks = response.body.data.challengeSubmissionProgress.data
                            .completionTasks as Array<{ id: string; status: string }>
                        expect(tasks).toHaveLength(4)
                        expect(tasks.every((t) => t.status === "notStarted")).toBe(true)
                        expect(tasks.some((t) => t.id === "wrong-cached-id")).toBe(false)
                    })

                it("no enrollment for this course → empty completionTasks, no join ever runs",
                    async () => {
                        currentUser = await seedUser("kc-challenge-no-enrollment")
                        // no enrollment row created at all

                        const response = await post(CHALLENGE_PROGRESS_QUERY,
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.challengeSubmissionProgress
                        expect(body.success).toBe(true)
                        expect(body.data.completionTasks).toEqual([])
                    })
            })

        describe("milestoneTaskProgress",
            () => {
                it("computes lastScore/completed/currentTask from the REAL per-task join — cache always misses",
                    async () => {
                        currentUser = await seedUser("kc-milestone-progress")
                        const enrollment = await seedEnrollment(currentUser)

                        // taskCompleted: two attempts -- DESC order must pick attemptNumber 2
                        // (score 85), not whichever was inserted last
                        const userTaskCompleted = await entityManager.save(
                            entityManager.create(UserMilestoneTaskEntity,
                                {
                                    enrollment,
                                    milestoneTask: taskCompleted,
                                }),
                        )
                        await entityManager.save(
                            entityManager.create(UserMilestoneTaskAttemptEntity,
                                {
                                    attemptNumber: 1,
                                    passed: false,
                                    score: 30,
                                    shortFeedback: "needs work",
                                    defaultLocale: Locale.En,
                                    userMilestoneTask: userTaskCompleted,
                                }),
                        )
                        await entityManager.save(
                            entityManager.create(UserMilestoneTaskAttemptEntity,
                                {
                                    attemptNumber: 2,
                                    passed: true,
                                    score: 85,
                                    shortFeedback: "great job",
                                    defaultLocale: Locale.En,
                                    userMilestoneTask: userTaskCompleted,
                                }),
                        )
                        // taskFailed: one attempt, below the 0.7 * 100 = 70 threshold
                        const userTaskFailed = await entityManager.save(
                            entityManager.create(UserMilestoneTaskEntity,
                                {
                                    enrollment,
                                    milestoneTask: taskFailed,
                                }),
                        )
                        await entityManager.save(
                            entityManager.create(UserMilestoneTaskAttemptEntity,
                                {
                                    attemptNumber: 1,
                                    passed: false,
                                    score: 50,
                                    shortFeedback: "close, try again",
                                    defaultLocale: Locale.En,
                                    userMilestoneTask: userTaskFailed,
                                }),
                        )
                        // taskNotStarted: no UserMilestoneTaskEntity row at all

                        const response = await post(MILESTONE_PROGRESS_QUERY,
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.milestoneTaskProgress
                        expect(body.success).toBe(true)
                        const tasks = body.data.completionTasks as Array<{
                            id: string
                            lastScore: number
                            maxScore: number
                            completed: boolean
                            numAttempts: number
                        }>
                        expect(tasks).toHaveLength(3)
                        const byId = (id: string) => tasks.find((t) => t.id === id)

                        expect(byId(taskCompleted.id)).toEqual({
                            id: taskCompleted.id,
                            lastScore: 85,
                            maxScore: 100,
                            completed: true,
                            numAttempts: 2,
                        })
                        expect(byId(taskFailed.id)).toEqual({
                            id: taskFailed.id,
                            lastScore: 50,
                            maxScore: 100,
                            completed: false,
                            numAttempts: 1,
                        })
                        expect(byId(taskNotStarted.id)).toEqual({
                            id: taskNotStarted.id,
                            lastScore: 0,
                            maxScore: 100,
                            completed: false,
                            numAttempts: 0,
                        })

                        // sort order is completed(0) -> failed(1) -> notStarted(2); the FIRST
                        // uncompleted one (taskFailed) must win currentTask, not taskNotStarted
                        expect(body.data.currentTask.id).toBe(taskFailed.id)

                        // proves the read went through the real compute path (cache miss)
                        // AND wrote the freshly computed result back to cache
                        expect(cacheServiceMock.get).toHaveBeenCalledWith(
                            expect.objectContaining({
                                key: CacheKey.MilestoneTaskProgress,
                                args: [enrollment.id],
                            }),
                        )
                        expect(cacheServiceMock.set).toHaveBeenCalledWith(
                            expect.objectContaining({
                                key: CacheKey.MilestoneTaskProgress,
                                args: [enrollment.id],
                            }),
                        )
                    })

                it("no enrollment for this course → empty completionTasks + null currentTask, no join ever runs",
                    async () => {
                        currentUser = await seedUser("kc-milestone-no-enrollment")
                        // no enrollment row created at all

                        const response = await post(MILESTONE_PROGRESS_QUERY,
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.milestoneTaskProgress
                        expect(body.success).toBe(true)
                        expect(body.data.completionTasks).toEqual([])
                        expect(body.data.currentTask).toBeNull()
                        // the handler short-circuits before ever touching the cache
                        expect(cacheServiceMock.get).not.toHaveBeenCalled()
                    })
            })
    })
