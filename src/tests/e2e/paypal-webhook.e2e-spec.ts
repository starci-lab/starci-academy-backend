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
    TransactionGrantService,
} from "@modules/bussiness/transactions/atomic/transaction-grant.service"
import {
    MembershipService,
} from "@modules/membership/membership.service"
import {
    PaypalClient,
} from "@modules/integrations/paypal/paypal.client"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    PaypalWebhookController,
} from "@features/api/core/http/paypal/webhook/webhook.controller"
import {
    PaypalWebhookService,
} from "@features/api/core/http/paypal/webhook/webhook.service"
import {
    PaypalWebhookHandler,
} from "@features/api/core/http/paypal/webhook/webhook.handler"
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
const WEBHOOK_URL = "/v1/paypal/webhook"

describe("PayPal settles a captured payment through its webhook",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        const paypalClient = {
            verifyWebhookSignature: jest.fn(),
            captureOrder: jest.fn(),
            retrieveOrder: jest.fn(),
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
                    PaypalWebhookController,
                ],
                providers: [
                    PaypalWebhookService,
                    PaypalWebhookHandler,
                    TransactionGrantService,
                    AiEntitlementService,
                    DayjsService,
                    {
                        provide: PaypalClient,
                        useValue: paypalClient,
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
                        checkoutUrl: "https://paypal.test/checkout",
                        status: TransactionStatus.Pending,
                        paymentType: PaymentType.Paypal,
                        actionType: ActionType.AiSubscriptionPurchase,
                        aiSubTier: AiSubTier.Plus,
                    }),
            )
        }

        const postWebhook = (
            referenceId: string,
        ) => request(app.getHttpServer())
            .post(WEBHOOK_URL)
            .set("paypal-auth-algo",
                "SHA256withRSA")
            .set("paypal-cert-url",
                "https://paypal.test/cert.pem")
            .set("paypal-transmission-id",
                "transmission-1")
            .set("paypal-transmission-sig",
                "signature")
            .set("paypal-transmission-time",
                "2026-08-11T00:00:00Z")
            .send({
                id: "WH-1",
                event_type: "PAYMENT.CAPTURE.COMPLETED",
                resource: {
                    id: "CAPTURE-1",
                    custom_id: referenceId,
                },
            })

        it("persists the paid transaction and active entitlement",
            async () => {
                const transaction = await seedPendingPurchase("PAYPAL-OK")
                paypalClient.verifyWebhookSignature.mockResolvedValueOnce(true)

                await postWebhook("PAYPAL-OK").expect(201)

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

        it("leaves the purchase pending when signature verification fails",
            async () => {
                const transaction = await seedPendingPurchase("PAYPAL-FORGED")
                paypalClient.verifyWebhookSignature.mockResolvedValueOnce(false)

                const rejected = await postWebhook("PAYPAL-FORGED")

                const unchanged = await entityManager.findOneByOrFail(TransactionEntity,
                    {
                        id: transaction.id,
                    })
                expect(rejected.status).toBeGreaterThanOrEqual(400)
                expect(unchanged.status).toBe(TransactionStatus.Pending)
                expect(await entityManager.count(AiSubscriptionEntity)).toBe(0)
            })

        it("cannot grant the entitlement twice when PayPal redelivers",
            async () => {
                await seedPendingPurchase("PAYPAL-DUP")
                paypalClient.verifyWebhookSignature.mockResolvedValue(true)

                await postWebhook("PAYPAL-DUP").expect(201)
                const replay = await postWebhook("PAYPAL-DUP")

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
