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
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
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
    CourseEnrollSepayService,
} from "./course-enroll-sepay.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The buyer every checkout under test belongs to. */
const BUYER_ID = "user-1"

/** The course every checkout under test is for. */
const COURSE_ID = "course-1"

/** Total the quote charges when no installment plan is selected. */
const TOTAL_CHARGED_VND = 2_000_000

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
    overrides: {
        displayDiscountPercent?: number
        selectedInstallment?: {
            months: number
            markupPercent: number
            monthlyAmountVnd: number
            totalAmountVnd: number
        } | null
    } = {
    },
): CoursePriceQuoteResult => ({
    lines: [{
        pricingPhase: PricingPhase.Regular,
        displayDiscountPercent: overrides.displayDiscountPercent ?? 20,
    }],
    totalChargedVnd: TOTAL_CHARGED_VND,
    selectedInstallment: overrides.selectedInstallment ?? null,
}) as unknown as CoursePriceQuoteResult

/**
 * SePay is one of the two domestic VND gateways (with PayOS) this product actually
 * charges through. The checkout is a signed form POST, so the service both signs the
 * order fields and persists the pending row -- and it must never open a second gateway
 * order while one is still live, nor let two concurrent checkouts claim one voucher.
 */
describe("CourseEnrollSepayService",
    () => {
        let module: TestingModule
        let service: CourseEnrollSepayService
        let entityManager: EntityManagerMock
        let sepay: { checkout: { initOneTimePaymentFields: jest.Mock, initCheckoutUrl: jest.Mock } }
        let enqueueReconcileTransactionJobService: { enqueue: jest.Mock }
        let voucherService: { reserve: jest.Mock }
        let queryRunner: { connect: jest.Mock, query: jest.Mock, release: jest.Mock, manager: EntityManagerMock }

        /** Programs the course + pending-transaction lookups, by entity. */
        const programLookups = (
            rows: {
                course?: Record<string, unknown> | null
                pending?: Record<string, unknown> | null
            },
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
                paymentType: PaymentType.Sepay,
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
                // the advisory lock hands the action ITS OWN session manager
                manager: entityManager,
            }
            entityManager.createQueryBuilder = jest.fn()
            Object.assign(
                entityManager,
                {
                    connection: {
                        createQueryRunner: jest.fn(() => queryRunner),
                    },
                },
            )

            sepay = {
                checkout: {
                    initOneTimePaymentFields: jest.fn().mockReturnValue({
                        signature: "sig",
                    }),
                    initCheckoutUrl: jest.fn().mockReturnValue("https://sepay/checkout"),
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
                    CourseEnrollSepayService,
                    // DayjsService is a pure dayjs wrapper (no I/O) -> use the real one
                    DayjsService,
                    {
                        provide: SEPAY,
                        useValue: sepay,
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

            service = module.get<CourseEnrollSepayService>(CourseEnrollSepayService)
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
                // `execute` already guards this, so the locked duplicate is only
                // reachable directly -- it exists so the lock body can never persist a
                // transaction with no owner if a future caller bypasses `execute`
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
                    [`checkout:course:${BUYER_ID}:${COURSE_ID}:${PaymentType.Sepay}`],
                )
                expect(queryRunner.release).toHaveBeenCalledTimes(1)
            })

        it("serializes a voucher checkout on the voucher key, so one code cannot be claimed twice",
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

        it("reports a missing course rather than signing an order for it",
            async () => {
                programLookups({
                    course: null,
                })

                await expect(service.execute(params(),
                    quoteResult())).rejects.toBeInstanceOf(CourseNotFoundException)

                expect(sepay.checkout.initOneTimePaymentFields).not.toHaveBeenCalled()
                // the lock is still released on the failure path
                expect(queryRunner.release).toHaveBeenCalledTimes(1)
            })

        it("signs the order, persists the pending row and schedules the reconcile poll",
            async () => {
                programLookups({
                })

                const result = await service.execute(params(),
                    quoteResult())

                expect(sepay.checkout.initOneTimePaymentFields).toHaveBeenCalledWith(
                    expect.objectContaining({
                        operation: "PURCHASE",
                        order_amount: TOTAL_CHARGED_VND,
                        currency: "VND",
                        success_url: "https://app/ok",
                        cancel_url: "https://app/cancel",
                        error_url: "https://app/cancel",
                    }),
                )
                expect(entityManager.create).toHaveBeenCalledWith(
                    TransactionEntity,
                    expect.objectContaining({
                        amount: TOTAL_CHARGED_VND,
                        discountPercent: 20,
                        voucherCode: null,
                        pricingPhase: PricingPhase.Regular,
                        paymentType: PaymentType.Sepay,
                        checkoutUrl: "https://sepay/checkout",
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
                    checkoutUrl: "https://sepay/checkout",
                    referenceId: expect.stringMatching(/^\d+$/),
                    transactionId: "txn-new",
                    amount: TOTAL_CHARGED_VND,
                    checkoutFields: JSON.stringify({
                        signature: "sig",
                    }),
                })
            })

        it("charges only the monthly amount when the buyer picked an installment plan",
            async () => {
                programLookups({
                })

                const result = await service.execute(params(),
                    quoteResult({
                        selectedInstallment: {
                            months: 6,
                            markupPercent: 5,
                            monthlyAmountVnd: 350_000,
                            totalAmountVnd: 2_100_000,
                        },
                    }))

                expect(result.amount).toBe(350_000)
                expect(entityManager.create).toHaveBeenCalledWith(
                    TransactionEntity,
                    expect.objectContaining({
                        amount: 350_000,
                        installmentMonths: 6,
                        installmentMarkupPercent: 5,
                        installmentTotalVnd: 2_100_000,
                    }),
                )
            })

        it("reserves the voucher inside the same write transaction that inserts the row",
            async () => {
                programLookups({
                })

                await service.execute(params({
                    voucherCode: "SAVE50",
                }),
                quoteResult())

                expect(entityManager.create).toHaveBeenCalledWith(
                    TransactionEntity,
                    expect.objectContaining({
                        voucherCode: "SAVE50",
                    }),
                )
                expect(voucherService.reserve).toHaveBeenCalledWith({
                    entityManager,
                    userId: BUYER_ID,
                    code: "SAVE50",
                    courseId: COURSE_ID,
                    transactionId: "txn-new",
                })
                // reserved only after the row it points at exists
                expect(entityManager.save.mock.invocationCallOrder[0])
                    .toBeLessThan(voucherService.reserve.mock.invocationCallOrder[0])
            })

        it("hands back a still-fresh pending order with freshly signed fields",
            async () => {
                programLookups({
                    pending: {
                        id: "txn-existing",
                        referenceId: "778899",
                        amount: 1_500_000,
                        createdAt: new Date(),
                    },
                })

                const result = await service.execute(params(),
                    quoteResult())

                expect(entityManager.save).not.toHaveBeenCalled()
                expect(enqueueReconcileTransactionJobService.enqueue).not.toHaveBeenCalled()
                // the signature is regenerated for the SAME order code and amount
                expect(sepay.checkout.initOneTimePaymentFields).toHaveBeenCalledWith(
                    expect.objectContaining({
                        order_invoice_number: "778899",
                        order_amount: 1_500_000,
                    }),
                )
                expect(result).toEqual({
                    checkoutUrl: "https://sepay/checkout",
                    referenceId: "778899",
                    transactionId: "txn-existing",
                    amount: 1_500_000,
                    checkoutFields: JSON.stringify({
                        signature: "sig",
                    }),
                })
            })

        it("opens a new order once the pending one has aged out of the reuse window",
            async () => {
                programLookups({
                    pending: {
                        id: "txn-stale",
                        referenceId: "778899",
                        amount: 1_500_000,
                        createdAt: new Date(0),
                    },
                })

                const result = await service.execute(params(),
                    quoteResult())

                expect(entityManager.save).toHaveBeenCalledTimes(1)
                expect(result.transactionId).toBe("txn-new")
                expect(result.amount).toBe(TOTAL_CHARGED_VND)
            })

        it("gives each new order its own code",
            async () => {
                programLookups({
                })

                const first = await service.execute(params(),
                    quoteResult())
                const second = await service.execute(params(),
                    quoteResult())

                expect(first.referenceId).not.toBe(second.referenceId)
            })
    })
