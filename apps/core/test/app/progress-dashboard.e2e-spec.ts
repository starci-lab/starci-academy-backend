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
    UserContentEntity,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    ChallengeProgressService,
    PersonalProjectProgressService,
} from "@modules/bussiness"
import {
    CacheService,
} from "@modules/cache"
import {
    MountStorageService,
} from "@modules/filesystem"
import {
    S3NameResolverService,
    S3ReadService,
} from "@modules/s3"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    toGlobalId,
} from "@modules/routing"
import {
    MyInProgressChallengesResolver,
} from "@features/api/core/graphql/queries/dashboard/my-in-progress-challenges/my-in-progress-challenges.resolver"
import {
    MyCourseOutlineResolver,
} from "@features/api/core/graphql/queries/learner-cms/my-course-outline/my-course-outline.resolver"
import {
    MyCourseOutlineService,
} from "@features/api/core/graphql/queries/learner-cms/my-course-outline/my-course-outline.service"
import {
    MyCourseOutlineHandler,
} from "@features/api/core/graphql/queries/learner-cms/my-course-outline/my-course-outline.handler"
import {
    CourseHandler,
} from "@features/api/core/graphql/queries/courses/course/course.handler"
import {
    MilestonesHandler,
} from "@features/api/core/graphql/queries/milestones/milestones/milestones.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Fraction of max score an attempt must reach to pass. */
const PASS_THRESHOLD = 0.7

/**
 * e2e for two learner-dashboard READ queries — `myInProgressChallenges` (rail
 * list) and `myCourseOutline` (the full module/lesson/challenge + milestone/
 * task tree with progress overlaid) — over REAL HTTP + REAL Postgres
 * (Testcontainers). Neither had e2e coverage; `progress-query.e2e-spec.ts`
 * covers the two lower-level progress READS (`challengeSubmissionProgress` /
 * `milestoneTaskProgress`) these two queries build on top of.
 *
 * MOCKED (no external infra available in this harness, and the true system
 * boundary these read paths stop at):
 *  - `S3ReadService.json` — `myCourseOutline`'s course tree is S3-sourced
 *    (`CourseHandler`); stubbed to hand back a canned tree whose ids match the
 *    REAL DB rows seeded below, so the progress/read-flag overlay is asserted
 *    against a real join, not a hand-picked stub.
 *  - `ElasticsearchService` — the milestone tree is ES-sourced
 *    (`MilestonesHandler`); stubbed to `client.search` returning a canned hit
 *    whose milestone/task ids likewise match the real seeded rows.
 *  - `CacheService` — real class talks to Redis; stubbed to always miss, so
 *    `PersonalProjectProgressService` exercises its real DB computation.
 *  - `MountStorageService` — real class reads a mounted app-config file for
 *    the pass threshold; stubbed to a fixed 0.7 (matches
 *    `progress-query.e2e-spec.ts`).
 *
 * REAL: Postgres (Testcontainers), both resolvers under test, the CQRS
 * `QueryBus` + all three query handlers (`MyCourseOutlineHandler`,
 * `CourseHandler`, `MilestonesHandler`), `ChallengeProgressService` (its real
 * `user_challenge_progress_projections` UPSERT + TTL lazy-refresh),
 * `PersonalProjectProgressService`'s real per-task join, and
 * `KeycloakAuthGraphQLGuard` — overridden only to stamp `request.user`.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Learner-dashboard read queries — myInProgressChallenges / myCourseOutline (e2e)",
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
        const cacheServiceMock = {
            get: jest.fn().mockResolvedValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        }
        const s3ReadServiceMock = {
            json: jest.fn(),
        }
        const elasticsearchServiceMock = {
            indicateName: jest.fn(() => "milestones-index"),
            client: {
                search: jest.fn(),
            },
        }

        const GRAPHQL_ENDPOINT = "/graphql"

        /** Fixture ids shared by every test (seeded once — read-only material). */
        let course: CourseEntity
        let courseModule: ModuleEntity
        let content: ContentEntity
        let challenge: ChallengeEntity
        let failedChallenge: ChallengeEntity
        let failedSubmission: ChallengeSubmissionEntity
        let milestone: MilestoneEntity
        let task: MilestoneTaskEntity

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
                    // QueryBus + @QueryHandler discovery for all three handlers below
                    CqrsModule,
                ],
                providers: [
                    // REAL — the two resolvers under test
                    MyInProgressChallengesResolver,
                    MyCourseOutlineResolver,
                    MyCourseOutlineService,
                    // REAL — the CQRS handlers myCourseOutline assembles from
                    MyCourseOutlineHandler,
                    CourseHandler,
                    MilestonesHandler,
                    // REAL — the joins under test
                    ChallengeProgressService,
                    PersonalProjectProgressService,
                    // real, pure — computes the S3 object key (return value unused by
                    // the mocked S3ReadService.json below)
                    S3NameResolverService,
                    {
                        provide: S3ReadService,
                        useValue: s3ReadServiceMock,
                    },
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearchServiceMock,
                    },
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
                        displayId: "fullstack-mastery-progress-dashboard-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            courseModule = await entityManager.save(
                entityManager.create(ModuleEntity,
                    {
                        title: "Module 1",
                        displayId: "module-1-progress-dashboard-e2e",
                        description: "e2e fixture module",
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            content = await entityManager.save(
                entityManager.create(ContentEntity,
                    {
                        title: "Lesson 1",
                        displayId: "lesson-1-progress-dashboard-e2e",
                        body: "unused",
                        defaultLocale: Locale.En,
                        isPremium: false,
                        module: courseModule,
                    }),
            )
            challenge = await entityManager.save(
                entityManager.create(ChallengeEntity,
                    {
                        title: "Ship the endpoint",
                        displayId: "ship-the-endpoint-progress-dashboard-e2e",
                        description: "e2e fixture challenge",
                        score: 100,
                        difficulty: ChallengeDifficulty.Medium,
                        sortIndex: 0,
                        defaultLocale: Locale.En,
                        content,
                    }),
            )
            // a SECOND challenge (same course) that stays permanently failable — the
            // mutable UserChallengeSubmission(+attempt) rows a test seeds on it are
            // cleaned by afterEach's enrollment CASCADE; the requirement row itself
            // is read-only fixture material, exactly like `challenge` above.
            failedChallenge = await entityManager.save(
                entityManager.create(ChallengeEntity,
                    {
                        title: "Failed Challenge",
                        displayId: "failed-challenge-progress-dashboard-e2e",
                        description: "e2e fixture challenge",
                        score: 100,
                        difficulty: ChallengeDifficulty.Medium,
                        sortIndex: 1,
                        defaultLocale: Locale.En,
                        content,
                    }),
            )
            failedSubmission = await entityManager.save(
                entityManager.create(ChallengeSubmissionEntity,
                    {
                        type: SubmissionType.GithubUrl,
                        title: "Submission",
                        score: 100,
                        orderIndex: 0,
                        challenge: failedChallenge,
                    }),
            )
            milestone = await entityManager.save(
                entityManager.create(MilestoneEntity,
                    {
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            task = await entityManager.save(
                entityManager.create(MilestoneTaskEntity,
                    {
                        displayId: "task-1-progress-dashboard-e2e",
                        title: "Task 1",
                        maxScore: 100,
                        sortIndex: 0,
                        defaultLocale: Locale.En,
                        milestone,
                    }),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // course/module/content/challenge/milestone/task fixtures (seeded in
            // beforeAll) are read-only across the whole suite; enrollments CASCADE-
            // truncates every mutable row this suite writes.
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"enrollments\" RESTART IDENTITY CASCADE",
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

        describe("myInProgressChallenges",
            () => {
                const IN_PROGRESS_QUERY = `
                    query MyInProgressChallenges {
                        myInProgressChallenges {
                            success
                            error
                            data { globalId label }
                        }
                    }
                `

                it("lists InProgress + Failed challenges (started but not passed); NotStarted never appears",
                    async () => {
                        const user = await seedUser("kc-in-progress-happy")
                        const enrollment = await seedEnrollment(user)
                        currentUser = user

                        // the shared fixture `challenge` has no submission at all →
                        // NotStarted, correctly excluded from the rail. `failedChallenge`
                        // gets one failing attempt here → Failed, which SHOULD appear.
                        const userSubmission = await entityManager.save(
                            entityManager.create(UserChallengeSubmissionEntity,
                                {
                                    enrollment,
                                    submission: failedSubmission,
                                    submissionUrl: "https://github.com/starci/failed",
                                }),
                        )
                        await entityManager.save(
                            entityManager.create(UserChallengeSubmissionAttemptEntity,
                                {
                                    attemptNumber: 1,
                                    // below the 0.7 pass threshold (40 < 70)
                                    score: 40,
                                    submissionUrl: "https://github.com/starci/failed",
                                    defaultLocale: Locale.En,
                                    userChallengeSubmission: userSubmission,
                                }),
                        )

                        const response = await post(IN_PROGRESS_QUERY,
                            {
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.myInProgressChallenges
                        expect(body.success).toBe(true)
                        const items = body.data as Array<{ globalId: string, label: string }>
                        expect(items).toHaveLength(1)
                        expect(items[0]).toEqual({
                            globalId: toGlobalId(ChallengeEntity.name,
                                failedChallenge.id),
                            label: "Failed Challenge",
                        })
                    })

                it("viewer with NO enrollments at all → empty rail, no challenge join ever runs",
                    async () => {
                        currentUser = await seedUser("kc-in-progress-no-enrollment")
                        // no enrollment row created at all

                        const response = await post(IN_PROGRESS_QUERY,
                            {
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.myInProgressChallenges
                        expect(body.success).toBe(true)
                        expect(body.data).toEqual([])
                    })
            })

        describe("myCourseOutline",
            () => {
                const OUTLINE_QUERY = `
                    query MyCourseOutline($request: MyCourseOutlineRequest!) {
                        myCourseOutline(request: $request) {
                            success
                            error
                            data {
                                course { id title displayId }
                                modules {
                                    id
                                    lessons {
                                        id
                                        isRead
                                        challenges { id status completed }
                                    }
                                }
                                milestones {
                                    id
                                    tasks { id completed }
                                }
                                progress {
                                    lessonsRead
                                    lessonsTotal
                                    challengesCompleted
                                    challengesTotal
                                    tasksCompleted
                                    tasksTotal
                                    completionPercent
                                }
                                currentTask { kind id milestoneId }
                                nextContentTask { kind id milestoneId }
                            }
                        }
                    }
                `

                /** The S3-sourced course tree, ids matching the real DB fixtures above. */
                const mockCourseTree = () => ({
                    id: course.id,
                    title: course.title,
                    displayId: course.displayId,
                    modules: [
                        {
                            id: courseModule.id,
                            title: courseModule.title,
                            orderIndex: 0,
                            sortIndex: 0,
                            isPremium: false,
                            contents: [
                                {
                                    id: content.id,
                                    displayId: content.displayId,
                                    title: content.title,
                                    minutesRead: 5,
                                    difficulty: null,
                                    isPremium: false,
                                    sortIndex: 0,
                                    challenges: [
                                        {
                                            id: challenge.id,
                                            title: challenge.title,
                                            difficulty: ChallengeDifficulty.Medium,
                                            score: 100,
                                            sortIndex: 0,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                })

                /** The ES-sourced milestone tree, ids matching the real DB fixtures above. */
                const mockMilestoneHits = () => ({
                    hits: {
                        hits: [
                            {
                                _source: {
                                    id: milestone.id,
                                    title: "Capstone",
                                    orderIndex: 0,
                                    sortIndex: 0,
                                    tasks: [
                                        {
                                            id: task.id,
                                            title: task.title,
                                            type: null,
                                            maxScore: 100,
                                            sortIndex: 0,
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                })

                it("assembles the real module/lesson/challenge + milestone/task tree with progress overlaid",
                    async () => {
                        const user = await seedUser("kc-outline-happy")
                        const enrollment = await seedEnrollment(user)
                        currentUser = user
                        s3ReadServiceMock.json.mockResolvedValueOnce(mockCourseTree())
                        elasticsearchServiceMock.client.search.mockResolvedValueOnce(mockMilestoneHits())
                        // lesson marked read; challenge + task both left untouched
                        await entityManager.save(
                            entityManager.create(UserContentEntity,
                                {
                                    enrollment,
                                    content,
                                    isRead: true,
                                }),
                        )

                        const response = await post(OUTLINE_QUERY,
                            {
                                request: {
                                    courseId: course.id,
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.myCourseOutline
                        expect(body.success).toBe(true)
                        const data = body.data
                        expect(data.course).toEqual({
                            id: course.id,
                            title: course.title,
                            displayId: course.displayId,
                        })
                        expect(data.modules[0].lessons[0].isRead).toBe(true)
                        expect(data.modules[0].lessons[0].challenges[0]).toEqual({
                            id: challenge.id,
                            status: "notStarted",
                            completed: false,
                        })
                        expect(data.milestones[0].tasks[0]).toEqual({
                            id: task.id,
                            completed: false,
                        })
                        expect(data.progress).toEqual({
                            lessonsRead: 1,
                            lessonsTotal: 1,
                            challengesCompleted: 0,
                            challengesTotal: 1,
                            tasksCompleted: 0,
                            tasksTotal: 1,
                            // (1 [lessons] + 0 [challenges] + 0 [tasks]) / 3 = 33%
                            completionPercent: 33,
                        })
                        // capstone task is not yet completed → it wins currentTask over
                        // the (already-read) lesson fallback
                        expect(data.currentTask).toEqual({
                            kind: "milestoneTask",
                            id: task.id,
                            milestoneId: milestone.id,
                        })
                        // nextContentTask NEVER points to a milestone task: the lesson
                        // is read, so it falls through to the first uncompleted challenge
                        expect(data.nextContentTask).toEqual({
                            kind: "challenge",
                            id: challenge.id,
                            milestoneId: null,
                        })
                    })

                it("neither enrolled nor a resolvable course → ENROLLMENT_NOT_FOUND_EXCEPTION, no S3/ES read ever happens",
                    async () => {
                        currentUser = await seedUser("kc-outline-not-found")
                        // no enrollment, and this id resolves to no real course row

                        const response = await post(OUTLINE_QUERY,
                            {
                                request: {
                                    courseId: "11111111-1111-4111-8111-111111111111",
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.myCourseOutline
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("ENROLLMENT_NOT_FOUND_EXCEPTION")
                        expect(s3ReadServiceMock.json).not.toHaveBeenCalled()
                        expect(elasticsearchServiceMock.client.search).not.toHaveBeenCalled()
                    })
            })
    })
