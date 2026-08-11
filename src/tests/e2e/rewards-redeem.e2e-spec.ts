import request from "supertest"
import type {
    CanActivate,
    ExecutionContext,
    INestApplication,
} from "@nestjs/common"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    Test,
} from "@nestjs/testing"
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
    CancelRedemptionResolver,
} from "@features/api/core/graphql/mutations/rewards/cancel-redemption/cancel-redemption.resolver"
import {
    RedeemRewardResolver,
} from "@features/api/core/graphql/mutations/rewards/redeem-reward/redeem-reward.resolver"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    RewardsService,
} from "@modules/bussiness/rewards/rewards.service"
import {
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"
import {
    GraphQLAdminAccessGuard,
} from "@modules/bussiness/guards/graphql-admin-access.guard"
import {
    AiAutoQuotaConfigService,
} from "@modules/filesystem/ai-auto-quota-config.service"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    RewardRedemptionEntity,
} from "@modules/databases/postgresql/primary/entities/reward-redemption.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    RewardRedemptionStatus,
} from "@modules/databases/postgresql/primary/enums/reward-redemption-status"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

describe("a learner redeems a reward and an operator refunds it",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let learner: UserEntity | null = null
        const authenticated: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                if (!learner) return false
                GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>().req.user = learner
                return true
            },
        }
        const allowed: CanActivate = {
            canActivate: () => true,
        }

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic, useServices: false
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true, withHydration: false, withResolvers: false
                    }),
                ],
                providers: [
                    RewardsService,
                    VoucherService,
                    AiEntitlementService,
                    DayjsService,
                    RedeemRewardResolver,
                    CancelRedemptionResolver,
                    {
                        provide: MountFilesystemService, useValue: {
                            appConfig: () => ({
                                subscriptions: {
                                    tiers: []
                                }
                            })
                        }
                    },
                    {
                        provide: AiAutoQuotaConfigService, useValue: {
                            getAutoQuota: () => ({
                                creditsPer5h: 30, creditsPerWeek: 100
                            })
                        }
                    },
                ],
            })
                .overrideGuard(KeycloakAuthGraphQLGuard).useValue(authenticated)
                .overrideGuard(GraphQLAdminAccessGuard).useValue(allowed)
                .compile()
            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get(getEntityManagerToken("primary"))
        })

        afterAll(async () => app?.close().catch(() => undefined))
        beforeEach(async () => {
            await entityManager.query("TRUNCATE TABLE \"reward_redemptions\", \"course_vouchers\", \"ai_subscriptions\", \"users\" RESTART IDENTITY CASCADE")
            learner = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: `reward-${Date.now()}`, coinBalance: 500
                }))
        })

        it("persists the redemption and restores spendable balance after cancellation",
            async () => {
                const redeemed = await request(app.getHttpServer()).post("/graphql").send({
                    query: "mutation { redeemReward(request: { rewardKey: \"sticker\", recipientName: \"Learner\", phone: \"0900000000\", address: \"Bangkok\" }) { success error data { balance } } }",
                })
                expect(redeemed.body).toHaveProperty("data.redeemReward.data.balance",
                    200)
                const row = await entityManager.findOneByOrFail(RewardRedemptionEntity,
                    {
                        userId: learner?.id
                    })
                expect(row.status).toBe(RewardRedemptionStatus.Pending)

                const cancelled = await request(app.getHttpServer()).post("/graphql").send({
                    query: `mutation { cancelRedemption(request: { redemptionId: "${row.id}" }) { success error data { redemptionId status } } }`,
                })
                expect(cancelled.body).toHaveProperty("data.cancelRedemption.success",
                    true)
                expect((await entityManager.findOneByOrFail(RewardRedemptionEntity,
                    {
                        id: row.id
                    })).status).toBe(RewardRedemptionStatus.Cancelled)
            })
    })
