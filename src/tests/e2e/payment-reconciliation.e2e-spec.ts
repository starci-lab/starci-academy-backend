import {
    Test,
} from "@nestjs/testing"
import request from "supertest"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    VersioningType,
} from "@nestjs/common"
import {
    BullModule as NestBullModule,
    getQueueToken,
} from "@nestjs/bullmq"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    Queue,
} from "bullmq"
import type {
    EntityManager,
} from "typeorm"
import SuperJSON from "superjson"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    POSTGRESQL_PRIMARY,
} from "@modules/databases/postgresql/primary/constants/connection"
import {
    AiSubscriptionEntity,
} from "@modules/databases/postgresql/primary/entities/ai-subscription.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    InstallmentPlanEntity,
} from "@modules/databases/postgresql/primary/entities/installment-plan.entity"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    MembershipEntity,
} from "@modules/databases/postgresql/primary/entities/membership.entity"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    TransactionItemEntity,
} from "@modules/databases/postgresql/primary/entities/transaction-item.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    AiSubTier,
} from "@modules/databases/postgresql/primary/enums/ai-sub-tier"
import {
    InstallmentPlanStatus,
} from "@modules/databases/postgresql/primary/enums/installment-plan-status"
import {
    InstallmentPlanType,
} from "@modules/databases/postgresql/primary/enums/installment-plan-type"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    MembershipStatus,
} from "@modules/databases/postgresql/primary/enums/membership-status"
import {
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    AiAutoQuotaConfigService,
} from "@modules/filesystem/ai-auto-quota-config.service"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    InstallmentPlanService,
} from "@modules/bussiness/installment-plan/installment-plan.service"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    JobStalledService,
} from "@modules/bussiness/jobs/atomic/job-stalled.service"
import {
    EnqueueEnrollJobService,
} from "@modules/bussiness/jobs/enqueue/enroll.service"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"
import {
    TransactionActionService,
} from "@modules/bussiness/transactions/atomic/transaction-action.service"
import {
    TransactionReconcileQueryService,
} from "@modules/bussiness/transactions/atomic/transaction-reconcile-query.service"
import {
    MembershipService,
} from "@modules/membership/membership.service"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import type {
    ReconcileTransactionPayload,
} from "@modules/integrations/bullmq/types/payloads/reconcile-transaction"
import {
    NowPaymentsClient,
} from "@modules/integrations/nowpayments/nowpayments.client"
import {
    PAYOS,
} from "@modules/integrations/payos/constants/payos"
import {
    PaypalClient,
} from "@modules/integrations/paypal/paypal.client"
import {
    SEPAY,
} from "@modules/integrations/sepay/constants/sepay"
import {
    STRIPE,
} from "@modules/integrations/stripe/constants/stripe"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    createSuperJsonServiceProvider,
} from "@modules/lib/mixin/superjson.providers"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    ReconcileTransactionWorker,
} from "@features/api/processors/reconcile-transaction/reconcile-transaction.worker"
import {
    PayosWebhookController,
} from "@features/api/core/http/payos/webhook/webhook.controller"
import {
    PayosWebhookHandler,
} from "@features/api/core/http/payos/webhook/webhook.handler"
import {
    PayosWebhookService,
} from "@features/api/core/http/payos/webhook/webhook.service"
import {
    until,
} from "@tests/helpers/flow-wait"

const superJson = new SuperJSON()
const reconcileQueueData = bullData[BullQueueName.ReconcileTransaction]
const enrollQueueData = bullData[BullQueueName.Enroll]
const sendMailQueueData = bullData[BullQueueName.SendMail]

interface GatewayMocks {
    payos: {
        paymentRequests: {
            get: jest.Mock
        }
        webhooks: {
            verify: jest.Mock
        }
    }
    sepay: {
        order: {
            retrieve: jest.Mock
        }
    }
    stripe: {
        checkout: {
            sessions: {
                retrieve: jest.Mock
            }
        }
    }
    paypal: {
        retrieveOrder: jest.Mock
        captureOrder: jest.Mock
    }
    crypto: {
        getInvoiceStatus: jest.Mock
    }
}

/**
 * Reconciliation enters through Redis, runs the production worker and status
 * resolver, and observes Postgres/queues. Only payment SDK responses are
 * scripted: no worker method, resolver, or business grant service is mocked.
 */
describe("a pending payment is reconciled through its real gateway fallback chain",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let reconcileQueue: Queue<string>
        let enrollQueue: Queue<string>
        let sendMailQueue: Queue<string>
        let gateways: GatewayMocks
        let priorDelay: string | undefined
        let priorMaxAttempts: string | undefined
        let priorEnqueueDelay: string | undefined

        beforeAll(async () => {
            priorDelay = process.env.API_TRANSACTION_RECONCILE_DELAY_MS
            priorMaxAttempts = process.env.API_TRANSACTION_RECONCILE_MAX_ATTEMPTS
            priorEnqueueDelay = process.env.BULLMQ_ENQUEUE_UX_DELAY
            process.env.API_TRANSACTION_RECONCILE_DELAY_MS = "25ms"
            process.env.API_TRANSACTION_RECONCILE_MAX_ATTEMPTS = "2"
            process.env.BULLMQ_ENQUEUE_UX_DELAY = "0ms"

            gateways = {
                payos: {
                    paymentRequests: {
                        get: jest.fn(),
                    },
                    webhooks: {
                        verify: jest.fn(),
                    },
                },
                sepay: {
                    order: {
                        retrieve: jest.fn(),
                    },
                },
                stripe: {
                    checkout: {
                        sessions: {
                            retrieve: jest.fn(),
                        },
                    },
                },
                paypal: {
                    retrieveOrder: jest.fn(),
                    captureOrder: jest.fn(),
                },
                crypto: {
                    getInvoiceStatus: jest.fn(),
                },
            }

            const moduleRef = await Test.createTestingModule({
                imports: [
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    CqrsModule,
                    NestBullModule.forRoot({
                        connection: {
                            host: process.env.REDIS_BULLMQ_HOST,
                            port: Number(process.env.REDIS_BULLMQ_PORT),
                            password: process.env.REDIS_BULLMQ_PASSWORD,
                        },
                    }),
                    NestBullModule.registerQueue(
                        {
                            name: reconcileQueueData.name,
                            prefix: reconcileQueueData.prefix,
                        },
                        {
                            name: enrollQueueData.name,
                            prefix: enrollQueueData.prefix,
                        },
                        {
                            name: sendMailQueueData.name,
                            prefix: sendMailQueueData.prefix,
                        },
                    ),
                ],
                controllers: [
                    PayosWebhookController,
                ],
                providers: [
                    PayosWebhookService,
                    PayosWebhookHandler,
                    ReconcileTransactionWorker,
                    TransactionReconcileQueryService,
                    TransactionActionService,
                    VoucherService,
                    InstallmentPlanService,
                    AiEntitlementService,
                    MembershipService,
                    EnqueueReconcileTransactionJobService,
                    EnqueueEnrollJobService,
                    EnqueueSendMailJobService,
                    JobActionService,
                    JobStalledService,
                    DayjsService,
                    createSuperJsonServiceProvider(),
                    {
                        provide: PAYOS,
                        useValue: gateways.payos,
                    },
                    {
                        provide: SEPAY,
                        useValue: gateways.sepay,
                    },
                    {
                        provide: STRIPE,
                        useValue: gateways.stripe,
                    },
                    {
                        provide: PaypalClient,
                        useValue: gateways.paypal,
                    },
                    {
                        provide: NowPaymentsClient,
                        useValue: gateways.crypto,
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
                        provide: EventEmitterService,
                        useValue: {
                            emit: async () => undefined,
                        },
                    },
                    {
                        provide: NotificationService,
                        useValue: {
                            createNotification: async () => undefined,
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: () => undefined,
                        },
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            app.enableVersioning({
                type: VersioningType.URI,
            })
            await app.init()
            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            reconcileQueue = app.get<Queue<string>>(
                getQueueToken(reconcileQueueData.name),
            )
            enrollQueue = app.get<Queue<string>>(
                getQueueToken(enrollQueueData.name),
            )
            sendMailQueue = app.get<Queue<string>>(
                getQueueToken(sendMailQueueData.name),
            )
        })

        afterAll(async () => {
            await app?.close().catch(() => undefined)
            process.env.API_TRANSACTION_RECONCILE_DELAY_MS = priorDelay
            process.env.API_TRANSACTION_RECONCILE_MAX_ATTEMPTS = priorMaxAttempts
            process.env.BULLMQ_ENQUEUE_UX_DELAY = priorEnqueueDelay
        })

        afterEach(async () => {
            await until(async () => (await reconcileQueue.getActiveCount()) === 0,
                {
                    timeout: 20_000,
                    describe: "the reconciliation worker to release its active job",
                })
            await reconcileQueue.obliterate({
                force: true,
            })
            await enrollQueue.obliterate({
                force: true,
            })
            await sendMailQueue.obliterate({
                force: true,
            })
            await entityManager.query(
                "TRUNCATE TABLE \"jobs\", \"ai_subscriptions\", \"memberships\", \"installment_plans\", \"transaction_items\", \"transactions\", \"courses\", \"users\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        const seedUser = async (
            key: string,
        ): Promise<UserEntity> => entityManager.save(
            entityManager.create(UserEntity,
                {
                    keycloakId: `kc-reconcile-${key}`,
                }),
        )

        const seedTransaction = async (
            params: {
                actionType: ActionType
                paymentType: PaymentType
                referenceId: string
                user: UserEntity
                aiSubTier?: AiSubTier
                course?: CourseEntity
                installmentPlanId?: string
            },
        ): Promise<TransactionEntity> => entityManager.save(
            entityManager.create(TransactionEntity,
                {
                    user: params.user,
                    course: params.course ?? null,
                    referenceId: params.referenceId,
                    providerPaymentId: `provider-${params.referenceId}`,
                    amount: 500_000,
                    pricingPhase: PricingPhase.Regular,
                    checkoutUrl: "https://gateway.test/pending",
                    status: TransactionStatus.Pending,
                    paymentType: params.paymentType,
                    actionType: params.actionType,
                    aiSubTier: params.aiSubTier ?? null,
                    installmentPlanId: params.installmentPlanId ?? null,
                }),
        )

        const publish = async (
            transactionId: string,
            attempt = 1,
        ): Promise<void> => {
            const payload: ReconcileTransactionPayload = {
                transactionId,
                attempt,
            }
            await reconcileQueue.add(
                `reconcile-transaction:${transactionId}:${attempt}`,
                superJson.stringify(payload),
            )
        }

        const waitForStatus = async (
            transactionId: string,
            status: TransactionStatus,
        ): Promise<void> => until(async () => {
            const transaction = await entityManager.findOneByOrFail(
                TransactionEntity,
                {
                    id: transactionId,
                },
            )
            return transaction.status === status
        },
        {
            timeout: 20_000,
            describe: `transaction ${transactionId} to become ${status}`,
        })

        it("grants an AI tier when PayOS reports paid",
            async () => {
                const user = await seedUser("payos-ai")
                const transaction = await seedTransaction({
                    actionType: ActionType.AiSubscriptionPurchase,
                    paymentType: PaymentType.PayOS,
                    referenceId: "910001",
                    user,
                    aiSubTier: AiSubTier.Plus,
                })
                gateways.payos.paymentRequests.get.mockResolvedValue({
                    status: "PAID",
                })

                await publish(transaction.id)
                await waitForStatus(transaction.id,
                    TransactionStatus.Succeeded)

                const subscription = await entityManager.findOneOrFail(
                    AiSubscriptionEntity,
                    {
                        where: {
                            user: {
                                id: user.id,
                            },
                        },
                    },
                )
                expect(subscription.tier).toBe(AiSubTier.Plus)
            })

        it("activates membership when Stripe reports paid",
            async () => {
                const user = await seedUser("stripe-membership")
                const transaction = await seedTransaction({
                    actionType: ActionType.MembershipPurchase,
                    paymentType: PaymentType.Stripe,
                    referenceId: "stripe-membership",
                    user,
                })
                gateways.stripe.checkout.sessions.retrieve.mockResolvedValue({
                    payment_status: "paid",
                    status: "complete",
                })

                await publish(transaction.id)
                await waitForStatus(transaction.id,
                    TransactionStatus.Succeeded)

                const membership = await entityManager.findOneByOrFail(
                    MembershipEntity,
                    {
                        user: {
                            id: user.id,
                        },
                    },
                )
                expect(membership.status).toBe(MembershipStatus.Active)
            })

        it("hands a paid PayPal enrollment to the real enroll queue",
            async () => {
                const user = await seedUser("paypal-enroll")
                const course = await entityManager.save(
                    entityManager.create(CourseEntity,
                        {
                            title: "Reconciled course",
                            displayId: "reconciled-course",
                            description: "payment reconciliation fixture",
                            originalPrice: 500_000,
                            defaultLocale: Locale.En,
                        }),
                )
                const transaction = await seedTransaction({
                    actionType: ActionType.Enroll,
                    paymentType: PaymentType.Paypal,
                    referenceId: "paypal-enroll",
                    user,
                    course,
                })
                await entityManager.save(
                    entityManager.create(TransactionItemEntity,
                        {
                            transaction,
                            course,
                            amount: transaction.amount,
                            discountPercent: 0,
                            pricingPhase: PricingPhase.Regular,
                        }),
                )
                gateways.paypal.retrieveOrder.mockResolvedValue({
                    status: "COMPLETED",
                })

                await publish(transaction.id)
                await until(async () => {
                    const count = await entityManager.count(JobEntity,
                        {
                            where: {
                                actionType: ActionType.Enroll,
                            },
                        })
                    return count === 1
                },
                {
                    timeout: 20_000,
                    describe: "the paid enrollment to reach the enroll queue",
                })

                expect(await enrollQueue.getWaitingCount()).toBe(1)
            })

        it("applies a paid crypto installment to the plan ledger",
            async () => {
                const user = await seedUser("crypto-installment")
                const plan = await entityManager.save(
                    entityManager.create(InstallmentPlanEntity,
                        {
                            user,
                            originTransaction: null,
                            lockedCourseIds: [],
                            planType: InstallmentPlanType.FlexiblePool,
                            status: InstallmentPlanStatus.Overdue,
                            months: null,
                            monthlyAmountVnd: null,
                            totalAmountVnd: null,
                            markupPercent: null,
                            installmentsPaid: 0,
                            remainingVnd: 1_000_000,
                            minPaymentFloorVnd: 500_000,
                            minPaymentPercent: 10,
                            nextDueAt: new Date("2026-08-01T00:00:00.000Z"),
                            secondReminderAfterDays: 7,
                            lockoutAfterDays: 14,
                            dueRemindedAt: null,
                            secondRemindedAt: null,
                        }),
                )
                const transaction = await seedTransaction({
                    actionType: ActionType.InstallmentPayment,
                    paymentType: PaymentType.Crypto,
                    referenceId: "crypto-installment",
                    user,
                    installmentPlanId: plan.id,
                })
                gateways.crypto.getInvoiceStatus.mockResolvedValue({
                    paid: true,
                })

                await publish(transaction.id)
                await waitForStatus(transaction.id,
                    TransactionStatus.Succeeded)

                const updated = await entityManager.findOneByOrFail(
                    InstallmentPlanEntity,
                    {
                        id: plan.id,
                    },
                )
                expect(updated.remainingVnd).toBe(500_000)
                expect(updated.status).toBe(InstallmentPlanStatus.Active)
            })

        it("marks a SePay transaction unpaid on a terminal gateway state",
            async () => {
                const user = await seedUser("sepay-unpaid")
                const transaction = await seedTransaction({
                    actionType: ActionType.Enroll,
                    paymentType: PaymentType.Sepay,
                    referenceId: "sepay-unpaid",
                    user,
                })
                gateways.sepay.order.retrieve.mockResolvedValue({
                    data: {
                        data: {
                            order_status: "CANCELLED",
                        },
                    },
                })

                await publish(transaction.id)
                await waitForStatus(transaction.id,
                    TransactionStatus.Unpaid)
            })

        it("retries an unknown gateway response and later settles paid",
            async () => {
                const user = await seedUser("payos-retry")
                const transaction = await seedTransaction({
                    actionType: ActionType.AiSubscriptionPurchase,
                    paymentType: PaymentType.PayOS,
                    referenceId: "910002",
                    user,
                    aiSubTier: AiSubTier.Plus,
                })
                gateways.payos.paymentRequests.get
                    .mockRejectedValueOnce(new Error("gateway timeout"))
                    .mockResolvedValueOnce({
                        status: "PAID",
                    })

                await publish(transaction.id)
                await waitForStatus(transaction.id,
                    TransactionStatus.Succeeded)

                expect(gateways.payos.paymentRequests.get).toHaveBeenCalledTimes(2)
                expect(await entityManager.count(AiSubscriptionEntity,
                    {
                        where: {
                            user: {
                                id: user.id,
                            },
                        },
                    })).toBe(1)
            })

        it("exhausts repeated unknown responses and marks non-crypto unpaid",
            async () => {
                const user = await seedUser("payos-exhausted")
                const transaction = await seedTransaction({
                    actionType: ActionType.Enroll,
                    paymentType: PaymentType.PayOS,
                    referenceId: "910003",
                    user,
                })
                gateways.payos.paymentRequests.get.mockResolvedValue({
                    status: "PENDING",
                })

                await publish(transaction.id)
                await waitForStatus(transaction.id,
                    TransactionStatus.Unpaid)

                expect(gateways.payos.paymentRequests.get).toHaveBeenCalledTimes(2)
            })

        it("grants exactly once when a PayOS webhook races the reconcile worker",
            async () => {
                const user = await seedUser("payos-race")
                const transaction = await seedTransaction({
                    actionType: ActionType.AiSubscriptionPurchase,
                    paymentType: PaymentType.PayOS,
                    referenceId: "910004",
                    user,
                    aiSubTier: AiSubTier.Plus,
                })
                gateways.payos.webhooks.verify.mockResolvedValue(undefined)
                gateways.payos.paymentRequests.get.mockResolvedValue({
                    status: "PAID",
                })

                await Promise.all([
                    request(app.getHttpServer())
                        .post("/v1/payos/webhook")
                        .send({
                            code: "00",
                            success: true,
                            data: {
                                orderCode: "910004",
                                amount: transaction.amount,
                            },
                            signature: "valid-signature",
                        })
                        .expect(201),
                    publish(transaction.id),
                ])
                await waitForStatus(transaction.id,
                    TransactionStatus.Succeeded)

                expect(await entityManager.count(AiSubscriptionEntity,
                    {
                        where: {
                            user: {
                                id: user.id,
                            },
                        },
                    })).toBe(1)
            })
    })
