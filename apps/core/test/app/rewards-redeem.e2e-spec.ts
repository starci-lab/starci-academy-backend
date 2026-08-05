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
    CourseVoucherEntity,
    PrimaryPostgreSQLModule,
    RewardRedemptionEntity,
    RewardRedemptionStatus,
    UserEntity,
    VoucherDiscountType,
    VoucherStatus,
} from "@modules/databases"
import {
    InsufficientRewardPointsException,
} from "@modules/exceptions"
import {
    AiEntitlementService,
} from "@modules/ai"
import {
    DayjsService,
} from "@modules/mixin"
import {
    AiAutoQuotaConfigService,
    MountFilesystemService,
} from "@modules/filesystem"
import {
    RewardsService,
    VoucherService,
} from "@modules/bussiness"
import {
    AI_CREDIT_BOOST_REWARD_KEY,
    STREAK_FREEZE_REWARD_KEY,
    VOUCHER_10_REWARD_KEY,
} from "@modules/bussiness"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Catalog key of the physical "sticker" reward (cost 300, kind "physical"). */
const STICKER_REWARD_KEY = "sticker"
const STICKER_COST = 300
const STREAK_FREEZE_COST = 100
const VOUCHER_10_COST = 800

/**
 * e2e for the Coin-shop redeem/refund flow -- `.artifacts/states/rewards/findings.md`
 * #3: {@link RewardsService} and {@link VoucherService} had zero e2e coverage.
 * Runs the real balance check-and-spend transaction (pessimistic-locked user
 * row), the derived-balance formula (`coin_balance - SUM(non-cancelled cost)`),
 * voucher minting, and the round-3a cancel/refund path against REAL Postgres
 * (Testcontainers) -- not the mocked-DB unit level.
 *
 * MOCKED (no external infra available in this harness, matches the pattern
 * `createE2eApp` uses for the same two services):
 *  - `MountFilesystemService` -- real class reads the mounted app config file;
 *    stubbed to hand back an empty subscription-tier catalog.
 *  - `AiAutoQuotaConfigService` -- real class reads the mounted quota config;
 *    stubbed to hand back a fixed free-tier base.
 *
 * REAL: Postgres (Testcontainers), `RewardsService` (the redeem/fulfil/cancel
 * logic under test), `VoucherService` (mint), and `AiEntitlementService`
 * (`grantBonusCredit`, exercised transitively by the `aiCredit`-kind reward via
 * the DI graph -- not the focus of this spec's assertions, but real so the
 * `redeem` transaction is exercised exactly as production wires it).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Coin-shop rewards redeem/refund (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let rewardsService: RewardsService
        let voucherService: VoucherService

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
                    // REAL -- the redeem/fulfil/cancel logic under test
                    RewardsService,
                    // REAL -- mint/reserve/settle, exercised via RewardsService.redeem
                    VoucherService,
                    // REAL -- grantBonusCredit is exercised transitively by the
                    // aiCredit-kind reward; DayjsService has no deps
                    AiEntitlementService,
                    DayjsService,
                    // mocked config services AiEntitlementService's constructor needs
                    // but this spec's paths never actually read from
                    {
                        provide: MountFilesystemService,
                        useValue: {
                            appConfig: () => ({
                                subscriptions: {
                                    tiers: [],
                                },
                            }),
                        },
                    },
                    {
                        provide: AiAutoQuotaConfigService,
                        useValue: {
                            getAutoQuota: () => ({
                                creditsPer5h: 30,
                                creditsPerWeek: 100,
                            }),
                        },
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            rewardsService = app.get(RewardsService)
            voucherService = app.get(VoucherService)
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"reward_redemptions\", \"course_vouchers\", \"ai_subscriptions\", \"users\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        /** Seed a user with the given spendable Coin balance. */
        const seedUser = async (
            keycloakId: string,
            coinBalance: number,
        ): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                        coinBalance,
                    }),
            )

        it("digital reward → Granted row + balance debited by cost (coin_balance itself untouched)",
            async () => {
                const user = await seedUser("kc-redeem-digital",
                    1_000)

                const result = await rewardsService.redeem({
                    userId: user.id,
                    rewardKey: STREAK_FREEZE_REWARD_KEY,
                })

                // derived balance returned by redeem()
                expect(result.balance).toBe(1_000 - STREAK_FREEZE_COST)

                const redemption = await entityManager.findOneOrFail(
                    RewardRedemptionEntity,
                    {
                        where: {
                            userId: user.id,
                        },
                    },
                )
                expect(redemption.status).toBe(RewardRedemptionStatus.Granted)
                expect(redemption.cost).toBe(STREAK_FREEZE_COST)

                // coin_balance itself is NEVER debited -- only the derived wallet is
                const reloaded = await entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            id: user.id,
                        },
                    })
                expect(reloaded.coinBalance).toBe(1_000)

                // getWallet() re-derives the same balance from coin_balance - SUM(cost)
                const wallet = await rewardsService.getWallet(user.id)
                expect(wallet.balance).toBe(1_000 - STREAK_FREEZE_COST)
                expect(wallet.spent).toBe(STREAK_FREEZE_COST)
            })

        it("physical reward → Pending row (ops must fulfil), same derived-balance formula",
            async () => {
                const user = await seedUser("kc-redeem-physical",
                    1_000)

                const result = await rewardsService.redeem({
                    userId: user.id,
                    rewardKey: STICKER_REWARD_KEY,
                    shipping: {
                        recipientName: "Stacy Nguyen",
                        phone: "0900000000",
                        address: "123 Coin St",
                    },
                })

                expect(result.balance).toBe(1_000 - STICKER_COST)

                const redemption = await entityManager.findOneOrFail(
                    RewardRedemptionEntity,
                    {
                        where: {
                            userId: user.id,
                        },
                    },
                )
                expect(redemption.status).toBe(RewardRedemptionStatus.Pending)
                expect(redemption.metadata).toEqual({
                    recipientName: "Stacy Nguyen",
                    phone: "0900000000",
                    address: "123 Coin St",
                })
            })

        it("voucher reward → Granted row + a CourseVoucherEntity minted (unused, scoped to no course)",
            async () => {
                const user = await seedUser("kc-redeem-voucher",
                    1_000)

                const result = await rewardsService.redeem({
                    userId: user.id,
                    rewardKey: VOUCHER_10_REWARD_KEY,
                })

                expect(result.balance).toBe(1_000 - VOUCHER_10_COST)
                expect(result.voucherCode).toBeDefined()

                const redemption = await entityManager.findOneOrFail(
                    RewardRedemptionEntity,
                    {
                        where: {
                            userId: user.id,
                        },
                    },
                )
                expect(redemption.status).toBe(RewardRedemptionStatus.Granted)

                const voucher = await entityManager.findOneOrFail(
                    CourseVoucherEntity,
                    {
                        where: {
                            code: result.voucherCode,
                        },
                    },
                )
                expect(voucher.userId).toBe(user.id)
                expect(voucher.status).toBe(VoucherStatus.Unused)
                expect(voucher.discountType).toBe(VoucherDiscountType.Percent)
                expect(voucher.value).toBe(10)

                // VoucherService.reserve() can claim the freshly-minted code -- proves
                // the mint really is a spendable voucher, not just a ledger echo
                await entityManager.transaction(async (manager) => {
                    const reserved = await voucherService.reserve({
                        entityManager: manager,
                        userId: user.id,
                        code: voucher.code,
                        courseId: "11111111-1111-4111-8111-111111111111",
                        transactionId: "22222222-2222-4222-8222-222222222222",
                    })
                    expect(reserved.value).toBe(10)
                })
                const reservedRow = await entityManager.findOneOrFail(
                    CourseVoucherEntity,
                    {
                        where: {
                            code: voucher.code,
                        },
                    },
                )
                expect(reservedRow.status).toBe(VoucherStatus.Reserved)
            })

        it("aiCredit reward → Granted row + the bonus tops up the current-window allowance",
            async () => {
                const user = await seedUser("kc-redeem-ai-credit",
                    1_000)

                const result = await rewardsService.redeem({
                    userId: user.id,
                    rewardKey: AI_CREDIT_BOOST_REWARD_KEY,
                })

                expect(result.aiCreditGranted).toEqual({
                    amount5h: 30,
                    amountWeek: 30,
                })
                const snapshot = await entityManager.query(
                    "SELECT bonus_credit_5h, bonus_credit_week FROM ai_subscriptions WHERE user_id = $1",
                    [user.id],
                )
                expect(Number(snapshot[0].bonus_credit_5h)).toBe(30)
                expect(Number(snapshot[0].bonus_credit_week)).toBe(30)
            })

        it("overspend is impossible: redeeming beyond the derived balance throws and mutates nothing",
            async () => {
                // balance (200) is short of the sticker's cost (300)
                const user = await seedUser("kc-overspend",
                    200)

                await expect(
                    rewardsService.redeem({
                        userId: user.id,
                        rewardKey: STICKER_REWARD_KEY,
                    }),
                ).rejects.toThrow(InsufficientRewardPointsException)

                // no redemption row was written -- the balance check trips BEFORE
                // any insert, inside the same locked transaction
                const count = await entityManager.count(RewardRedemptionEntity)
                expect(count).toBe(0)

                const reloaded = await entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            id: user.id,
                        },
                    })
                expect(reloaded.coinBalance).toBe(200)
            })

        it("overspend also accounts for ALREADY-spent (non-cancelled) redemptions, not just coin_balance",
            async () => {
                // balance 1000, first redeem spends 800 (voucher10) -> 200 left,
                // a second sticker redemption (cost 300) must now be rejected even
                // though coin_balance itself still reads 1000
                const user = await seedUser("kc-overspend-cumulative",
                    1_000)
                await rewardsService.redeem({
                    userId: user.id,
                    rewardKey: VOUCHER_10_REWARD_KEY,
                })

                await expect(
                    rewardsService.redeem({
                        userId: user.id,
                        rewardKey: STICKER_REWARD_KEY,
                    }),
                ).rejects.toThrow(InsufficientRewardPointsException)

                // exactly the first (voucher) redemption exists -- the second never landed
                const count = await entityManager.count(RewardRedemptionEntity)
                expect(count).toBe(1)
            })

        it("round-3a refund: cancelRedemption sets Cancelled and the derived balance recovers — no coin credit, no double-refund",
            async () => {
                const user = await seedUser("kc-cancel-refund",
                    1_000)

                const redeemed = await rewardsService.redeem({
                    userId: user.id,
                    rewardKey: STICKER_REWARD_KEY,
                })
                expect(redeemed.balance).toBe(1_000 - STICKER_COST)

                const redemption = await entityManager.findOneOrFail(
                    RewardRedemptionEntity,
                    {
                        where: {
                            userId: user.id,
                        },
                    },
                )

                const cancelled = await rewardsService.cancelRedemption(redemption.id)
                expect(cancelled.status).toBe(RewardRedemptionStatus.Cancelled)

                // computeSpent excludes Cancelled -> the derived balance goes back up
                // to the FULL coin_balance, purely from the status flip
                const wallet = await rewardsService.getWallet(user.id)
                expect(wallet.spent).toBe(0)
                expect(wallet.balance).toBe(1_000)

                // no separate coin credit ever happened -- coin_balance was never
                // touched by either redeem() or cancelRedemption()
                const reloaded = await entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            id: user.id,
                        },
                    })
                expect(reloaded.coinBalance).toBe(1_000)

                // double-refund guard: cancelling an already-cancelled row must fail,
                // not silently re-apply a (non-existent) refund a second time
                await expect(
                    rewardsService.cancelRedemption(redemption.id),
                ).rejects.toThrow()

                // the refunded balance is now spendable again -- a fresh redeem for the
                // SAME reward succeeds using the freed-up room
                const redeemedAgain = await rewardsService.redeem({
                    userId: user.id,
                    rewardKey: STICKER_REWARD_KEY,
                })
                expect(redeemedAgain.balance).toBe(1_000 - STICKER_COST)
            })
    })
