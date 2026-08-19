import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
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
    CourseNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-not-found"
import {
    PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException,
} from "@modules/platform/exceptions/errors/courses/payos-return-url-and-payos-cancel-url-must-be-required"
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
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import type {
    CoursePriceQuoteResult,
} from "@modules/bussiness/course-pricing/types"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    CourseEnrollRequest,
} from "./graphql-types/request"
import {
    CourseEnrollPayOsService,
} from "./course-enroll-payos.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The buyer every checkout under test belongs to. */
const BUYER_ID = "user-1"

/** The course every checkout under test is for. */
const COURSE_ID = "course-1"

/** Total the quote charges when no installment plan is selected. */
const TOTAL_CHARGED_VND = 2_000_000

/** Params for the `RetryService.retry` mock. */
interface RetryServiceRetryParams {
    /** The action the production code wants retried. */
    action: () => Promise<unknown>
}

/** Rows `programLookups` feeds back for the course and pending-transaction lookups. */
interface ProgramLookupsRows {
    course?: Record<string, unknown> | null
    pending?: Record<string, unknown> | null
}

/**
 * Build a minimal user stand-in carrying only the id the service reads.
 *
 * @param id - The user id to embed.
 * @returns a UserEntity-typed stub with just the id populated.
 */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

/** Builds a one-line checkout quote, optionally with a selected installment plan. */
const quoteResult = (
    selectedInstallment: {
        months: number
        markupPercent: number
        monthlyAmountVnd: number
        totalAmountVnd: number
    } | null = null,
): CoursePriceQuoteResult => ({
    lines: [{
        pricingPhase: PricingPhase.Regular,
        displayDiscountPercent: 20,
    }],
    totalChargedVnd: TOTAL_CHARGED_VND,
    selectedInstallment,
}) as unknown as CoursePriceQuoteResult

/**
 * PayOS is the redirect-style domestic VND gateway (SePay is the form-POST one). It
 * hands back a hosted checkout URL, so the service must not open a second payment
 * link while one is still live, and must refuse to start at all without the redirect
 * URLs PayOS requires.
 */
describe("CourseEnrollPayOsService",
    () => {
        let module: TestingModule
        let service: CourseEnrollPayOsService
        let entityManager: EntityManagerMock
        let payos: { paymentRequests: { create: jest.Mock } }
        let enqueueReconcileTransactionJobService: { enqueue: jest.Mock }
        let voucherService: { reserve: jest.Mock }
        let queryRunner: { connect: jest.Mock, query: jest.Mock, release: jest.Mock, manager: EntityManagerMock }

        /** Programs the course + pending-transaction lookups, by entity. */
        const programLookups = (
            rows: ProgramLookupsRows,
        ) => {
            entityManager.findOne.mockImplementation(async (entity: unknown) => {
                if (entity === CourseEntity) {
                    return rows.course === undefined
                        ? {
                            id: COURSE_ID,
                        }
                        : rows.course
                }
                if (entity === TransactionEntity) {
                    return rows.pending ?? null
                }
                return null
            })
        }

        /** Builds the execute params for one enrollment request. */
        const params = (
            request: Partial<CourseEnrollRequest> = {
            },
        ): ExecuteParams<CourseEnrollRequest> => ({
            request: {
                courseId: COURSE_ID,
                paymentType: PaymentType.PayOS,
                payosReturnUrl: "https://app/ok",
                payosCancelUrl: "https://app/cancel",
                ...request,
            },
            user: fakeUser(BUYER_ID),
        }) as unknown as ExecuteParams<CourseEnrollRequest>

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            entityManager.save.mockImplementation(async (entity: { id?: string }) => {
                entity.id = "txn-new"
                return entity
            })
            queryRunner = {
                connect: jest.fn(async () => undefined),
                query: jest.fn(async () => []),
                release: jest.fn(async () => undefined),
                manager: entityManager,
            }
            Object.assign(
                entityManager,
                {
                    connection: {
                        createQueryRunner: jest.fn(() => queryRunner),
                    },
                },
            )

            payos = {
                paymentRequests: {
                    create: jest.fn().mockResolvedValue({
                        checkoutUrl: "https://payos/checkout",
                        amount: TOTAL_CHARGED_VND,
                        orderCode: 445566,
                    }),
                },
            }
            enqueueReconcileTransactionJobService = {
                enqueue: jest.fn(),
            }
            voucherService = {
                reserve: jest.fn(),
            }

            module = await Test.createTestingModule({
                providers: [
                    CourseEnrollPayOsService,
                    // DayjsService is a pure dayjs wrapper (no I/O) -> use the real one
                    DayjsService,
                    {
                        provide: PAYOS,
                        useValue: payos,
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
                        provide: VoucherService,
                        useValue: voucherService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<CourseEnrollPayOsService>(CourseEnrollPayOsService)
        })

        afterEach(async () => {
            await module.close()
        })

        it("refuses an anonymous checkout before taking the advisory lock",
            async () => {
                const anonymous = {
                    request: {
                        courseId: COURSE_ID,
                    },
                    user: undefined,
                } as unknown as ExecuteParams<CourseEnrollRequest>

                await expect(service.execute(anonymous,
                    quoteResult())).rejects.toBeInstanceOf(UserNotFoundException)

                expect(queryRunner.connect).not.toHaveBeenCalled()
            })

        it("refuses an anonymous caller inside the locked section too",
            async () => {
                // `execute` already guards this; the locked duplicate exists so the lock
                // body can never persist a transaction with no owner
                const locked = service as unknown as {
                    executeLocked: (
                        input: ExecuteParams<CourseEnrollRequest>,
                        quote: CoursePriceQuoteResult,
                        manager: unknown,
                    ) => Promise<unknown>
                }

                await expect(locked.executeLocked(
                    {
                        request: {
                            courseId: COURSE_ID,
                        },
                        user: undefined,
                    } as unknown as ExecuteParams<CourseEnrollRequest>,
                    quoteResult(),
                    entityManager,
                )).rejects.toBeInstanceOf(UserNotFoundException)
            })

        it("serializes a plain checkout on a course-and-provider lock key",
            async () => {
                programLookups({
                })

                await service.execute(params(),
                    quoteResult())

                expect(queryRunner.query).toHaveBeenNthCalledWith(
                    1,
                    "SELECT pg_advisory_lock(hashtextextended($1, 0))",
                    [`checkout:course:${BUYER_ID}:${COURSE_ID}:${PaymentType.PayOS}`],
                )
                expect(queryRunner.release).toHaveBeenCalledTimes(1)
            })

        it("serializes a voucher checkout on the voucher key",
            async () => {
                programLookups({
                })

                await service.execute(params({
                    voucherCode: "SAVE50",
                }),
                quoteResult())

                expect(queryRunner.query).toHaveBeenNthCalledWith(
                    1,
                    "SELECT pg_advisory_lock(hashtextextended($1, 0))",
                    [`checkout:voucher:${BUYER_ID}:SAVE50`],
                )
            })

        it("reports a missing course rather than opening a payment link for it",
            async () => {
                programLookups({
                    course: null,
                })

                await expect(service.execute(params(),
                    quoteResult())).rejects.toBeInstanceOf(CourseNotFoundException)

                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
                expect(queryRunner.release).toHaveBeenCalledTimes(1)
            })

        it("creates the payment link, persists the pending row and schedules the reconcile poll",
            async () => {
                programLookups({
                })

                const result = await service.execute(params(),
                    quoteResult())

                expect(payos.paymentRequests.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        amount: TOTAL_CHARGED_VND,
                        returnUrl: "https://app/ok",
                        cancelUrl: "https://app/cancel",
                    }),
                )
                expect(entityManager.create).toHaveBeenCalledWith(
                    TransactionEntity,
                    expect.objectContaining({
                        referenceId: "445566",
                        amount: TOTAL_CHARGED_VND,
                        discountPercent: 20,
                        voucherCode: null,
                        pricingPhase: PricingPhase.Regular,
                        paymentType: PaymentType.PayOS,
                        checkoutUrl: "https://payos/checkout",
                        status: TransactionStatus.Pending,
                        actionType: ActionType.Enroll,
                        installmentMonths: null,
                        installmentMarkupPercent: null,
                        installmentTotalVnd: null,
                    }),
                )
                expect(enqueueReconcileTransactionJobService.enqueue).toHaveBeenCalledWith({
                    transactionId: "txn-new",
                })
                expect(result).toEqual({
                    checkoutUrl: "https://payos/checkout",
                    referenceId: "445566",
                    transactionId: "txn-new",
                    amount: TOTAL_CHARGED_VND,
                })
            })

        it("charges only the monthly amount when the buyer picked an installment plan",
            async () => {
                programLookups({
                })
                payos.paymentRequests.create.mockResolvedValue({
                    checkoutUrl: "https://payos/checkout",
                    amount: 350_000,
                    orderCode: 445566,
                })

                const result = await service.execute(params(),
                    quoteResult({
                        months: 6,
                        markupPercent: 5,
                        monthlyAmountVnd: 350_000,
                        totalAmountVnd: 2_100_000,
                    }))

                expect(payos.paymentRequests.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        amount: 350_000,
                    }),
                )
                expect(entityManager.create).toHaveBeenCalledWith(
                    TransactionEntity,
                    expect.objectContaining({
                        installmentMonths: 6,
                        installmentMarkupPercent: 5,
                        installmentTotalVnd: 2_100_000,
                    }),
                )
                expect(result.amount).toBe(350_000)
            })

        it("reserves the voucher inside the same write transaction that inserts the row",
            async () => {
                programLookups({
                })

                await service.execute(params({
                    voucherCode: "SAVE50",
                }),
                quoteResult())

                expect(voucherService.reserve).toHaveBeenCalledWith({
                    entityManager,
                    userId: BUYER_ID,
                    code: "SAVE50",
                    courseId: COURSE_ID,
                    transactionId: "txn-new",
                })
                expect(entityManager.save.mock.invocationCallOrder[0])
                    .toBeLessThan(voucherService.reserve.mock.invocationCallOrder[0])
            })

        it("hands back a still-fresh pending payment link untouched",
            async () => {
                programLookups({
                    pending: {
                        id: "txn-existing",
                        referenceId: "112233",
                        amount: 1_500_000,
                        checkoutUrl: "https://payos/existing",
                        createdAt: new Date(),
                    },
                })

                const result = await service.execute(params(),
                    quoteResult())

                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
                expect(entityManager.save).not.toHaveBeenCalled()
                expect(result).toEqual({
                    checkoutUrl: "https://payos/existing",
                    referenceId: "112233",
                    transactionId: "txn-existing",
                    amount: 1_500_000,
                })
            })

        it("opens a new payment link once the pending one has aged out of the reuse window",
            async () => {
                programLookups({
                    pending: {
                        id: "txn-stale",
                        referenceId: "112233",
                        amount: 1_500_000,
                        checkoutUrl: "https://payos/stale",
                        createdAt: new Date(0),
                    },
                })

                const result = await service.execute(params(),
                    quoteResult())

                expect(payos.paymentRequests.create).toHaveBeenCalledTimes(1)
                expect(result.transactionId).toBe("txn-new")
                expect(result.checkoutUrl).toBe("https://payos/checkout")
            })

        it("refuses to start a payment with no return URL",
            async () => {
                programLookups({
                })

                await expect(service.execute(params({
                    payosReturnUrl: undefined,
                }),
                quoteResult())).rejects.toBeInstanceOf(PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException)

                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
            })

        it("refuses to start a payment with no cancel URL",
            async () => {
                programLookups({
                })

                await expect(service.execute(params({
                    payosCancelUrl: undefined,
                }),
                quoteResult())).rejects.toBeInstanceOf(PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredException)

                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
            })
    })
