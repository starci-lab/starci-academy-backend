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
    PrimaryPostgreSQLModule,
    UserEntity,
} from "@modules/databases"
import {
    StreakFreezeInsufficientPointsException,
    StreakFreezeLimitReachedException,
} from "@modules/exceptions"
import {
    STREAK_FREEZE_COST,
    STREAK_FREEZE_MAX,
    StreakService,
} from "@modules/bussiness"
import {
    TestHelpersModule,
} from "@tests/helpers"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the round-3a streak-freeze purchase mutation --
 * `.claude/canon/be/enforce/authoring/testing.md` §2 names every write flow
 * that commits state as required e2e coverage; {@link StreakService.buyStreakFreeze}
 * had zero coverage above the mocked-`EntityManager` unit level. Runs the real
 * pessimistic-locked read-check-write transaction (cap check, balance check,
 * atomic debit+credit) against REAL Postgres (Testcontainers).
 *
 * REAL: Postgres (Testcontainers), `StreakService` (the purchase logic under
 * test) -- the service has no other dependencies (no event fan-out, no
 * external SDK), so nothing needs stubbing.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Streak-freeze purchase (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let streakService: StreakService

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    // real Postgres against the Testcontainers DB -- no hydration/
                    // resolvers/seeders, this focused app doesn't need them
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // REAL -- the buy/cap/balance logic under test
                    StreakService,
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            streakService = app.get(StreakService)
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"users\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        /** Seed a user with the given Coin balance and freeze inventory. */
        const seedUser = async (
            keycloakId: string,
            coinBalance: number,
            streakFreezes = 0,
        ): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                        coinBalance,
                        streakFreezes,
                    }),
            )

        it("buys one freeze: debits STREAK_FREEZE_COST from coin_balance and credits streak_freezes by 1 on the REAL row",
            async () => {
                const user = await seedUser("kc-freeze-buy",
                    1_000)

                const result = await streakService.buyStreakFreeze(user.id)

                expect(result.streakFreezes).toBe(1)
                expect(result.points).toBe(1_000 - STREAK_FREEZE_COST)

                const reloaded = await entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            id: user.id,
                        },
                    })
                expect(reloaded.streakFreezes).toBe(1)
                expect(reloaded.coinBalance).toBe(1_000 - STREAK_FREEZE_COST)
            })

        it("repeated buys accumulate inventory + spend, one row per user, up to the cap",
            async () => {
                const user = await seedUser("kc-freeze-accumulate",
                    1_000)

                await streakService.buyStreakFreeze(user.id)
                await streakService.buyStreakFreeze(user.id)
                const third = await streakService.buyStreakFreeze(user.id)

                expect(third.streakFreezes).toBe(STREAK_FREEZE_MAX)
                expect(third.points).toBe(1_000 - STREAK_FREEZE_COST * STREAK_FREEZE_MAX)

                const count = await entityManager.count(UserEntity)
                expect(count).toBe(1)
            })

        it("throws StreakFreezeLimitReachedException at the cap and mutates NOTHING (no partial debit)",
            async () => {
                const user = await seedUser("kc-freeze-cap",
                    1_000,
                    STREAK_FREEZE_MAX)

                await expect(
                    streakService.buyStreakFreeze(user.id),
                ).rejects.toBeInstanceOf(StreakFreezeLimitReachedException)

                const reloaded = await entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            id: user.id,
                        },
                    })
                // cap check trips BEFORE the balance check / debit -- coin_balance and
                // streak_freezes are both untouched by the rejected attempt
                expect(reloaded.streakFreezes).toBe(STREAK_FREEZE_MAX)
                expect(reloaded.coinBalance).toBe(1_000)
            })

        it("throws StreakFreezeInsufficientPointsException below cost and mutates NOTHING",
            async () => {
                const user = await seedUser("kc-freeze-poor",
                    STREAK_FREEZE_COST - 1)

                await expect(
                    streakService.buyStreakFreeze(user.id),
                ).rejects.toBeInstanceOf(StreakFreezeInsufficientPointsException)

                const reloaded = await entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            id: user.id,
                        },
                    })
                expect(reloaded.streakFreezes).toBe(0)
                expect(reloaded.coinBalance).toBe(STREAK_FREEZE_COST - 1)
            })

        it("concurrent double-buy race: balance for exactly ONE freeze — the pessimistic write lock lets only one purchase win, never both",
            async () => {
                // just enough Coin for a single freeze; two buys fired at once must
                // never both succeed (that would be a double-grant, the exact class
                // of race `installment-payment.e2e-spec.ts` / `rewards-redeem.e2e-spec.ts`
                // already guard for money-affecting rows)
                const user = await seedUser("kc-freeze-race",
                    STREAK_FREEZE_COST)

                const results = await Promise.allSettled([
                    streakService.buyStreakFreeze(user.id),
                    streakService.buyStreakFreeze(user.id),
                ])

                const fulfilled = results.filter((result) => result.status === "fulfilled")
                const rejected = results.filter((result) => result.status === "rejected")
                expect(fulfilled).toHaveLength(1)
                expect(rejected).toHaveLength(1)

                const reloaded = await entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            id: user.id,
                        },
                    })
                // exactly one freeze bought, exactly one cost debited -- not zero, not two
                expect(reloaded.streakFreezes).toBe(1)
                expect(reloaded.coinBalance).toBe(0)
            })
    })
