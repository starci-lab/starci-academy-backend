import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    Job,
} from "bullmq"
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
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    AiSubTier,
} from "@modules/databases/postgresql/primary/enums/ai-sub-tier"
import {
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import * as transactionalEmail from "@modules/integrations/transactional-email/grant-emails"
import {
    ReconcileTransactionWorker,
} from "./reconcile-transaction.worker"

jest.mock("@modules/integrations/transactional-email/grant-emails",
    () => ({
        enqueueSubscriptionActiveEmail: jest.fn(),
        enqueueMembershipActiveEmail: jest.fn(),
        enqueuePaymentFailedEmail: jest.fn(),
    }))

const POSTGRESQL_PRIMARY = "primary"
const SUPERJSON = "SUPERJSON"
const TRANSACTION_ID = "txn-1"
const USER_ID = "user-1"
const maxAttempts = envConfig().services.api.transaction.reconcile.maxAttempts
const slowDelayMs = envConfig().services.api.transaction.reconcile.slowDelayMs

const job = (
    attempt = 1,
    lane: "fast" | "slow" = "fast",
): Job<string> => ({
    data: JSON.stringify({
        transactionId: TRANSACTION_ID,
        attempt,
        lane,
    }),
}) as Job<string>

const transaction = (
    overrides: Partial<TransactionEntity> = {
    },
): TransactionEntity => ({
    id: TRANSACTION_ID,
    userId: USER_ID,
    status: TransactionStatus.Pending,
    paymentType: PaymentType.PayOS,
    actionType: ActionType.Enroll,
    aiSubTier: null,
    installmentPlanId: null,
    amount: 100_000,
    ...overrides,
}) as TransactionEntity

describe("ReconcileTransactionWorker",
    () => {
        let module: TestingModule
        let worker: ReconcileTransactionWorker
        let entityManager: EntityManagerMock
        let resolve: jest.Mock
        let updateStatus: jest.Mock
        let enqueueEnroll: jest.Mock
        let enqueueReconcile: jest.Mock
        let grantTier: jest.Mock
        let grantMembership: jest.Mock
        let releaseVoucher: jest.Mock
        let applyInstallment: jest.Mock
        let log: jest.Mock

        beforeEach(async () => {
            jest.clearAllMocks()
            entityManager = makeEntityManagerMock()
            resolve = jest.fn()
            updateStatus = jest.fn().mockResolvedValue(true)
            enqueueEnroll = jest.fn().mockResolvedValue({
                enqueuedCount: 1,
            })
            enqueueReconcile = jest.fn().mockResolvedValue(undefined)
            grantTier = jest.fn().mockResolvedValue(true)
            grantMembership = jest.fn().mockResolvedValue(true)
            releaseVoucher = jest.fn().mockResolvedValue(undefined)
            applyInstallment = jest.fn().mockResolvedValue(true)
            log = jest.fn()

            module = await Test.createTestingModule({
                providers: [
                    ReconcileTransactionWorker,
                    {
                        provide: SUPERJSON,
                        useValue: {
                            parse: (data: string) => JSON.parse(data),
                        },
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: TransactionReconcileQueryService,
                        useValue: {
                            resolve,
                        },
                    },
                    {
                        provide: TransactionActionService,
                        useValue: {
                            updateTransactionStatusIfExpected: updateStatus,
                        },
                    },
                    {
                        provide: EnqueueEnrollJobService,
                        useValue: {
                            enqueueForTransaction: enqueueEnroll,
                        },
                    },
                    {
                        provide: EnqueueReconcileTransactionJobService,
                        useValue: {
                            enqueue: enqueueReconcile,
                        },
                    },
                    {
                        provide: AiEntitlementService,
                        useValue: {
                            grantTier,
                        },
                    },
                    {
                        provide: MembershipService,
                        useValue: {
                            grantMembership,
                        },
                    },
                    {
                        provide: VoucherService,
                        useValue: {
                            release: releaseVoucher,
                        },
                    },
                    {
                        provide: InstallmentPlanService,
                        useValue: {
                            applyPaymentForTransaction: applyInstallment,
                        },
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: {
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log,
                        },
                    },
                ],
            }).compile()
            worker = module.get(ReconcileTransactionWorker)
        })

        afterEach(async () => module.close())

        it.each([
            null,
            transaction({
                status: TransactionStatus.Succeeded,
            }),
            transaction({
                status: TransactionStatus.Unpaid,
            }),
        ])("no-ops for a missing or terminal transaction",
            async (row) => {
                entityManager.findOne.mockResolvedValueOnce(row)
                await worker.process(job())
                expect(resolve).not.toHaveBeenCalled()
                expect(enqueueReconcile).not.toHaveBeenCalled()
            })

        it("grants an AI tier and sends the activation email only for a new grant",
            async () => {
                entityManager.findOne.mockResolvedValue(transaction({
                    actionType: ActionType.AiSubscriptionPurchase,
                    aiSubTier: AiSubTier.Pro,
                }))
                resolve.mockResolvedValue({
                    state: "paid",
                    providerStatus: "PAID",
                })
                await worker.process(job())
                expect(grantTier).toHaveBeenCalledWith({
                    userId: USER_ID,
                    tier: AiSubTier.Pro,
                    transactionId: TRANSACTION_ID,
                })
                expect(transactionalEmail.enqueueSubscriptionActiveEmail).toHaveBeenCalledTimes(1)

                grantTier.mockResolvedValueOnce(false)
                await worker.process(job())
                expect(transactionalEmail.enqueueSubscriptionActiveEmail).toHaveBeenCalledTimes(1)
            })

        it("does not grant a malformed AI purchase without a tier",
            async () => {
                entityManager.findOne.mockResolvedValue(transaction({
                    actionType: ActionType.AiSubscriptionPurchase,
                    aiSubTier: null,
                }))
                resolve.mockResolvedValue({
                    state: "paid",
                    providerStatus: "PAID",
                })
                await worker.process(job())
                expect(grantTier).not.toHaveBeenCalled()
            })

        it("grants membership and sends activation email only for a new grant",
            async () => {
                entityManager.findOne.mockResolvedValue(transaction({
                    actionType: ActionType.MembershipPurchase,
                }))
                resolve.mockResolvedValue({
                    state: "paid",
                    providerStatus: "PAID",
                })
                await worker.process(job())
                expect(grantMembership).toHaveBeenCalledWith({
                    userId: USER_ID,
                    transactionId: TRANSACTION_ID,
                })
                expect(transactionalEmail.enqueueMembershipActiveEmail).toHaveBeenCalledTimes(1)

                grantMembership.mockResolvedValueOnce(false)
                await worker.process(job())
                expect(transactionalEmail.enqueueMembershipActiveEmail).toHaveBeenCalledTimes(1)
            })

        it("delegates paid enrollment to the enroll worker",
            async () => {
                const row = transaction()
                entityManager.findOne.mockResolvedValue(row)
                resolve.mockResolvedValue({
                    state: "paid",
                    providerStatus: "PAID",
                })
                await worker.process(job())
                expect(enqueueEnroll).toHaveBeenCalledWith({
                    transaction: row,
                })
            })

        it("applies a paid installment only when a plan id exists",
            async () => {
                entityManager.findOne.mockResolvedValue(transaction({
                    actionType: ActionType.InstallmentPayment,
                    installmentPlanId: "plan-1",
                    amount: 250_000,
                }))
                resolve.mockResolvedValue({
                    state: "paid",
                    providerStatus: "PAID",
                })
                await worker.process(job())
                expect(applyInstallment).toHaveBeenCalledWith({
                    transactionId: TRANSACTION_ID,
                    planId: "plan-1",
                    paidAmountVnd: 250_000,
                })

                applyInstallment.mockClear()
                entityManager.findOne.mockResolvedValue(transaction({
                    actionType: ActionType.InstallmentPayment,
                    installmentPlanId: null,
                }))
                await worker.process(job())
                expect(applyInstallment).not.toHaveBeenCalled()
            })

        it("no-ops for a paid non-payment action",
            async () => {
                entityManager.findOne.mockResolvedValue(transaction({
                    actionType: ActionType.ProcessVideo,
                }))
                resolve.mockResolvedValue({
                    state: "paid",
                    providerStatus: "PAID",
                })
                await worker.process(job())
                expect(enqueueEnroll).not.toHaveBeenCalled()
                expect(grantTier).not.toHaveBeenCalled()
            })

        it("keeps an underpayment pending and moves it to slow retry",
            async () => {
                entityManager.findOne.mockResolvedValue(transaction({
                    amount: 100_000,
                }))
                resolve.mockResolvedValue({
                    state: "paid",
                    providerStatus: "PAID",
                    reportedAmount: 90_000,
                })
                await worker.process(job(maxAttempts))
                expect(enqueueEnroll).not.toHaveBeenCalled()
                expect(enqueueReconcile).toHaveBeenCalledWith({
                    transactionId: TRANSACTION_ID,
                    attempt: maxAttempts,
                    lane: "slow",
                    delayMs: slowDelayMs,
                })
            })

        it("writes terminal-unpaid and runs failure side effects only when its claim wins",
            async () => {
                entityManager.findOne.mockResolvedValue(transaction())
                resolve.mockResolvedValue({
                    state: "terminal-unpaid",
                    providerStatus: "EXPIRED",
                })
                await worker.process(job())
                expect(updateStatus).toHaveBeenCalledWith({
                    id: TRANSACTION_ID,
                    status: TransactionStatus.Unpaid,
                    expectedStatus: TransactionStatus.Pending,
                })
                expect(releaseVoucher).toHaveBeenCalledTimes(1)
                expect(transactionalEmail.enqueuePaymentFailedEmail).toHaveBeenCalledTimes(1)

                updateStatus.mockResolvedValueOnce(false)
                releaseVoucher.mockClear()
                jest.mocked(transactionalEmail.enqueuePaymentFailedEmail).mockClear()
                await worker.process(job())
                expect(releaseVoucher).not.toHaveBeenCalled()
                expect(transactionalEmail.enqueuePaymentFailedEmail).not.toHaveBeenCalled()
            })

        it("propagates a terminal status write failure without side effects",
            async () => {
                entityManager.findOne.mockResolvedValue(transaction())
                resolve.mockResolvedValue({
                    state: "terminal-unpaid",
                    providerStatus: "EXPIRED",
                })
                updateStatus.mockRejectedValueOnce(new Error("db down"))
                await expect(worker.process(job())).rejects.toThrow("db down")
                expect(releaseVoucher).not.toHaveBeenCalled()
            })

        it.each([
            [
                {
                    state: "pending",
                    providerStatus: "PENDING",
                },
                1,
            ],
            [
                {
                    state: "unavailable",
                    reason: "provider-error",
                },
                2,
            ],
        ])("fast-retries unresolved provider result %#",
            async (result, attempt) => {
                entityManager.findOne.mockResolvedValue(transaction())
                resolve.mockResolvedValue(result)
                await worker.process(job(attempt))
                expect(enqueueReconcile).toHaveBeenCalledWith({
                    transactionId: TRANSACTION_ID,
                    attempt: attempt + 1,
                    lane: "fast",
                })
                expect(updateStatus).not.toHaveBeenCalled()
            })

        it.each([
            {
                state: "pending",
                providerStatus: "PENDING",
            },
            {
                state: "unavailable",
                reason: "invalid-response",
            },
        ])("slow-retries an unresolved result after the fast budget",
            async (result) => {
                entityManager.findOne.mockResolvedValue(transaction())
                resolve.mockResolvedValue(result)
                await worker.process(job(maxAttempts))
                expect(enqueueReconcile).toHaveBeenCalledWith({
                    transactionId: TRANSACTION_ID,
                    attempt: maxAttempts,
                    lane: "slow",
                    delayMs: slowDelayMs,
                })
                expect(updateStatus).not.toHaveBeenCalled()
            })

        it("propagates provider and grant failures",
            async () => {
                entityManager.findOne.mockResolvedValue(transaction())
                resolve.mockRejectedValueOnce(new Error("adapter bug"))
                await expect(worker.process(job())).rejects.toThrow("adapter bug")

                resolve.mockResolvedValueOnce({
                    state: "paid",
                    providerStatus: "PAID",
                })
                enqueueEnroll.mockRejectedValueOnce(new Error("enroll queue down"))
                await expect(worker.process(job())).rejects.toThrow("enroll queue down")
            })

        it("logs normalized state and decision without provider payload",
            async () => {
                entityManager.findOne.mockResolvedValue(transaction())
                resolve.mockResolvedValue({
                    state: "paid",
                    providerStatus: "PAID",
                })
                await worker.process(job())
                expect(log).toHaveBeenCalledWith(
                    WinstonLog.TransactionReconcilePolled,
                    {
                        transactionId: TRANSACTION_ID,
                        attempt: 1,
                        maxAttempts,
                        status: "paid",
                        decision: "finalize",
                    },
                )
            })

        it("skips provider polling when the transaction is already finalized",
            async () => {
                entityManager.findOne.mockResolvedValue(transaction({
                    status: TransactionStatus.Succeeded,
                }))

                await expect(worker.process(job())).resolves.toBeUndefined()

                expect(resolve).not.toHaveBeenCalled()
                expect(updateStatus).not.toHaveBeenCalled()
            })
    })
