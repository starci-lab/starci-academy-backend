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
    CoinHistoryEntity,
    CoinSource,
    CourseEntity,
    DailyQuestCompletionEntity,
    DailyQuestKey,
    EnrollmentEntity,
    Locale,
    MockInterviewAttemptEntity,
    PricingPhase,
    PrimaryPostgreSQLModule,
    UserEntity,
    XpHistoryEntity,
    XpSource,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    DailyQuestService,
} from "@modules/bussiness"
import {
    MyDailyQuestResolver,
} from "@features/api/core/graphql/queries/dashboard/my-daily-quest/my-daily-quest.resolver"
import {
    ClaimDailyQuestRewardResolver,
} from "@features/api/core/graphql/mutations/profile/claim-daily-quest-reward/claim-daily-quest-reward.resolver"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the daily-quest flows -- `myDailyQuest` (read) and
 * `claimDailyQuestReward` (write). Neither had e2e coverage before this file;
 * `DailyQuestService` itself has no `.spec.ts` sibling at all (its heavy raw-SQL
 * TODAY-derived aggregation across `xp_histories` / `mock_interview_attempts` /
 * `daily_quest_completions` had never run against a real schema).
 *
 * MOCKED:
 *  - `KeycloakAuthGraphQLGuard` -- no Keycloak server here; overridden to stamp
 *    `request.user` with whichever fake user the test "logs in" as.
 *
 * REAL: Postgres (Testcontainers), the full GraphQL/Apollo wiring,
 * `DailyQuestService` (TODAY-derived per-task counts, the completeness gate, the
 * idempotent claim transaction, and `writeCoinHistory`'s ledger + balance credit)
 * -- all real SQL against real rows, no mocks inside the service under test.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Daily quest (e2e)",
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

        /** Read-only course/enrollment anchor fixtures, seeded once in `beforeAll`. */
        let course: CourseEntity

        const GRAPHQL_ENDPOINT = "/graphql"

        const MY_DAILY_QUEST_QUERY = `
            query MyDailyQuest {
                myDailyQuest {
                    success
                    message
                    error
                    data {
                        date
                        tasks { key current target }
                        allDone
                        claimed
                        reward
                    }
                }
            }
        `
        const CLAIM_MUTATION = `
            mutation ClaimDailyQuestReward {
                claimDailyQuestReward {
                    success
                    message
                    error
                    data { balance }
                }
            }
        `

        const postQuery = (query: string) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query,
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
                    MyDailyQuestResolver,
                    ClaimDailyQuestRewardResolver,
                    // REAL -- the TODAY-derived aggregation + claim transaction under test
                    DailyQuestService,
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
                        displayId: "fullstack-mastery-daily-quest-e2e",
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
            // course (seeded in beforeAll) is read-only across the whole suite
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"enrollments\", \"xp_histories\", "
                + "\"mock_interview_attempts\", \"daily_quest_completions\", \"coin_histories\" "
                + "RESTART IDENTITY CASCADE",
            )
            currentUser = null
            jest.clearAllMocks()
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

        /** One xp_histories row dated NOW (today, whatever "today" is when the suite runs). */
        const seedXpToday = (user: UserEntity, source: XpSource, refId: string) =>
            entityManager.save(
                entityManager.create(XpHistoryEntity,
                    {
                        user,
                        source,
                        amount: 1,
                        refId,
                    }),
            )

        /** One mock_interview_attempts row dated NOW, for the MockInterview daily task. */
        const seedMockInterviewToday = (enrollment: EnrollmentEntity) =>
            entityManager.save(
                entityManager.create(MockInterviewAttemptEntity,
                    {
                        enrollment,
                        sessionId: "11111111-1111-4111-8111-111111111111",
                        promptId: "prompt-e2e",
                        promptTitle: "e2e fixture prompt",
                        overallScore: 80,
                        verdict: "pass",
                    }),
            )

        describe("myDailyQuest",
            () => {
                it("reflects TODAY's real activity per task — partial progress, not yet allDone",
                    async () => {
                        currentUser = await seedUser("kc-daily-quest-partial")
                        await seedXpToday(currentUser,
                            XpSource.LessonRead,
                            "content-e2e-1")
                        await seedXpToday(currentUser,
                            XpSource.Challenge,
                            "attempt-e2e-1")
                        // ReviewFlashcards / MockInterview / QuizSession: no activity today

                        const response = await postQuery(MY_DAILY_QUEST_QUERY)

                        expect(response.status).toBe(200)
                        const body = response.body.data.myDailyQuest
                        expect(body.success).toBe(true)
                        expect(body.data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
                        const byKey = (key: string) =>
                            (body.data.tasks as Array<{ key: string, current: number, target: number }>)
                                .find((task) => task.key === key)
                        expect(byKey(DailyQuestKey.ReadContent)).toEqual({
                            key: DailyQuestKey.ReadContent,
                            current: 1,
                            target: 1,
                        })
                        expect(byKey(DailyQuestKey.PassChallenge)).toEqual({
                            key: DailyQuestKey.PassChallenge,
                            current: 1,
                            target: 1,
                        })
                        expect(byKey(DailyQuestKey.ReviewFlashcards)).toEqual({
                            key: DailyQuestKey.ReviewFlashcards,
                            current: 0,
                            target: 5,
                        })
                        // only 2 of the 5 tasks are done -- below the 3-task minimum
                        expect(body.data.allDone).toBe(false)
                        expect(body.data.claimed).toBe(false)
                        expect(body.data.reward).toBe(20)
                    })

                it("unauthenticated caller is BLOCKED — no aggregation query ever runs",
                    async () => {
                        const response = await postQuery(MY_DAILY_QUEST_QUERY)

                        expect(response.body.data).toBeNull()
                        expect(response.body.errors).toBeDefined()
                    })
            })

        describe("claimDailyQuestReward",
            () => {
                it("3 of 5 tasks complete → claims for real: Coin balance credited, ledger + completion rows written",
                    async () => {
                        currentUser = await seedUser("kc-daily-quest-claim")
                        const enrollment = await seedEnrollment(currentUser)
                        await seedXpToday(currentUser,
                            XpSource.LessonRead,
                            "content-e2e-claim-1")
                        await seedXpToday(currentUser,
                            XpSource.Challenge,
                            "attempt-e2e-claim-1")
                        await seedMockInterviewToday(enrollment)

                        const response = await postQuery(CLAIM_MUTATION)

                        expect(response.status).toBe(200)
                        const body = response.body.data.claimDailyQuestReward
                        expect(body.success).toBe(true)
                        expect(body.data.balance).toBe(20)

                        const reloadedUser = await entityManager.findOneOrFail(UserEntity,
                            {
                                where: {
                                    id: currentUser.id,
                                },
                            })
                        expect(reloadedUser.coinBalance).toBe(20)

                        const completion = await entityManager.findOneOrFail(
                            DailyQuestCompletionEntity,
                            {
                                where: {
                                    user: {
                                        id: currentUser.id,
                                    },
                                },
                            },
                        )
                        expect(completion.coinReward).toBe(20)

                        const ledgerRow = await entityManager.findOneOrFail(
                            CoinHistoryEntity,
                            {
                                where: {
                                    user: {
                                        id: currentUser.id,
                                    },
                                    source: CoinSource.DailyQuest,
                                },
                            },
                        )
                        expect(ledgerRow.points).toBe(20)
                    })

                it("fewer than 3 tasks complete → DailyQuestNotCompleteException, nothing granted",
                    async () => {
                        currentUser = await seedUser("kc-daily-quest-incomplete")
                        // no activity seeded at all today

                        const response = await postQuery(CLAIM_MUTATION)

                        expect(response.status).toBe(200)
                        const body = response.body.data.claimDailyQuestReward
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("DAILY_QUEST_NOT_COMPLETE_EXCEPTION")

                        const reloadedUser = await entityManager.findOneOrFail(UserEntity,
                            {
                                where: {
                                    id: currentUser.id,
                                },
                            })
                        expect(reloadedUser.coinBalance).toBe(0)
                        const completionCount = await entityManager.count(DailyQuestCompletionEntity)
                        expect(completionCount).toBe(0)
                    })
            })
    })
