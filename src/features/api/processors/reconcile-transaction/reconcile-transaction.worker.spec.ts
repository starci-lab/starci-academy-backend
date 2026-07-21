// Load the bussiness barrel first so its base classes are initialised before the
// worker pulls its deps — dodges a load-order "Class extends value undefined"
// cycle (mirrors the CV-scoring worker specs).
import "@modules/bussiness"
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
} from "@modules/ai"
import {
    EnqueueEnrollJobService,
    EnqueueReconcileTransactionJobService,
    EnqueueSendMailJobService,
    InstallmentPlanService,
    TransactionActionService,
    TransactionReconcileQueryService,
    VoucherService,
} from "@modules/bussiness"
import {
    MembershipService,
} from "@modules/membership"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    ActionType,
    AiSubTier,
    PaymentType,
    TransactionEntity,
    TransactionStatus,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import * as transactionalEmail from "@modules/transactional-email"
import {
    ReconcileTransactionWorker,
} from "./reconcile-transaction.worker"

// the worker calls these three free functions directly (not through DI) — stub
// the whole module so a "finalize"/"unpaid" branch never touches the real
// mailer plumbing (which needs its own deep dependency chain).
jest.mock("@modules/transactional-email",
    () => ({
        enqueueSubscriptionActiveEmail: jest.fn(),
        enqueueMembershipActiveEmail: jest.fn(),
        enqueuePaymentFailedEmail: jest.fn(),
    }))

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** SuperJSON injection token (see `@modules/mixin` superjson provider). */
const SUPERJSON = "SUPERJSON"

/** The transaction id every fixture uses. */
const TRANSACTION_ID = "txn-1"

/** The buyer id every fixture uses. */
const USER_ID = "user-1"

/**
 * Build a minimal BullMQ job stand-in carrying only the fields the worker reads.
 * `data` is real JSON (not SuperJSON's wire format) — the SuperJSON stub below
 * just runs it through `JSON.parse`, so the wrapper format is irrelevant here.
 *
 * @param payload - The `{ transactionId, attempt }` poll payload.
 * @returns a Job-typed stub with id / data / queueName populated.
 */
const fakeBullJob = (
    payload: { transactionId: string, attempt: number },
): Job<string> => ({
    id: "job-1",
    data: JSON.stringify(payload),
    queueName: "reconcile-transaction",
}) as unknown as Job<string>

/** Build a pending-transaction fixture; override per test (status/paymentType/actionType/…). */
const buildTransaction = (
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
    amount: 100000,
    ...overrides,
} as TransactionEntity)

describe("ReconcileTransactionWorker",
    () => {
        // 1-based; the worker's own "exhausted" guard is `attempt >= maxAttempts`
        const maxAttempts = envConfig().services.api.transaction.reconcile.maxAttempts

        let module: TestingModule
        let worker: ReconcileTransactionWorker
        let entityManager: EntityManagerMock
        let transactionReconcileQueryService: { resolve: jest.Mock }
        let transactionActionService: { updateTransactionStatusIfExpected: jest.Mock }
        let enqueueEnrollJobService: { enqueueForTransaction: jest.Mock }
        let enqueueReconcileTransactionJobService: { enqueue: jest.Mock }
        let aiEntitlementService: { grantTier: jest.Mock }
        let membershipService: { grantMembership: jest.Mock }
        let winstonService: { log: jest.Mock }
        let voucherService: { release: jest.Mock }
        let installmentPlanService: { applyPaymentForTransaction: jest.Mock }

        beforeEach(async () => {
            // clears call history on the module-level `@modules/transactional-email` mocks too
            jest.clearAllMocks()

            entityManager = makeEntityManagerMock()
            // superJson.parse just round-trips the plain-JSON fixture payload
            const superJson = {
                parse: jest.fn((data: string) => JSON.parse(data)),
                stringify: jest.fn(),
            }
            transactionReconcileQueryService = {
                resolve: jest.fn(),
            }
            transactionActionService = {
                updateTransactionStatusIfExpected: jest.fn().mockResolvedValue(true),
            }
            enqueueEnrollJobService = {
                enqueueForTransaction: jest.fn().mockResolvedValue({
                    enqueuedCount: 1,
                }),
            }
            enqueueReconcileTransactionJobService = {
                enqueue: jest.fn().mockResolvedValue(undefined),
            }
            aiEntitlementService = {
                grantTier: jest.fn().mockResolvedValue(true),
            }
            membershipService = {
                grantMembership: jest.fn().mockResolvedValue(true),
            }
            winstonService = {
                log: jest.fn(),
            }
            voucherService = {
                release: jest.fn().mockResolvedValue(undefined),
            }
            installmentPlanService = {
                applyPaymentForTransaction: jest.fn().mockResolvedValue(true),
            }

            module = await Test.createTestingModule({
                providers: [
                    ReconcileTransactionWorker,
                    {
                        provide: SUPERJSON,
                        useValue: superJson,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: TransactionReconcileQueryService,
                        useValue: transactionReconcileQueryService,
                    },
                    {
                        provide: TransactionActionService,
                        useValue: transactionActionService,
                    },
                    {
                        provide: EnqueueEnrollJobService,
                        useValue: enqueueEnrollJobService,
                    },
                    {
                        provide: EnqueueReconcileTransactionJobService,
                        useValue: enqueueReconcileTransactionJobService,
                    },
                    {
                        provide: AiEntitlementService,
                        useValue: aiEntitlementService,
                    },
                    {
                        provide: MembershipService,
                        useValue: membershipService,
                    },
                    {
                        provide: WinstonService,
                        useValue: winstonService,
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: {
                        },
                    },
                    {
                        provide: VoucherService,
                        useValue: voucherService,
                    },
                    {
                        provide: InstallmentPlanService,
                        useValue: installmentPlanService,
                    },
                ],
            }).compile()

            worker = module.get(ReconcileTransactionWorker)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("gone or already finalized",
            () => {
                it("no-ops when the transaction cannot be found (row gone)",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await worker.process(fakeBullJob({
                            transactionId: TRANSACTION_ID,
                            attempt: 1,
                        }))

                        expect(transactionReconcileQueryService.resolve).not.toHaveBeenCalled()
                        expect(winstonService.log).not.toHaveBeenCalled()
                    })

                it("no-ops when the webhook already finalized the transaction (status no longer Pending)",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(buildTransaction({
                            status: TransactionStatus.Succeeded,
                        }))

                        await worker.process(fakeBullJob({
                            transactionId: TRANSACTION_ID,
                            attempt: 1,
                        }))

                        expect(transactionReconcileQueryService.resolve).not.toHaveBeenCalled()
                    })
            })

        describe("gateway status: paid -> finalize",
            () => {
                it("grants the AI tier and emails the buyer for a paid AiSubscriptionPurchase",
                    async () => {
                        const transaction = buildTransaction({
                            actionType: ActionType.AiSubscriptionPurchase,
                            aiSubTier: AiSubTier.Pro,
                        })
                        entityManager.findOne.mockResolvedValueOnce(transaction)
                        transactionReconcileQueryService.resolve.mockResolvedValueOnce("paid")

                        await worker.process(fakeBullJob({
                            transactionId: TRANSACTION_ID,
                            attempt: 1,
                        }))

                        expect(aiEntitlementService.grantTier).toHaveBeenCalledWith({
                            userId: USER_ID,
                            tier: AiSubTier.Pro,
                            transactionId: TRANSACTION_ID,
                        })
                        expect(transactionalEmail.enqueueSubscriptionActiveEmail).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: USER_ID,
                                tier: AiSubTier.Pro,
                            }),
                        )
                    })

                it("does not email when grantTier reports no new grant (idempotent replay)",
                    async () => {
                        aiEntitlementService.grantTier.mockResolvedValueOnce(false)
                        const transaction = buildTransaction({
                            actionType: ActionType.AiSubscriptionPurchase,
                            aiSubTier: AiSubTier.Pro,
                        })
                        entityManager.findOne.mockResolvedValueOnce(transaction)
                        transactionReconcileQueryService.resolve.mockResolvedValueOnce("paid")

                        await worker.process(fakeBullJob({
                            transactionId: TRANSACTION_ID,
                            attempt: 1,
                        }))

                        expect(transactionalEmail.enqueueSubscriptionActiveEmail).not.toHaveBeenCalled()
                    })

                it("does nothing for a paid AiSubscriptionPurchase with no target tier (malformed row)",
                    async () => {
                        const transaction = buildTransaction({
                            actionType: ActionType.AiSubscriptionPurchase,
                            aiSubTier: null,
                        })
                        entityManager.findOne.mockResolvedValueOnce(transaction)
                        transactionReconcileQueryService.resolve.mockResolvedValueOnce("paid")

                        await worker.process(fakeBullJob({
                            transactionId: TRANSACTION_ID,
                            attempt: 1,
                        }))

                        expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                        expect(transactionalEmail.enqueueSubscriptionActiveEmail).not.toHaveBeenCalled()
                    })

                it("grants membership and emails the buyer for a paid MembershipPurchase",
                    async () => {
                        const transaction = buildTransaction({
                            actionType: ActionType.MembershipPurchase,
                        })
                        entityManager.findOne.mockResolvedValueOnce(transaction)
                        transactionReconcileQueryService.resolve.mockResolvedValueOnce("paid")

                        await worker.process(fakeBullJob({
                            transactionId: TRANSACTION_ID,
                            attempt: 1,
                        }))

                        expect(membershipService.grantMembership).toHaveBeenCalledWith({
                            userId: USER_ID,
                            transactionId: TRANSACTION_ID,
                        })
                        expect(transactionalEmail.enqueueMembershipActiveEmail).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: USER_ID,
                            }),
                        )
                    })

                it("does not email when grantMembership reports no new grant (idempotent replay)",
                    async () => {
                        membershipService.grantMembership.mockResolvedValueOnce(false)
                        const transaction = buildTransaction({
                            actionType: ActionType.MembershipPurchase,
                        })
                        entityManager.findOne.mockResolvedValueOnce(transaction)
                        transactionReconcileQueryService.resolve.mockResolvedValueOnce("paid")

                        await worker.process(fakeBullJob({
                            transactionId: TRANSACTION_ID,
                            attempt: 1,
                        }))

                        expect(transactionalEmail.enqueueMembershipActiveEmail).not.toHaveBeenCalled()
                    })

                it("delegates to the enroll job service for a paid Enroll transaction",
                    async () => {
                        const transaction = buildTransaction({
                            actionType: ActionType.Enroll,
                        })
                        entityManager.findOne.mockResolvedValueOnce(transaction)
                        transactionReconcileQueryService.resolve.mockResolvedValueOnce("paid")

                        await worker.process(fakeBullJob({
                            transactionId: TRANSACTION_ID,
                            attempt: 1,
                        }))

                        expect(enqueueEnrollJobService.enqueueForTransaction).toHaveBeenCalledWith({
                            transaction,
                        })
                    })

                it("applies the installment cycle payment when the plan id is present",
                    async () => {
                        const transaction = buildTransaction({
                            actionType: ActionType.InstallmentPayment,
                            installmentPlanId: "plan-1",
                            amount: 250000,
                        })
                        entityManager.findOne.mockResolvedValueOnce(transaction)
                        transactionReconcileQueryService.resolve.mockResolvedValueOnce("paid")

                        await worker.process(fakeBullJob({
                            transactionId: TRANSACTION_ID,
                            attempt: 1,
                        }))

                        expect(installmentPlanService.applyPaymentForTransaction).toHaveBeenCalledWith({
                            transactionId: TRANSACTION_ID,
                            planId: "plan-1",
                            paidAmountVnd: 250000,
                        })
                    })

                it("does nothing for a paid InstallmentPayment with no plan id (malformed row)",
                    async () => {
                        const transaction = buildTransaction({
                            actionType: ActionType.InstallmentPayment,
                            installmentPlanId: null,
                        })
                        entityManager.findOne.mockResolvedValueOnce(transaction)
                        transactionReconcileQueryService.resolve.mockResolvedValueOnce("paid")

                        await worker.process(fakeBullJob({
                            transactionId: TRANSACTION_ID,
                            attempt: 1,
                        }))

                        expect(installmentPlanService.applyPaymentForTransaction).not.toHaveBeenCalled()
                    })

                it("no-ops for a paid transaction whose action type has no finalize handler",
                    async () => {
                        const transaction = buildTransaction({
                            actionType: ActionType.ResolveGithub,
                        })
                        entityManager.findOne.mockResolvedValueOnce(transaction)
                        transactionReconcileQueryService.resolve.mockResolvedValueOnce("paid")

                        await worker.process(fakeBullJob({
                            transactionId: TRANSACTION_ID,
                            attempt: 1,
                        }))

                        expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                        expect(membershipService.grantMembership).not.toHaveBeenCalled()
                        expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
                        expect(installmentPlanService.applyPaymentForTransaction).not.toHaveBeenCalled()
                    })
            })

        describe("gateway status: unpaid -> mark unpaid",
            () => {
                it("marks the transaction unpaid, releases the voucher, and notifies the buyer",
                    async () => {
                        const transaction = buildTransaction()
                        entityManager.findOne.mockResolvedValueOnce(transaction)
                        transactionReconcileQueryService.resolve.mockResolvedValueOnce("unpaid")

                        await worker.process(fakeBullJob({
                            transactionId: TRANSACTION_ID,
                            attempt: 1,
                        }))

                        expect(transactionActionService.updateTransactionStatusIfExpected).toHaveBeenCalledWith({
                            id: TRANSACTION_ID,
                            status: TransactionStatus.Unpaid,
                            expectedStatus: TransactionStatus.Pending,
                        })
                        expect(voucherService.release).toHaveBeenCalledWith({
                            entityManager,
                            transactionId: TRANSACTION_ID,
                        })
                        expect(transactionalEmail.enqueuePaymentFailedEmail).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: USER_ID,
                            }),
                        )
                    })
            })

        describe("gateway status: unknown",
            () => {
                it("re-enqueues the next poll attempt while attempts remain",
                    async () => {
                        const transaction = buildTransaction()
                        entityManager.findOne.mockResolvedValueOnce(transaction)
                        transactionReconcileQueryService.resolve.mockResolvedValueOnce("unknown")

                        await worker.process(fakeBullJob({
                            transactionId: TRANSACTION_ID,
                            attempt: 1,
                        }))

                        expect(enqueueReconcileTransactionJobService.enqueue).toHaveBeenCalledWith({
                            transactionId: TRANSACTION_ID,
                            attempt: 2,
                        })
                        expect(transactionActionService.updateTransactionStatusIfExpected).not.toHaveBeenCalled()
                    })

                it("stops polling WITHOUT marking unpaid once a crypto transaction's attempts are exhausted",
                    async () => {
                        // crypto settles slowly and may clear after the poll budget — never
                        // mark it unpaid, or a late IPN could never grant (see worker docblock)
                        const transaction = buildTransaction({
                            paymentType: PaymentType.Crypto,
                        })
                        entityManager.findOne.mockResolvedValueOnce(transaction)
                        transactionReconcileQueryService.resolve.mockResolvedValueOnce("unknown")

                        await worker.process(fakeBullJob({
                            transactionId: TRANSACTION_ID,
                            attempt: maxAttempts,
                        }))

                        expect(transactionActionService.updateTransactionStatusIfExpected).not.toHaveBeenCalled()
                        expect(enqueueReconcileTransactionJobService.enqueue).not.toHaveBeenCalled()
                        expect(voucherService.release).not.toHaveBeenCalled()
                    })

                it("marks a non-crypto transaction unpaid once attempts are exhausted with no confirmation",
                    async () => {
                        const transaction = buildTransaction({
                            paymentType: PaymentType.PayOS,
                        })
                        entityManager.findOne.mockResolvedValueOnce(transaction)
                        transactionReconcileQueryService.resolve.mockResolvedValueOnce("unknown")

                        await worker.process(fakeBullJob({
                            transactionId: TRANSACTION_ID,
                            attempt: maxAttempts,
                        }))

                        expect(transactionActionService.updateTransactionStatusIfExpected).toHaveBeenCalledWith({
                            id: TRANSACTION_ID,
                            status: TransactionStatus.Unpaid,
                            expectedStatus: TransactionStatus.Pending,
                        })
                        expect(enqueueReconcileTransactionJobService.enqueue).not.toHaveBeenCalled()
                    })
            })

        describe("observability trace",
            () => {
                it("logs the gateway status + chosen decision for every poll",
                    async () => {
                        const transaction = buildTransaction({
                            actionType: ActionType.Enroll,
                        })
                        entityManager.findOne.mockResolvedValueOnce(transaction)
                        transactionReconcileQueryService.resolve.mockResolvedValueOnce("paid")

                        await worker.process(fakeBullJob({
                            transactionId: TRANSACTION_ID,
                            attempt: 1,
                        }))

                        expect(winstonService.log).toHaveBeenCalledWith(
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
            })

        describe("error / exception path",
            () => {
                it("propagates the error when the gateway status lookup itself fails",
                    async () => {
                        const transaction = buildTransaction()
                        entityManager.findOne.mockResolvedValueOnce(transaction)
                        const gatewayError = new Error("gateway timed out")
                        transactionReconcileQueryService.resolve.mockRejectedValueOnce(gatewayError)

                        await expect(
                            worker.process(fakeBullJob({
                                transactionId: TRANSACTION_ID,
                                attempt: 1,
                            })),
                        ).rejects.toThrow("gateway timed out")

                        // the decision/log step never ran — nothing was decided yet
                        expect(winstonService.log).not.toHaveBeenCalled()
                        expect(transactionActionService.updateTransactionStatusIfExpected).not.toHaveBeenCalled()
                    })

                it("propagates the error and skips the voucher release + email when the unpaid status write fails",
                    async () => {
                        const transaction = buildTransaction()
                        entityManager.findOne.mockResolvedValueOnce(transaction)
                        transactionReconcileQueryService.resolve.mockResolvedValueOnce("unpaid")
                        const dbError = new Error("connection terminated unexpectedly")
                        transactionActionService.updateTransactionStatusIfExpected.mockRejectedValueOnce(dbError)

                        await expect(
                            worker.process(fakeBullJob({
                                transactionId: TRANSACTION_ID,
                                attempt: 1,
                            })),
                        ).rejects.toThrow("connection terminated unexpectedly")

                        expect(voucherService.release).not.toHaveBeenCalled()
                        expect(transactionalEmail.enqueuePaymentFailedEmail).not.toHaveBeenCalled()
                    })

                it("propagates the error from finalize when enqueuing the enroll job fails",
                    async () => {
                        const transaction = buildTransaction({
                            actionType: ActionType.Enroll,
                        })
                        entityManager.findOne.mockResolvedValueOnce(transaction)
                        transactionReconcileQueryService.resolve.mockResolvedValueOnce("paid")
                        const enrollError = new Error("broker unavailable")
                        enqueueEnrollJobService.enqueueForTransaction.mockRejectedValueOnce(enrollError)

                        await expect(
                            worker.process(fakeBullJob({
                                transactionId: TRANSACTION_ID,
                                attempt: 1,
                            })),
                        ).rejects.toThrow("broker unavailable")
                    })
            })
    })
