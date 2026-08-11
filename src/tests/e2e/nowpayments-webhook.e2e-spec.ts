import request from "supertest"
import {
    Test,
} from "@nestjs/testing"
import {
    ValidationPipe,
    VersioningType,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    INestApplication,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    AiAutoQuotaConfigService,
} from "@modules/filesystem/ai-auto-quota-config.service"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"
import {
    EnqueueEnrollJobService,
} from "@modules/bussiness/jobs/enqueue/enroll.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    MembershipService,
} from "@modules/membership/membership.service"
import {
    NowPaymentsClient,
} from "@modules/integrations/nowpayments/nowpayments.client"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    NowPaymentsWebhookController,
} from "@features/api/core/http/nowpayments/webhook/webhook.controller"
import {
    NowPaymentsWebhookService,
} from "@features/api/core/http/nowpayments/webhook/webhook.service"
import {
    NowPaymentsWebhookHandler,
} from "@features/api/core/http/nowpayments/webhook/webhook.handler"
import {
    AiSubscriptionEntity,
} from "@modules/databases/postgresql/primary/entities/ai-subscription.entity"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    AiSubStatus,
} from "@modules/databases/postgresql/primary/enums/ai-sub-status"
import {
    AiSubTier,
} from "@modules/databases/postgresql/primary/enums/ai-sub-tier"
import {
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"

const POSTGRESQL_PRIMARY = "primary"
const WEBHOOK_URL = "/v1/nowpayments/webhook"

describe("NOWPayments settles a finished crypto payment through its IPN",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        const nowPaymentsClient = {
            verifySignature: jest.fn(),
        }

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    CqrsModule,
                ],
                controllers: [
                    NowPaymentsWebhookController,
                ],
                providers: [
                    NowPaymentsWebhookService,
                    NowPaymentsWebhookHandler,
                    AiEntitlementService,
                    DayjsService,
                    {
                        provide: NowPaymentsClient,
                        useValue: nowPaymentsClient,
                    },
                    {
                        provide: EnqueueEnrollJobService,
                        useValue: {
                            enqueueForTransaction: jest.fn(),
                        },
                    },
                    {
                        provide: MembershipService,
                        useValue: {
                            grantMembership: jest.fn(),
                        },
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: {
                            enqueue: jest.fn(),
                        },
                    },
                    {
                        provide: NotificationService,
                        useValue: {
                            createNotification: jest.fn(),
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
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
                                usesPer5h: 30,
                                usesPerWeek: 100,
                            }),
                        },
                    },
                    {
                        provide: EncryptionService,
                        useValue: {
                            encrypt: jest.fn(),
                            decrypt: jest.fn(),
                        },
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            app.enableVersioning({
                type: VersioningType.URI,
            })
            app.useGlobalPipes(new ValidationPipe())
            await app.init()
            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"ai_subscriptions\", \"transactions\", \"users\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        const seedPendingPurchase = async (
            referenceId: string,
        ): Promise<TransactionEntity> => {
            const user = await entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: `kc-${referenceId}`,
                    }),
            )
            return entityManager.save(
                entityManager.create(TransactionEntity,
                    {
                        user,
                        referenceId,
                        amount: 99_000,
                        pricingPhase: PricingPhase.Regular,
                        checkoutUrl: "https://nowpayments.test/invoice",
                        status: TransactionStatus.Pending,
                        paymentType: PaymentType.Crypto,
                        actionType: ActionType.AiSubscriptionPurchase,
                        aiSubTier: AiSubTier.Plus,
                    }),
            )
        }

        const postWebhook = (
            referenceId: string,
        ) => request(app.getHttpServer())
            .post(WEBHOOK_URL)
            .set("x-nowpayments-sig",
                "signature")
            .send({
                payment_id: 700_001,
                payment_status: "finished",
                order_id: referenceId,
                pay_currency: "usdttrc20",
                price_amount: 99_000,
                pay_amount: 10,
                actually_paid: 10,
            })

        it("persists the paid transaction and active entitlement",
            async () => {
                const transaction = await seedPendingPurchase("NOW-OK")
                nowPaymentsClient.verifySignature.mockReturnValueOnce(true)

                await postWebhook("NOW-OK").expect(201)

                const settled = await entityManager.findOneByOrFail(TransactionEntity,
                    {
                        id: transaction.id,
                    })
                const subscription = await entityManager.findOne(AiSubscriptionEntity,
                    {
                        where: {
                            user: {
                                id: transaction.userId,
                            },
                        },
                    })
                expect(settled.status).toBe(TransactionStatus.Succeeded)
                expect(subscription).toMatchObject({
                    tier: AiSubTier.Plus,
                    status: AiSubStatus.Active,
                })
            })

        it("leaves the purchase pending when HMAC verification fails",
            async () => {
                const transaction = await seedPendingPurchase("NOW-FORGED")
                nowPaymentsClient.verifySignature.mockReturnValueOnce(false)

                const rejected = await postWebhook("NOW-FORGED")

                const unchanged = await entityManager.findOneByOrFail(TransactionEntity,
                    {
                        id: transaction.id,
                    })
                expect(rejected.status).toBeGreaterThanOrEqual(400)
                expect(unchanged.status).toBe(TransactionStatus.Pending)
                expect(await entityManager.count(AiSubscriptionEntity)).toBe(0)
            })

        it("cannot grant the entitlement twice when NOWPayments redelivers",
            async () => {
                await seedPendingPurchase("NOW-DUP")
                nowPaymentsClient.verifySignature.mockReturnValue(true)

                await postWebhook("NOW-DUP").expect(201)
                const replay = await postWebhook("NOW-DUP")

                expect(replay.status).toBeGreaterThanOrEqual(400)
                expect(await entityManager.count(AiSubscriptionEntity)).toBe(1)
                expect(await entityManager.count(TransactionEntity,
                    {
                        where: {
                            status: TransactionStatus.Succeeded,
                        },
                    })).toBe(1)
            })
    })
