// Load the bussiness barrel first so its CQRS base classes are initialised before the
// handler pulls them in -- dodges a load-order "Class extends value undefined" cycle.
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    InstallmentPlanService,
} from "@modules/bussiness/installment-plan/installment-plan.service"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    InstallmentPlanEntity,
} from "@modules/databases/postgresql/primary/entities/installment-plan.entity"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    InstallmentPlanStatus,
} from "@modules/databases/postgresql/primary/enums/installment-plan-status"
import {
    InstallmentPlanType,
} from "@modules/databases/postgresql/primary/enums/installment-plan-type"
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
    PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException,
} from "@modules/platform/exceptions/errors/courses/payos-return-url-and-payos-cancel-url-must-be-required"
import {
    InstallmentAmountBelowMinimumException,
} from "@modules/platform/exceptions/errors/payment/installment-amount-below-minimum"
import {
    InstallmentCurrencyNotSupportedException,
} from "@modules/platform/exceptions/errors/payment/installment-currency-not-supported"
import {
    InstallmentCustomAmountNotAllowedException,
} from "@modules/platform/exceptions/errors/payment/installment-custom-amount-not-allowed"
import {
    InstallmentPlanNotFoundException,
} from "@modules/platform/exceptions/errors/payment/installment-plan-not-found"
import {
    InstallmentPlanNotPayableException,
} from "@modules/platform/exceptions/errors/payment/installment-plan-not-payable"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    RetryService,
} from "@modules/lib/mixin/retry.service"
import {
    PAYOS,
} from "@modules/integrations/payos/constants/payos"
import {
    SEPAY,
} from "@modules/integrations/sepay/constants/sepay"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    PayNextInstallmentCommand,
} from "./pay-next-installment.command"
import {
    PayNextInstallmentHandler,
} from "./pay-next-installment.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Params for the `RetryService.retry` mock. */
interface RetryServiceRetryParams {
    /** The action the production code wants retried. */
    action: () => Promise<unknown>
}

/** The owning user of every plan under test. */
const OWNER_ID = "user-1"

/** The cycle minimum the plan service reports unless a test says otherwise. */
const MIN_PAYMENT_VND = 500_000

/**
 * Build a minimal user stand-in carrying only the id the handler reads.
 *
 * @param id - The user id to embed.
 * @returns a UserEntity-typed stub with just the id populated.
 */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

/** One `installment_plans` row as the handler reads it. */
interface PlanRow {
    /** Plan id. */
    id: string
    /** Owning user -- a mismatch is collapsed into "not found". */
    userId: string
    /** Lifecycle status; `completed` is not payable. */
    status: InstallmentPlanStatus
    /** Fixed monthly plan vs top-up-able flexible pool. */
    planType: InstallmentPlanType
}

/** Builds a payable fixed plan owned by {@link OWNER_ID}. */
const planRow = (
    overrides: Partial<PlanRow> = {
    },
): PlanRow => ({
    id: "plan-1",
    userId: OWNER_ID,
    status: InstallmentPlanStatus.Active,
    planType: InstallmentPlanType.Fixed,
    ...overrides,
})

/**
 * Paying one cycle of an installment plan. The handler only ever opens a PENDING
 * gateway checkout for exactly the cycle's minimum (or an explicit top-up on a
 * flexible pool) -- the plan advances later, when the reconcile worker confirms the
 * payment. MVP is VND-only, so PayOS and SePay are the only providers accepted.
 */
describe("PayNextInstallmentHandler",
    () => {
        let module: TestingModule
        let handler: PayNextInstallmentHandler
        let entityManager: EntityManagerMock
        let payos: { paymentRequests: { create: jest.Mock } }
        let sepay: { checkout: { initOneTimePaymentFields: jest.Mock, initCheckoutUrl: jest.Mock } }
        let installmentPlanService: { computeMinPaymentVnd: jest.Mock }
        let enqueueReconcileTransactionJobService: { enqueue: jest.Mock }

        /** Programs the two lookups the handler makes, by entity. */
        const programLookups = (
            rows: {
                plan?: PlanRow | null
                pending?: Record<string, unknown> | null
            },
        ) => {
            entityManager.findOne.mockImplementation(async (entity: unknown) => {
                if (entity === InstallmentPlanEntity) {
                    return rows.plan ?? null
                }
                if (entity === TransactionEntity) {
                    return rows.pending ?? null
                }
                return null
            })
        }

        /** Builds the command for one pay-next-installment request. */
        const command = (
            request: {
                planId?: string
                paymentType?: PaymentType
                returnUrl?: string
                cancelUrl?: string
                amountVnd?: number
            } = {
            },
            user: UserEntity | undefined = fakeUser(OWNER_ID),
        ) => new PayNextInstallmentCommand({
            request: {
                planId: "plan-1",
                paymentType: PaymentType.PayOS,
                returnUrl: "https://app/ok",
                cancelUrl: "https://app/cancel",
                ...request,
            },
            user,
        })

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            // the persisted transaction gets its primary key assigned by the database
            entityManager.save.mockImplementation(async (entity: { id?: string }) => {
                entity.id = "txn-new"
                return entity
            })

            payos = {
                paymentRequests: {
                    create: jest.fn().mockResolvedValue({
                        checkoutUrl: "https://payos/checkout",
                        amount: MIN_PAYMENT_VND,
                    }),
                },
            }
            sepay = {
                checkout: {
                    initOneTimePaymentFields: jest.fn().mockReturnValue({
                        signature: "sig",
                    }),
                    initCheckoutUrl: jest.fn().mockReturnValue("https://sepay/checkout"),
                },
            }
            installmentPlanService = {
                computeMinPaymentVnd: jest.fn().mockReturnValue(MIN_PAYMENT_VND),
            }
            enqueueReconcileTransactionJobService = {
                enqueue: jest.fn(),
            }

            module = await Test.createTestingModule({
                providers: [
                    PayNextInstallmentHandler,
                    // DayjsService is a pure dayjs wrapper (no I/O) -> use the real one
                    DayjsService,
                    {
                        provide: PAYOS,
                        useValue: payos,
                    },
                    {
                        provide: SEPAY,
                        useValue: sepay,
                    },
                    {
                        provide: InstallmentPlanService,
                        useValue: installmentPlanService,
                    },
                    {
                        // RetryService just runs the action once for the unit test
                        provide: RetryService,
                        useValue: {
                            retry: jest.fn(
                                ({
                                    action,
                                }: RetryServiceRetryParams) => action(),
                            ),
                        },
                    },
                    {
                        provide: EnqueueReconcileTransactionJobService,
                        useValue: enqueueReconcileTransactionJobService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<PayNextInstallmentHandler>(PayNextInstallmentHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("refuses an unauthenticated request before reading any plan",
            async () => {
                // built inline rather than through `command`, whose user parameter has a
                // default that an explicitly-passed undefined would silently restore
                const anonymous = new PayNextInstallmentCommand({
                    request: {
                        planId: "plan-1",
                        paymentType: PaymentType.PayOS,
                        returnUrl: "https://app/ok",
                        cancelUrl: "https://app/cancel",
                    },
                    user: undefined,
                })

                await expect(handler.execute(anonymous))
                    .rejects.toBeInstanceOf(UserNotFoundException)

                expect(entityManager.findOne).not.toHaveBeenCalled()
            })

        it("reports a missing plan as not found",
            async () => {
                programLookups({
                    plan: null,
                })

                await expect(handler.execute(command()))
                    .rejects.toBeInstanceOf(InstallmentPlanNotFoundException)

                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("hides another user's plan behind the same not-found error, never an ownership hint",
            async () => {
                programLookups({
                    plan: planRow({
                        userId: "someone-else",
                    }),
                })

                await expect(handler.execute(command()))
                    .rejects.toBeInstanceOf(InstallmentPlanNotFoundException)

                expect(installmentPlanService.computeMinPaymentVnd).not.toHaveBeenCalled()
            })

        it("refuses to charge a plan that is already paid off",
            async () => {
                programLookups({
                    plan: planRow({
                        status: InstallmentPlanStatus.Completed,
                    }),
                })

                await expect(handler.execute(command()))
                    .rejects.toBeInstanceOf(InstallmentPlanNotPayableException)

                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
            })

        it("charges an overdue plan, which is still payable",
            async () => {
                programLookups({
                    plan: planRow({
                        status: InstallmentPlanStatus.Overdue,
                    }),
                })

                const result = await handler.execute(command())

                expect(result.amount).toBe(MIN_PAYMENT_VND)
                expect(result.checkoutUrl).toBe("https://payos/checkout")
            })

        it("charges exactly the cycle minimum when the request names no amount",
            async () => {
                programLookups({
                    plan: planRow(),
                })

                const result = await handler.execute(command({
                    amountVnd: undefined,
                }))

                expect(payos.paymentRequests.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        amount: MIN_PAYMENT_VND,
                    }),
                )
                expect(result).toEqual({
                    planId: "plan-1",
                    checkoutUrl: "https://payos/checkout",
                    referenceId: expect.stringMatching(/^\d+$/),
                    transactionId: "txn-new",
                    amount: MIN_PAYMENT_VND,
                    checkoutFields: undefined,
                })
            })

        it("refuses a custom amount on a fixed plan, whose cycle amount is not the payer's to choose",
            async () => {
                programLookups({
                    plan: planRow({
                        planType: InstallmentPlanType.Fixed,
                    }),
                })

                await expect(handler.execute(command({
                    amountVnd: 900_000,
                }))).rejects.toBeInstanceOf(InstallmentCustomAmountNotAllowedException)

                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
            })

        it("refuses a flexible-pool top-up below the cycle minimum",
            async () => {
                programLookups({
                    plan: planRow({
                        planType: InstallmentPlanType.FlexiblePool,
                    }),
                })

                await expect(handler.execute(command({
                    amountVnd: MIN_PAYMENT_VND - 1,
                }))).rejects.toBeInstanceOf(InstallmentAmountBelowMinimumException)

                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
            })

        it("charges a flexible-pool top-up above the minimum at the requested amount",
            async () => {
                programLookups({
                    plan: planRow({
                        planType: InstallmentPlanType.FlexiblePool,
                    }),
                })
                payos.paymentRequests.create.mockResolvedValue({
                    checkoutUrl: "https://payos/checkout",
                    amount: 900_000,
                })

                const result = await handler.execute(command({
                    amountVnd: 900_000,
                }))

                expect(payos.paymentRequests.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        amount: 900_000,
                    }),
                )
                expect(result.amount).toBe(900_000)
            })

        it("charges a flexible-pool payment of exactly the minimum",
            async () => {
                programLookups({
                    plan: planRow({
                        planType: InstallmentPlanType.FlexiblePool,
                    }),
                })

                await handler.execute(command({
                    amountVnd: MIN_PAYMENT_VND,
                }))

                expect(payos.paymentRequests.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        amount: MIN_PAYMENT_VND,
                    }),
                )
            })

        it("persists the pending cycle payment linked to its plan and schedules the reconcile poll",
            async () => {
                programLookups({
                    plan: planRow(),
                })

                const result = await handler.execute(command())

                expect(entityManager.create).toHaveBeenCalledWith(
                    TransactionEntity,
                    expect.objectContaining({
                        course: null,
                        amount: MIN_PAYMENT_VND,
                        discountPercent: 0,
                        pricingPhase: PricingPhase.Regular,
                        paymentType: PaymentType.PayOS,
                        checkoutUrl: "https://payos/checkout",
                        providerPaymentId: null,
                        status: TransactionStatus.Pending,
                        actionType: ActionType.InstallmentPayment,
                        aiSubTier: null,
                        installmentPlanId: "plan-1",
                    }),
                )
                expect(entityManager.save).toHaveBeenCalledTimes(1)
                expect(enqueueReconcileTransactionJobService.enqueue).toHaveBeenCalledWith({
                    transactionId: "txn-new",
                })
                // the persisted reference is the same order code handed to the client
                const [
                    ,
                    created,
                ] = entityManager.create.mock.calls[0] as unknown as [unknown, { referenceId: string }]
                expect(created.referenceId).toBe(result.referenceId)
            })

        it("hands back a still-fresh pending PayOS checkout instead of opening a second one",
            async () => {
                programLookups({
                    plan: planRow(),
                    pending: {
                        id: "txn-existing",
                        referenceId: "123456",
                        amount: MIN_PAYMENT_VND,
                        checkoutUrl: "https://payos/existing",
                        paymentType: PaymentType.PayOS,
                        createdAt: new Date(),
                    },
                })

                const result = await handler.execute(command())

                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
                expect(entityManager.save).not.toHaveBeenCalled()
                expect(enqueueReconcileTransactionJobService.enqueue).not.toHaveBeenCalled()
                expect(result).toEqual({
                    planId: "plan-1",
                    checkoutUrl: "https://payos/existing",
                    referenceId: "123456",
                    transactionId: "txn-existing",
                    amount: MIN_PAYMENT_VND,
                    checkoutFields: undefined,
                })
            })

        it("re-signs the SePay form fields when reusing a pending SePay checkout",
            async () => {
                programLookups({
                    plan: planRow(),
                    pending: {
                        id: "txn-existing",
                        referenceId: "123456",
                        amount: MIN_PAYMENT_VND,
                        checkoutUrl: "https://sepay/existing",
                        paymentType: PaymentType.Sepay,
                        createdAt: new Date(),
                    },
                })

                const result = await handler.execute(command({
                    paymentType: PaymentType.Sepay,
                }))

                expect(sepay.checkout.initOneTimePaymentFields).toHaveBeenCalledWith(
                    expect.objectContaining({
                        operation: "PURCHASE",
                        order_invoice_number: "123456",
                        order_amount: MIN_PAYMENT_VND,
                        currency: "VND",
                    }),
                )
                expect(result.checkoutFields).toBe(JSON.stringify({
                    signature: "sig",
                }))
                // the reused row's own checkout URL is returned, not a freshly-built one
                expect(result.checkoutUrl).toBe("https://sepay/existing")
                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("opens a new checkout when the pending one is past the reuse window",
            async () => {
                programLookups({
                    plan: planRow(),
                    pending: {
                        id: "txn-stale",
                        referenceId: "123456",
                        amount: MIN_PAYMENT_VND,
                        checkoutUrl: "https://payos/stale",
                        paymentType: PaymentType.PayOS,
                        createdAt: new Date(0),
                    },
                })

                const result = await handler.execute(command())

                expect(payos.paymentRequests.create).toHaveBeenCalledTimes(1)
                expect(result.transactionId).toBe("txn-new")
                expect(result.checkoutUrl).toBe("https://payos/checkout")
            })

        it("builds a SePay form checkout carrying the plan's redirect URLs",
            async () => {
                programLookups({
                    plan: planRow(),
                })

                const result = await handler.execute(command({
                    paymentType: PaymentType.Sepay,
                    returnUrl: "https://app/done",
                    cancelUrl: "https://app/back",
                }))

                expect(sepay.checkout.initOneTimePaymentFields).toHaveBeenCalledWith(
                    expect.objectContaining({
                        order_amount: MIN_PAYMENT_VND,
                        currency: "VND",
                        success_url: "https://app/done",
                        cancel_url: "https://app/back",
                        // a cancelled and a failed payment land on the same page
                        error_url: "https://app/back",
                    }),
                )
                expect(result.checkoutUrl).toBe("https://sepay/checkout")
                expect(result.checkoutFields).toBe(JSON.stringify({
                    signature: "sig",
                }))
                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
            })

        it("refuses a PayOS payment missing its return URL",
            async () => {
                programLookups({
                    plan: planRow(),
                })

                await expect(handler.execute(command({
                    returnUrl: undefined,
                }))).rejects.toBeInstanceOf(PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException)

                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
            })

        it("refuses a PayOS payment missing its cancel URL",
            async () => {
                programLookups({
                    plan: planRow(),
                })

                await expect(handler.execute(command({
                    cancelUrl: undefined,
                }))).rejects.toBeInstanceOf(PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException)

                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
            })

        it("rejects every non-VND provider, since installments are a domestic-gateway feature",
            async () => {
                for (const paymentType of [
                    PaymentType.Stripe,
                    PaymentType.Paypal,
                    PaymentType.Crypto,
                ]) {
                    programLookups({
                        plan: planRow(),
                    })

                    await expect(handler.execute(command({
                        paymentType,
                    }))).rejects.toBeInstanceOf(InstallmentCurrencyNotSupportedException)
                }

                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("gives each checkout its own order code",
            async () => {
                programLookups({
                    plan: planRow(),
                })

                const first = await handler.execute(command())
                const second = await handler.execute(command())

                expect(first.referenceId).not.toBe(second.referenceId)
            })
    })
