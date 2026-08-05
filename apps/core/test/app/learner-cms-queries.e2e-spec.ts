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
    SubmissionFeedbackSeverity,
    MilestoneSeverity,
    UserChallengeSubmissionAttemptEntity,
    UserChallengeSubmissionEntity,
    UserChallengeSubmissionFeedbackEntity,
    UserEntity,
    UserMilestoneTaskAttemptEntity,
    UserMilestoneTaskAttemptFeedbackEntity,
    UserMilestoneTaskEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    ChallengeSubmissionsCmsService,
    LearningFeedbacksCmsService,
    MilestoneTaskAttemptsCmsService,
} from "@modules/bussiness"
import {
    MyChallengeSubmissionsResolver,
} from "@features/api/core/graphql/queries/learner-cms/my-challenge-submissions/my-challenge-submissions.resolver"
import {
    MyMilestoneTaskAttemptsResolver,
} from "@features/api/core/graphql/queries/learner-cms/my-milestone-task-attempts/my-milestone-task-attempts.resolver"
import {
    MyLearningFeedbacksResolver,
} from "@features/api/core/graphql/queries/learner-cms/my-learning-feedbacks/my-learning-feedbacks.resolver"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the learner-CMS "my history" reads -- `myChallengeSubmissions`,
 * `myMilestoneTaskAttempts`, `myLearningFeedbacks`. All three are the LIST
 * exception (plain paginated reads keyed by the viewer, no CQRS projection),
 * so this drives the real resolver + service + raw-SQL join against
 * Testcontainers Postgres and asserts the GraphQL response against what the
 * REAL join computes.
 *
 * MOCKED: nothing beyond the Keycloak guard (stamped with whichever fake user
 * the test "logs in" as) -- every other piece (Apollo, Postgres, the three
 * services) is real.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Learner-CMS 'my history' reads (e2e)",
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

        /** Read-only course/challenge/milestone fixtures, seeded once in `beforeAll`. */
        let course: CourseEntity
        let challengeOne: ChallengeEntity
        let challengeTwo: ChallengeEntity
        let submissionOne: ChallengeSubmissionEntity
        let submissionTwo: ChallengeSubmissionEntity
        let taskOne: MilestoneTaskEntity
        let taskTwo: MilestoneTaskEntity

        const GRAPHQL_ENDPOINT = "/graphql"

        const CHALLENGE_SUBMISSIONS_QUERY = `
            query MyChallengeSubmissions($limit: Int, $offset: Int) {
                myChallengeSubmissions(limit: $limit, offset: $offset) {
                    success
                    error
                    data {
                        total
                        items {
                            id
                            challengeTitle
                            courseTitle
                            status
                            score
                            submissionUrl
                        }
                    }
                }
            }
        `
        const MILESTONE_TASK_ATTEMPTS_QUERY = `
            query MyMilestoneTaskAttempts($limit: Int, $offset: Int) {
                myMilestoneTaskAttempts(limit: $limit, offset: $offset) {
                    success
                    error
                    data {
                        total
                        items {
                            id
                            taskTitle
                            milestoneTitle
                            courseTitle
                            passed
                            score
                        }
                    }
                }
            }
        `
        const LEARNING_FEEDBACKS_QUERY = `
            query MyLearningFeedbacks($limit: Int, $offset: Int) {
                myLearningFeedbacks(limit: $limit, offset: $offset) {
                    success
                    error
                    data {
                        total
                        items {
                            id
                            source
                            title
                            courseTitle
                            summary
                        }
                    }
                }
            }
        `

        const post = (query: string, variables: Record<string, unknown> = {
        }) =>
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
                    MyChallengeSubmissionsResolver,
                    ChallengeSubmissionsCmsService,
                    MyMilestoneTaskAttemptsResolver,
                    MilestoneTaskAttemptsCmsService,
                    MyLearningFeedbacksResolver,
                    LearningFeedbacksCmsService,
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
                        displayId: "fullstack-mastery-learner-cms-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            const courseModule = await entityManager.save(
                entityManager.create(ModuleEntity,
                    {
                        title: "Module 1",
                        displayId: "module-1-learner-cms-e2e",
                        description: "e2e fixture module",
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            const content = await entityManager.save(
                entityManager.create(ContentEntity,
                    {
                        title: "Lesson 1",
                        displayId: "lesson-1-learner-cms-e2e",
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
            challengeOne = await makeChallenge("challenge-one-learner-cms",
                0)
            challengeTwo = await makeChallenge("challenge-two-learner-cms",
                1)

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
            submissionOne = await makeSubmission(challengeOne)
            submissionTwo = await makeSubmission(challengeTwo)

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
            taskOne = await makeTask("task-one-learner-cms",
                0)
            taskTwo = await makeTask("task-two-learner-cms",
                1)
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // user_challenge_submissions(+attempts+feedbacks) cascade from users;
            // user_milestone_tasks(+attempts+feedbacks) cascade from enrollments.
            // Challenge/submission/milestone/task fixtures (seeded in beforeAll)
            // are read-only across the whole suite.
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"enrollments\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
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

        describe("myChallengeSubmissions",
            () => {
                it("returns the viewer's attempts newest-first with the REAL derived status",
                    async () => {
                        currentUser = await seedUser("kc-mycms-challenge-happy")

                        // attempt 1: pending (no processedAt yet)
                        const ucsPending = await entityManager.save(
                            entityManager.create(UserChallengeSubmissionEntity,
                                {
                                    user: currentUser,
                                    submission: submissionOne,
                                    submissionUrl: "https://github.com/starci/pending",
                                }),
                        )
                        await entityManager.save(
                            entityManager.create(UserChallengeSubmissionAttemptEntity,
                                {
                                    attemptNumber: 1,
                                    score: null,
                                    submissionUrl: "https://github.com/starci/pending",
                                    processedAt: null,
                                    defaultLocale: Locale.En,
                                    userChallengeSubmission: ucsPending,
                                }),
                        )

                        // attempt 2: passed (processed, score > 0)
                        const ucsPassed = await entityManager.save(
                            entityManager.create(UserChallengeSubmissionEntity,
                                {
                                    user: currentUser,
                                    submission: submissionTwo,
                                    submissionUrl: "https://github.com/starci/passed",
                                }),
                        )
                        await entityManager.save(
                            entityManager.create(UserChallengeSubmissionAttemptEntity,
                                {
                                    attemptNumber: 1,
                                    score: 90,
                                    submissionUrl: "https://github.com/starci/passed",
                                    processedAt: new Date(),
                                    defaultLocale: Locale.En,
                                    userChallengeSubmission: ucsPassed,
                                }),
                        )

                        const response = await post(CHALLENGE_SUBMISSIONS_QUERY,
                            {
                                limit: 10,
                                offset: 0,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.myChallengeSubmissions
                        expect(body.success).toBe(true)
                        expect(body.data.total).toBe(2)
                        const items = body.data.items as Array<{
                            challengeTitle: string
                            status: string
                            score: number
                        }>
                        expect(items).toHaveLength(2)
                        const byUrl = (score: number) => items.find((item) => item.score === score)
                        expect(byUrl(0)?.status).toBe("pending")
                        expect(byUrl(90)?.status).toBe("passed")
                    })

                it("no user attached to the request → guard denies before the resolver ever runs",
                    async () => {
                        // currentUser stays null -- the fake guard returns false
                        const response = await post(CHALLENGE_SUBMISSIONS_QUERY,
                            {
                                limit: 10,
                                offset: 0,
                            })

                        // a guard rejection surfaces as a GraphQL transport error
                        // (data: null, errors present) -- NOT the interceptor's
                        // {success:false} body, since guards run before interceptors
                        expect(response.body.data).toBeNull()
                        expect(response.body.errors).toBeDefined()
                        expect(response.body.errors.length).toBeGreaterThan(0)
                    })
            })

        describe("myMilestoneTaskAttempts",
            () => {
                it("returns the viewer's review attempts newest-first from the REAL join",
                    async () => {
                        currentUser = await seedUser("kc-mycms-milestone-happy")
                        const enrollment = await seedEnrollment(currentUser)

                        const userTaskOne = await entityManager.save(
                            entityManager.create(UserMilestoneTaskEntity,
                                {
                                    enrollment,
                                    milestoneTask: taskOne,
                                }),
                        )
                        await entityManager.save(
                            entityManager.create(UserMilestoneTaskAttemptEntity,
                                {
                                    attemptNumber: 1,
                                    passed: false,
                                    score: 40,
                                    shortFeedback: "needs work",
                                    defaultLocale: Locale.En,
                                    userMilestoneTask: userTaskOne,
                                }),
                        )
                        const userTaskTwo = await entityManager.save(
                            entityManager.create(UserMilestoneTaskEntity,
                                {
                                    enrollment,
                                    milestoneTask: taskTwo,
                                }),
                        )
                        await entityManager.save(
                            entityManager.create(UserMilestoneTaskAttemptEntity,
                                {
                                    attemptNumber: 1,
                                    passed: true,
                                    score: 95,
                                    shortFeedback: "great job",
                                    defaultLocale: Locale.En,
                                    userMilestoneTask: userTaskTwo,
                                }),
                        )

                        const response = await post(MILESTONE_TASK_ATTEMPTS_QUERY,
                            {
                                limit: 10,
                                offset: 0,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.myMilestoneTaskAttempts
                        expect(body.success).toBe(true)
                        expect(body.data.total).toBe(2)
                        const items = body.data.items as Array<{ passed: boolean, score: number }>
                        expect(items).toHaveLength(2)
                        expect(items.some((item) => item.passed && item.score === 95)).toBe(true)
                        expect(items.some((item) => !item.passed && item.score === 40)).toBe(true)
                    })

                it("hostile negative limit/offset are CLAMPED, not honoured verbatim",
                    async () => {
                        currentUser = await seedUser("kc-mycms-milestone-clamp")
                        const enrollment = await seedEnrollment(currentUser)

                        // 2 attempts exist, but limit is clamped to a floor of 1 --
                        // the page shrinks while `total` still reports the real count
                        for (const task of [
                            taskOne,
                            taskTwo,
                        ]) {
                            const userTask = await entityManager.save(
                                entityManager.create(UserMilestoneTaskEntity,
                                    {
                                        enrollment,
                                        milestoneTask: task,
                                    }),
                            )
                            await entityManager.save(
                                entityManager.create(UserMilestoneTaskAttemptEntity,
                                    {
                                        attemptNumber: 1,
                                        passed: true,
                                        score: 80,
                                        shortFeedback: "ok",
                                        defaultLocale: Locale.En,
                                        userMilestoneTask: userTask,
                                    }),
                            )
                        }

                        const response = await post(MILESTONE_TASK_ATTEMPTS_QUERY,
                            {
                                limit: -5,
                                offset: -10,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.myMilestoneTaskAttempts
                        expect(body.success).toBe(true)
                        // limit clamps to a floor of 1 (never 0, never negative)
                        expect(body.data.items).toHaveLength(1)
                        // total ignores the page window entirely
                        expect(body.data.total).toBe(2)
                    })
            })

        describe("myLearningFeedbacks",
            () => {
                it("merges challenge + milestone-task feedback newest-first across both sources",
                    async () => {
                        currentUser = await seedUser("kc-mycms-feedback-happy")
                        const enrollment = await seedEnrollment(currentUser)

                        // challenge-submission feedback source
                        const ucs = await entityManager.save(
                            entityManager.create(UserChallengeSubmissionEntity,
                                {
                                    user: currentUser,
                                    submission: submissionOne,
                                    submissionUrl: "https://github.com/starci/feedback",
                                }),
                        )
                        const ucsAttempt = await entityManager.save(
                            entityManager.create(UserChallengeSubmissionAttemptEntity,
                                {
                                    attemptNumber: 1,
                                    score: 60,
                                    submissionUrl: "https://github.com/starci/feedback",
                                    processedAt: new Date(),
                                    defaultLocale: Locale.En,
                                    userChallengeSubmission: ucs,
                                }),
                        )
                        await entityManager.save(
                            entityManager.create(UserChallengeSubmissionFeedbackEntity,
                                {
                                    message: "Fix the off-by-one in the loop",
                                    severity: SubmissionFeedbackSeverity.Medium,
                                    orderIndex: 0,
                                    sortIndex: 0,
                                    attempt: ucsAttempt,
                                    defaultLocale: Locale.En,
                                }),
                        )

                        // milestone-task feedback source
                        const userTask = await entityManager.save(
                            entityManager.create(UserMilestoneTaskEntity,
                                {
                                    enrollment,
                                    milestoneTask: taskOne,
                                }),
                        )
                        const taskAttempt = await entityManager.save(
                            entityManager.create(UserMilestoneTaskAttemptEntity,
                                {
                                    attemptNumber: 1,
                                    passed: false,
                                    score: 50,
                                    shortFeedback: "close",
                                    defaultLocale: Locale.En,
                                    userMilestoneTask: userTask,
                                }),
                        )
                        await entityManager.save(
                            entityManager.create(UserMilestoneTaskAttemptFeedbackEntity,
                                {
                                    message: "Missing the edge-case handler",
                                    severity: MilestoneSeverity.High,
                                    orderIndex: 0,
                                    sortIndex: 0,
                                    attempt: taskAttempt,
                                    defaultLocale: Locale.En,
                                }),
                        )

                        const response = await post(LEARNING_FEEDBACKS_QUERY,
                            {
                                limit: 10,
                                offset: 0,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.myLearningFeedbacks
                        expect(body.success).toBe(true)
                        expect(body.data.total).toBe(2)
                        const items = body.data.items as Array<{ source: string, summary: string }>
                        expect(items).toHaveLength(2)
                        expect(items.some((item) => item.source === "challenge"
                            && item.summary === "Fix the off-by-one in the loop")).toBe(true)
                        expect(items.some((item) => item.source === "task"
                            && item.summary === "Missing the edge-case handler")).toBe(true)
                    })

                it("no user attached to the request → guard denies before the resolver ever runs",
                    async () => {
                        const response = await post(LEARNING_FEEDBACKS_QUERY,
                            {
                                limit: 10,
                                offset: 0,
                            })

                        expect(response.body.data).toBeNull()
                        expect(response.body.errors).toBeDefined()
                        expect(response.body.errors.length).toBeGreaterThan(0)
                    })
            })
    })
