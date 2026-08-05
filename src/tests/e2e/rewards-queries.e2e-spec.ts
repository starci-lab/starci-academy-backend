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
    CourseVoucherEntity,
    PrimaryPostgreSQLModule,
    RewardRedemptionEntity,
    RewardRedemptionStatus,
    UserEntity,
    VoucherDiscountType,
    VoucherStatus,
} from "@modules/databases"
import {
    AiEntitlementService,
} from "@modules/ai"
import {
    DayjsService,
} from "@modules/mixin"
import {
    AiAutoQuotaConfigService,
    MountFilesystemService,
    MountStorageService,
} from "@modules/filesystem"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    GraphQLAdminAccessGuard,
    RewardsService,
    VoucherService,
} from "@modules/bussiness"
import {
    RewardsResolver,
} from "@features/api/core/graphql/queries/dashboard/rewards/rewards.resolver"
import {
    MyVouchersResolver,
} from "@features/api/core/graphql/queries/dashboard/my-vouchers/my-vouchers.resolver"
import {
    MyRewardWalletResolver,
} from "@features/api/core/graphql/queries/dashboard/my-reward-wallet/my-reward-wallet.resolver"
import {
    FulfillRedemptionResolver,
} from "@features/api/core/graphql/mutations/rewards/fulfill-redemption/fulfill-redemption.resolver"
import {
    TestHelpersModule,
} from "@tests/helpers"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Admin key the mocked mount store hands back on the happy fulfillRedemption path. */
const ADMIN_API_KEY = "admin-secret-key-rewards-e2e"

/** Catalog key of the physical "sticker" reward (cost 300, kind "physical") -- not exported by `rewards.catalog.ts`, mirrored here like `rewards-redeem.e2e-spec.ts` does. */
const STICKER_REWARD_KEY = "sticker"

/**
 * e2e for four previously-untested Coin-shop READ/ops surfaces -- the public
 * `rewards` catalog, `myVouchers`, `myRewardWallet`, and the ops-only
 * `fulfillRedemption` mutation. `rewards-redeem.e2e-spec.ts` already covers
 * {@link RewardsService.redeem}/`cancelRedemption` directly; this file covers
 * the READ resolvers + the fulfil ops path THAT flow never exercises, driven
 * over real GraphQL HTTP so the real guards run too.
 *
 * MOCKED (no external infra available in this harness, mirrors
 * `rewards-redeem.e2e-spec.ts`'s own MOCKED section):
 *  - `MountFilesystemService` / `AiAutoQuotaConfigService` -- real classes read
 *    a mounted app-config file; stubbed to a fixed free-tier base (unused by
 *    any path this file exercises, but required for `AiEntitlementService`'s
 *    provider graph to resolve at `compile()`).
 *  - `MountStorageService` -- real class reads the mounted admin secret;
 *    stubbed to a fixed key so {@link GraphQLAdminAccessGuard} (run FOR REAL,
 *    not overridden) has something deterministic to compare
 *    `x-admin-api-key` against.
 *  - `KeycloakAuthGraphQLGuard` -- no Keycloak server here; overridden to stamp
 *    `request.user` with whichever fake user the test "logs in" as (same
 *    technique as `progress-query.e2e-spec.ts`), so the auth-denied case is a
 *    genuine guard rejection, not a hand-rolled stand-in.
 *
 * REAL: Postgres (Testcontainers), the full GraphQL/Apollo wiring,
 * {@link RewardsService}, {@link VoucherService}, {@link GraphQLAdminAccessGuard}
 * (exercised for real on `fulfillRedemption` -- the ONE flow in this file that
 * keeps its own guard un-mocked, since that guard IS the surface under test).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Rewards — catalog / vouchers / wallet / fulfil (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager

        /** The "logged in" user the overridden Keycloak guard stamps onto the request; `null` = anonymous. */
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

        const GRAPHQL_ENDPOINT = "/graphql"

        const REWARDS_QUERY = `
            query Rewards {
                rewards {
                    success
                    data {
                        key
                        title
                        cost
                        kind
                        voucher {
                            discountType
                            value
                            validityDays
                        }
                        aiCredit {
                            amount5h
                            amountWeek
                        }
                    }
                }
            }
        `
        const MY_VOUCHERS_QUERY = `
            query MyVouchers {
                myVouchers {
                    success
                    data {
                        id
                        code
                        discountType
                        value
                        status
                    }
                }
            }
        `
        const MY_REWARD_WALLET_QUERY = `
            query MyRewardWallet {
                myRewardWallet {
                    success
                    data {
                        balance
                        spent
                        redemptions {
                            rewardKey
                            title
                            cost
                            status
                        }
                    }
                }
            }
        `
        const FULFILL_REDEMPTION_MUTATION = `
            mutation FulfillRedemption($request: FulfillRedemptionRequest!) {
                fulfillRedemption(request: $request) {
                    success
                    error
                    data {
                        redemptionId
                        status
                    }
                }
            }
        `

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
                    // rewards catalog (public, no guard)
                    RewardsResolver,
                    // myVouchers / myRewardWallet (auth-required)
                    MyVouchersResolver,
                    MyRewardWalletResolver,
                    // fulfillRedemption (admin-only -- guard runs for real)
                    FulfillRedemptionResolver,
                    GraphQLAdminAccessGuard,
                    // REAL -- the redeem/fulfil/wallet logic under test
                    RewardsService,
                    VoucherService,
                    AiEntitlementService,
                    DayjsService,
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
                    {
                        provide: MountStorageService,
                        useValue: {
                            get adminApiKey() {
                                return ADMIN_API_KEY
                            },
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
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"reward_redemptions\", \"course_vouchers\", \"ai_subscriptions\", \"users\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
            jest.clearAllMocks()
        })

        /** Seed a user with the given spendable Coin balance. */
        const seedUser = async (
            keycloakId: string,
            coinBalance = 0,
        ): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                        coinBalance,
                    }),
            )

        describe("rewards (public catalog)",
            () => {
                it("returns the full code-defined catalog, EN localized, with kind-specific payloads intact",
                    async () => {
                        const response = await request(app.getHttpServer())
                            .post(GRAPHQL_ENDPOINT)
                            .send({
                                query: REWARDS_QUERY,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.rewards
                        expect(body.success).toBe(true)
                        expect(body.data).toHaveLength(5)
                        const voucherReward = body.data.find((r: { key: string }) => r.key === "voucher10")
                        expect(voucherReward.title).toBe("10% off any course")
                        expect(voucherReward.voucher).toEqual({
                            discountType: VoucherDiscountType.Percent,
                            value: 10,
                            validityDays: 30,
                        })
                        const aiCreditReward = body.data.find((r: { key: string }) => r.key === "aiCreditBoost")
                        expect(aiCreditReward.aiCredit).toEqual({
                            amount5h: 30,
                            amountWeek: 30,
                        })
                    })

                it("locale variant (VI): same 5 rewards, VI-localized titles — no auth required, no guard blocks it either way",
                    async () => {
                        // this catalog has no failure surface (no args, no auth, no DB
                        // read) -- the representative non-happy angle here is proving
                        // the OTHER locale branch resolves correctly, not an error path
                        const response = await request(app.getHttpServer())
                            .post(GRAPHQL_ENDPOINT)
                            .set("Accept-Language",
                                "vi")
                            .send({
                                query: REWARDS_QUERY,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.rewards
                        expect(body.data).toHaveLength(5)
                        const voucherReward = body.data.find((r: { key: string }) => r.key === "voucher10")
                        expect(voucherReward.title).toBe("Voucher giảm 10% mọi khóa học") // vn-ok: asserts vi-locale catalog title under Accept-Language: vi
                    })
            })

        describe("myVouchers",
            () => {
                it("lists the viewer's vouchers newest-first, deriving `expired` for a stale-but-unused row",
                    async () => {
                        currentUser = await seedUser("kc-my-vouchers-happy")
                        const mintingRedemption = async (rewardKey: string) =>
                            entityManager.save(
                                entityManager.create(RewardRedemptionEntity,
                                    {
                                        user: currentUser as UserEntity,
                                        rewardKey,
                                        cost: 800,
                                        status: RewardRedemptionStatus.Granted,
                                        metadata: null,
                                    }),
                            )
                        const older = await entityManager.save(
                            entityManager.create(CourseVoucherEntity,
                                {
                                    user: currentUser,
                                    redemption: await mintingRedemption("voucher10"),
                                    course: null,
                                    code: "OLDER-CODE",
                                    discountType: VoucherDiscountType.Percent,
                                    value: 10,
                                    status: VoucherStatus.Unused,
                                    // already past expiry -- DISPLAYED as expired even though the
                                    // stored column still reads `unused` (no cron sweep)
                                    expiresAt: new Date(Date.now() - 1000 * 60 * 60),
                                }),
                        )
                        await entityManager.update(CourseVoucherEntity,
                            older.id,
                            {
                                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
                            })
                        const newer = await entityManager.save(
                            entityManager.create(CourseVoucherEntity,
                                {
                                    user: currentUser,
                                    redemption: await mintingRedemption("voucher10"),
                                    course: null,
                                    code: "NEWER-CODE",
                                    discountType: VoucherDiscountType.Flat,
                                    value: 50_000,
                                    status: VoucherStatus.Unused,
                                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
                                }),
                        )

                        const response = await request(app.getHttpServer())
                            .post(GRAPHQL_ENDPOINT)
                            .send({
                                query: MY_VOUCHERS_QUERY,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.myVouchers
                        expect(body.success).toBe(true)
                        expect(body.data).toHaveLength(2)
                        // newest first
                        expect(body.data[0].code).toBe(newer.code)
                        expect(body.data[0].status).toBe(VoucherStatus.Unused)
                        expect(body.data[1].code).toBe(older.code)
                        // effectively expired, even though the DB column is still "unused"
                        expect(body.data[1].status).toBe(VoucherStatus.Expired)
                    })

                it("auth denied: an unauthenticated caller is rejected, no vouchers leak",
                    async () => {
                        // currentUser stays null -- fakeAuthGuard denies the request
                        const response = await request(app.getHttpServer())
                            .post(GRAPHQL_ENDPOINT)
                            .send({
                                query: MY_VOUCHERS_QUERY,
                            })

                        expect(response.body.errors).toBeDefined()
                        expect(response.body.data?.myVouchers ?? null).toBeNull()
                    })
            })

        describe("myRewardWallet",
            () => {
                it("balance = coinBalance - SUM(non-cancelled cost); a CANCELLED redemption is excluded from spent",
                    async () => {
                        currentUser = await seedUser("kc-my-wallet-happy",
                            1_000)
                        await entityManager.save(
                            entityManager.create(RewardRedemptionEntity,
                                {
                                    user: currentUser,
                                    rewardKey: STICKER_REWARD_KEY,
                                    cost: 300,
                                    status: RewardRedemptionStatus.Pending,
                                    metadata: null,
                                }),
                        )
                        // a CANCELLED redemption must NOT count toward `spent` -- this is
                        // the edge this test specifically pins down
                        await entityManager.save(
                            entityManager.create(RewardRedemptionEntity,
                                {
                                    user: currentUser,
                                    rewardKey: "streakFreeze",
                                    cost: 100,
                                    status: RewardRedemptionStatus.Cancelled,
                                    metadata: null,
                                }),
                        )

                        const response = await request(app.getHttpServer())
                            .post(GRAPHQL_ENDPOINT)
                            .send({
                                query: MY_REWARD_WALLET_QUERY,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.myRewardWallet
                        expect(body.success).toBe(true)
                        // ONLY the pending sticker (300) counts -- the cancelled 100 does not
                        expect(body.data.spent).toBe(300)
                        expect(body.data.balance).toBe(1_000 - 300)
                        expect(body.data.redemptions).toHaveLength(2)
                        const sticker = body.data.redemptions.find(
                            (r: { rewardKey: string }) => r.rewardKey === STICKER_REWARD_KEY,
                        )
                        expect(sticker.title).toBe("StarCi sticker pack")
                    })

                it("empty state: a viewer with zero redemptions gets a zeroed wallet, not an error",
                    async () => {
                        currentUser = await seedUser("kc-my-wallet-empty",
                            500)

                        const response = await request(app.getHttpServer())
                            .post(GRAPHQL_ENDPOINT)
                            .send({
                                query: MY_REWARD_WALLET_QUERY,
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.myRewardWallet
                        expect(body.success).toBe(true)
                        expect(body.data.spent).toBe(0)
                        expect(body.data.balance).toBe(500)
                        expect(body.data.redemptions).toEqual([])
                    })
            })

        describe("fulfillRedemption (ops, admin-only)",
            () => {
                it("admin fulfils a PENDING physical redemption — status flips to Fulfilled",
                    async () => {
                        const user = await seedUser("kc-fulfil-happy",
                            1_000)
                        const redemption = await entityManager.save(
                            entityManager.create(RewardRedemptionEntity,
                                {
                                    user,
                                    rewardKey: STICKER_REWARD_KEY,
                                    cost: 300,
                                    status: RewardRedemptionStatus.Pending,
                                    metadata: {
                                        recipientName: "Stacy Nguyen",
                                        phone: "0900000000",
                                        address: "123 Coin St",
                                    },
                                }),
                        )

                        const response = await request(app.getHttpServer())
                            .post(GRAPHQL_ENDPOINT)
                            .set("x-admin-api-key",
                                ADMIN_API_KEY)
                            .send({
                                query: FULFILL_REDEMPTION_MUTATION,
                                variables: {
                                    request: {
                                        redemptionId: redemption.id,
                                    },
                                },
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.fulfillRedemption
                        expect(body.success).toBe(true)
                        expect(body.data.status).toBe(RewardRedemptionStatus.Fulfilled)

                        const reloaded = await entityManager.findOneOrFail(
                            RewardRedemptionEntity,
                            {
                                where: {
                                    id: redemption.id,
                                },
                            },
                        )
                        expect(reloaded.status).toBe(RewardRedemptionStatus.Fulfilled)
                    })

                it("auth denied: missing x-admin-api-key header is rejected — the redemption stays Pending",
                    async () => {
                        const user = await seedUser("kc-fulfil-denied",
                            1_000)
                        const redemption = await entityManager.save(
                            entityManager.create(RewardRedemptionEntity,
                                {
                                    user,
                                    rewardKey: STICKER_REWARD_KEY,
                                    cost: 300,
                                    status: RewardRedemptionStatus.Pending,
                                    metadata: null,
                                }),
                        )

                        const response = await request(app.getHttpServer())
                            .post(GRAPHQL_ENDPOINT)
                            // deliberately NO x-admin-api-key header
                            .send({
                                query: FULFILL_REDEMPTION_MUTATION,
                                variables: {
                                    request: {
                                        redemptionId: redemption.id,
                                    },
                                },
                            })

                        expect(response.body.errors).toBeDefined()
                        expect(response.body.data?.fulfillRedemption ?? null).toBeNull()

                        const reloaded = await entityManager.findOneOrFail(
                            RewardRedemptionEntity,
                            {
                                where: {
                                    id: redemption.id,
                                },
                            },
                        )
                        // rejected BEFORE the resolver ever ran -- status untouched
                        expect(reloaded.status).toBe(RewardRedemptionStatus.Pending)
                    })
            })
    })
