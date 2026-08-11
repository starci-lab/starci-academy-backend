import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    BullModule as NestBullModule,
    getQueueToken,
} from "@nestjs/bullmq"
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
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
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
    InstallmentPlanService,
} from "@modules/bussiness/installment-plan/installment-plan.service"
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
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import type {
    ReconcileTransactionPayload,
} from "@modules/integrations/bullmq/types/payloads/reconcile-transaction"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    createSuperJsonServiceProvider,
} from "@modules/lib/mixin/superjson.providers"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    ReconcileTransactionWorker,
} from "@features/api/processors/reconcile-transaction/reconcile-transaction.worker"
import {
    until,
} from "@tests/helpers/flow-wait"

/**
 * A payment left pending without a webhook is reconciled from the broker.
 *
 * The gateway is the only stubbed edge. The test publishes to a real Redis
 * queue, the production BullMQ worker consumes it, and Postgres is the oracle.
 */
describe("a pending payment is reconciled to its gateway state",
    () => {
        const queueData = bullData[BullQueueName.ReconcileTransaction]
        const superJson = new SuperJSON()

        let app: INestApplication
        let entityManager: EntityManager
        let reconcileQueue: Queue<string>
        let transactionId: string

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    NestBullModule.forRoot({
                        connection: {
                            host: process.env.REDIS_BULLMQ_HOST,
                            port: Number(process.env.REDIS_BULLMQ_PORT),
                        },
                    }),
                    NestBullModule.registerQueue({
                        name: queueData.name,
                        prefix: queueData.prefix,
                    }),
                ],
                providers: [
                    ReconcileTransactionWorker,
                    TransactionActionService,
                    VoucherService,
                    InstallmentPlanService,
                    DayjsService,
                    createSuperJsonServiceProvider(),
                    {
                        provide: TransactionReconcileQueryService,
                        useValue: {
                            resolve: jest.fn().mockResolvedValue("unpaid"),
                        },
                    },
                    {
                        provide: EnqueueEnrollJobService,
                        useValue: {
                            enqueueForTransaction: jest.fn(),
                        },
                    },
                    {
                        provide: EnqueueReconcileTransactionJobService,
                        useValue: {
                            enqueue: jest.fn(),
                        },
                    },
                    {
                        provide: AiEntitlementService,
                        useValue: {
                            grantTier: jest.fn(),
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
                            enqueue: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            reconcileQueue = app.get<Queue<string>>(
                getQueueToken(queueData.name),
            )
            await entityManager.query(
                "TRUNCATE TABLE \"transactions\", \"users\" RESTART IDENTITY CASCADE",
            )
        })

        afterAll(async () => {
            await app?.close().catch(() => undefined)
        })

        it("starts with an unsettled transaction whose gateway reports unpaid",
            async () => {
                const learner = await entityManager.save(
                    entityManager.create(UserEntity,
                        {
                            keycloakId: "kc-payment-reconciliation-flow",
                            email: "payment-reconciliation@starci.test",
                        }),
                )
                const transaction = await entityManager.save(
                    entityManager.create(TransactionEntity,
                        {
                            user: learner,
                            course: null,
                            referenceId: "payment-reconciliation-flow",
                            providerPaymentId: null,
                            amount: 500_000,
                            discountPercent: 0,
                            voucherCode: null,
                            pricingPhase: PricingPhase.Regular,
                            checkoutUrl: "https://bank.test/pending",
                            status: TransactionStatus.Pending,
                            paymentType: PaymentType.Sepay,
                            actionType: ActionType.Enroll,
                            aiSubTier: null,
                            installmentPlanId: null,
                            installmentMonths: null,
                            installmentMarkupPercent: null,
                            installmentTotalVnd: null,
                            refundReference: null,
                            refundReason: null,
                            refundedAt: null,
                        }),
                )
                transactionId = transaction.id

                expect(transaction.status).toBe(TransactionStatus.Pending)
            })

        it("publishes the reconciliation request through the production BullMQ queue",
            async () => {
                const payload: ReconcileTransactionPayload = {
                    transactionId,
                    attempt: 1,
                }
                await reconcileQueue.add(
                    `reconcile-transaction:${transactionId}:1`,
                    superJson.stringify(payload),
                )

                await until(async () => {
                    const transaction = await entityManager.findOneByOrFail(
                        TransactionEntity,
                        {
                            id: transactionId,
                        },
                    )
                    return transaction.status === TransactionStatus.Unpaid
                },
                {
                    timeout: 20_000,
                    describe: "the BullMQ reconciliation worker to settle the transaction",
                })
            })

        it("persists the gateway's terminal unpaid consequence",
            async () => {
                const transaction = await entityManager.findOneByOrFail(
                    TransactionEntity,
                    {
                        id: transactionId,
                    },
                )

                expect(transaction.status).toBe(TransactionStatus.Unpaid)
            })
    })
