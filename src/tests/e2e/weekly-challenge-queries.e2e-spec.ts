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
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    ChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/challenge-submission.entity"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    UserChallengeSubmissionAttemptEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission-attempt.entity"
import {
    UserChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ChallengeDifficulty,
} from "@modules/databases/postgresql/primary/enums/challenge-difficulty"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    SubmissionType,
} from "@modules/databases/postgresql/primary/enums/submission-type"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-optional-auth-graphql.guard"
import {
    WeeklyChallengeService,
} from "@modules/bussiness/weekly-challenge/weekly-challenge.service"
import {
    WeeklyChallengeResolver,
} from "@features/api/core/graphql/queries/dashboard/weekly-challenge/weekly-challenge.resolver"
import {
    ClaimWeeklyChallengeRewardResolver,
} from "@features/api/core/graphql/mutations/profile/claim-weekly-challenge-reward/claim-weekly-challenge-reward.resolver"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the weekly-challenge event -- `weeklyChallenge` (the current ISO
 * week's auto-rotated challenge + leaderboard, optional-auth) and
 * `claimWeeklyChallengeReward` (claims the Coin reward once the viewer has
 * passed it this week). Drives the real {@link WeeklyChallengeService}
 * against Testcontainers Postgres.
 *
 * Every test seeds its OWN challenge fixture (rather than a shared `beforeAll`
 * one) because the picker's `total` challenge count changes the deterministic
 * OFFSET math -- keeping exactly one challenge per test keeps the pick
 * unconditionally deterministic regardless of the real calendar week.
 *
 * MOCKED: nothing beyond the two Keycloak guards. Postgres, Apollo, and the
 * service are all real.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Weekly challenge event (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager

        /** The "logged in" user the overridden Keycloak guards stamp onto the request. */
        let currentUser: UserEntity | null = null

        // weeklyChallenge uses the OPTIONAL guard -- always lets the request through,
        // stamping req.user only when a fake "session" is set
        const fakeOptionalAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                if (currentUser) {
                    gqlContext.req.user = currentUser
                }
                return true
            },
        }
        // claimWeeklyChallengeReward uses the REQUIRED guard -- denies with no user
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

        const GRAPHQL_ENDPOINT = "/graphql"

        const WEEKLY_CHALLENGE_QUERY = `
            query WeeklyChallenge {
                weeklyChallenge {
                    success
                    error
                    data {
                        title
                        viewerPassed
                        passedCount
                        claimed
                        coinReward
                        leaderboard {
                            username
                        }
                    }
                }
            }
        `
        const CLAIM_WEEKLY_CHALLENGE_REWARD_MUTATION = `
            mutation ClaimWeeklyChallengeReward {
                claimWeeklyChallengeReward {
                    success
                    error
                    data {
                        coinReward
                        balance
                    }
                }
            }
        `

        const post = (query: string) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query,
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
                ],
                providers: [
                    WeeklyChallengeResolver,
                    ClaimWeeklyChallengeRewardResolver,
                    WeeklyChallengeService,
                ],
            })
                .overrideGuard(KeycloakOptionalAuthGraphQLGuard)
                .useValue(fakeOptionalAuthGuard)
                .overrideGuard(KeycloakAuthGraphQLGuard)
                .useValue(fakeAuthGuard)
                .compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // courses cascades through modules -> contents -> challenges ->
            // challenge_submissions -> user_challenge_submissions -> attempts;
            // users cascades xp/coin histories + weekly_challenge_claims.
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"courses\" RESTART IDENTITY CASCADE",
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

        /**
         * Seed exactly ONE challenge (with its course/module/content chain) -- with
         * `total = 1`, the deterministic OFFSET pick always lands on this challenge
         * regardless of the real ISO week.
         */
        const seedTheOnlyChallenge = async (
            displayId: string,
        ): Promise<ChallengeEntity> => {
            const course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: `${displayId}-course`,
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            const courseModule = await entityManager.save(
                entityManager.create(ModuleEntity,
                    {
                        title: "Module 1",
                        displayId: `${displayId}-module`,
                        description: "e2e fixture module",
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            const content = await entityManager.save(
                entityManager.create(ContentEntity,
                    {
                        title: "Lesson 1",
                        displayId: `${displayId}-lesson`,
                        body: "unused",
                        defaultLocale: Locale.En,
                        module: courseModule,
                    }),
            )
            return entityManager.save(
                entityManager.create(ChallengeEntity,
                    {
                        title: "Weekly Featured Challenge",
                        displayId,
                        description: "e2e fixture challenge",
                        score: 100,
                        difficulty: ChallengeDifficulty.Medium,
                        sortIndex: 0,
                        defaultLocale: Locale.En,
                        content,
                    }),
            )
        }

        const seedPassingAttempt = async (
            user: UserEntity,
            challenge: ChallengeEntity,
        ): Promise<void> => {
            const submission = await entityManager.save(
                entityManager.create(ChallengeSubmissionEntity,
                    {
                        type: SubmissionType.GithubUrl,
                        title: "Submission",
                        score: 100,
                        orderIndex: 0,
                        challenge,
                    }),
            )
            const ucs = await entityManager.save(
                entityManager.create(UserChallengeSubmissionEntity,
                    {
                        user,
                        submission,
                        submissionUrl: "https://github.com/starci/weekly-pass",
                    }),
            )
            await entityManager.save(
                entityManager.create(UserChallengeSubmissionAttemptEntity,
                    {
                        attemptNumber: 1,
                        score: 90,
                        submissionUrl: "https://github.com/starci/weekly-pass",
                        processedAt: new Date(),
                        defaultLocale: Locale.En,
                        userChallengeSubmission: ucs,
                    }),
            )
        }

        describe("weeklyChallenge",
            () => {
                it("authed viewer who passed sees viewerPassed + the leaderboard entry, from the REAL join",
                    async () => {
                        const challenge = await seedTheOnlyChallenge("weekly-happy")
                        currentUser = await seedUser("kc-weekly-happy")
                        currentUser.username = "weekly-passer"
                        await entityManager.save(currentUser)
                        await seedPassingAttempt(currentUser,
                            challenge)

                        const response = await post(WEEKLY_CHALLENGE_QUERY)

                        expect(response.status).toBe(200)
                        const body = response.body.data.weeklyChallenge
                        expect(body.success).toBe(true)
                        expect(body.data.title).toBe("Weekly Featured Challenge")
                        expect(body.data.viewerPassed).toBe(true)
                        expect(body.data.passedCount).toBe(1)
                        expect(body.data.claimed).toBe(false)
                        expect(body.data.coinReward).toBe(40)
                        expect(body.data.leaderboard).toHaveLength(1)
                        expect(body.data.leaderboard[0].username).toBe("weekly-passer")
                    })

                it("no challenges exist at all → data is null, no join ever runs",
                    async () => {
                        // no challenge seeded this test -- the candidate pool is empty
                        currentUser = await seedUser("kc-weekly-no-challenges")

                        const response = await post(WEEKLY_CHALLENGE_QUERY)

                        expect(response.status).toBe(200)
                        const body = response.body.data.weeklyChallenge
                        expect(body.success).toBe(true)
                        expect(body.data).toBeNull()
                    })
            })

        describe("claimWeeklyChallengeReward",
            () => {
                it("credits the REAL Coin balance once the viewer has passed this week's challenge",
                    async () => {
                        const challenge = await seedTheOnlyChallenge("weekly-claim-happy")
                        currentUser = await seedUser("kc-weekly-claim-happy")
                        await seedPassingAttempt(currentUser,
                            challenge)

                        const response = await post(CLAIM_WEEKLY_CHALLENGE_REWARD_MUTATION)

                        expect(response.status).toBe(200)
                        const body = response.body.data.claimWeeklyChallengeReward
                        expect(body.success).toBe(true)
                        expect(body.data.coinReward).toBe(40)
                        expect(body.data.balance).toBe(40)

                        const reloaded = await entityManager.findOneOrFail(UserEntity,
                            {
                                where: {
                                    id: currentUser.id,
                                },
                            })
                        expect(reloaded.coinBalance).toBe(40)
                    })

                it("viewer who has NOT passed this week's challenge is rejected — nothing granted",
                    async () => {
                        await seedTheOnlyChallenge("weekly-claim-not-eligible")
                        // no passing attempt seeded -- currentUser never passed
                        currentUser = await seedUser("kc-weekly-claim-not-eligible")

                        const response = await post(CLAIM_WEEKLY_CHALLENGE_REWARD_MUTATION)

                        expect(response.status).toBe(200)
                        const body = response.body.data.claimWeeklyChallengeReward
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("WEEKLY_CHALLENGE_REWARD_NOT_ELIGIBLE_EXCEPTION")
                        expect(body.data).toBeNull()

                        const reloaded = await entityManager.findOneOrFail(UserEntity,
                            {
                                where: {
                                    id: currentUser.id,
                                },
                            })
                        expect(reloaded.coinBalance).toBe(0)
                    })
            })
    })
