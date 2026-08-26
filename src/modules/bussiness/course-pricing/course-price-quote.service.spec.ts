import {
    PricingPhase
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    DiscountReason
} from "@modules/databases/postgresql/primary/enums/discount-reason"
import {
    VoucherDiscountType
} from "@modules/databases/postgresql/primary/enums/voucher-discount-type"
import {
    CoursePriceQuoteService
} from "./course-price-quote.service"
import {
    CoursePriceQuoteIntent
} from "./types"

interface NextPhaseAmountParams {
    phase?: PricingPhase
}

describe("CoursePriceQuoteService",
    () => {
        const courses = [
            {
                id: "a", originalPrice: 1500, pricingPhases: [], metadata: {
                }
            },
            {
                id: "b", originalPrice: 2000, pricingPhases: [], metadata: {
                }
            },
        ] as never
        const entityManager = {
            find: jest.fn(),
            count: jest.fn().mockResolvedValue(0),
        }
        const calculator = {
            getCurrentPricingPhase: jest.fn().mockReturnValue(PricingPhase.EarlyBird),
            resolveListAmountVnd: jest.fn(({ course }) => course.originalPrice),
            resolveAmountVnd: jest.fn(({ course, discountPercent = 0 }) => Math.round(course.originalPrice * 0.8 * (1 - discountPercent / 100))),
            resolveDisplayListAmountVnd: jest.fn(({ course }) => course.originalPrice * 100),
            resolveDisplayAmountVnd: jest.fn(({ course, discountPercent = 0 }) => Math.round(course.originalPrice * 80 * (1 - discountPercent / 100))),
            resolveListAmountUsd: jest.fn().mockReturnValue(null),
            resolveAmountUsd: jest.fn().mockReturnValue(null),
        }
        const loyalty = {
            computeLoyaltyContext: jest.fn().mockResolvedValue({
                ownedCount: 1, diligent: false
            }),
            computeBundleBonusPercent: jest.fn((count) => count >= 2 ? 5 : 0),
            resolveLoyaltyPercent: jest.fn(({ extraOwnedCount = 0 }) => ({
                percent: 5 + extraOwnedCount * 5,
                reason: DiscountReason.EnrolledCount,
                enrolledCount: 1 + extraOwnedCount,
            })),
            applyBundleBonus: jest.fn(({ basePercent, itemCount }) => basePercent + (itemCount >= 2 ? 5 : 0)),
        }
        const vouchers = {
            previewDiscount: jest.fn(), applyToAmount: jest.fn()
        }
        const installments = {
            computeInstallmentOptions: jest.fn().mockReturnValue([]),
            computeInstallmentTotal: jest.fn(),
        }
        const service = new CoursePriceQuoteService(
        entityManager as never,
        calculator as never,
        loyalty as never,
        vouchers as never,
        installments as never,
        )

        beforeEach(() => {
            jest.clearAllMocks()
            entityManager.count.mockResolvedValue(0)
        })

        it("prices a discovery array as independent offers without bundle progression",
            async () => {
                entityManager.find.mockResolvedValueOnce(courses)
                const result = await service.quote({
                    userId: "u",
                    courseIds: ["a",
                        "b"],
                    intent: CoursePriceQuoteIntent.Discovery,
                })
                expect(result.lines.map((line) => line.displayDiscountPercent)).toEqual([24,
                    24])
                expect(result.bundleDiscountPercent).toBe(0)
                expect(loyalty.resolveLoyaltyPercent).toHaveBeenNthCalledWith(1,
                    expect.objectContaining({
                        extraOwnedCount: 0
                    }))
                expect(loyalty.resolveLoyaltyPercent).toHaveBeenNthCalledWith(2,
                    expect.objectContaining({
                        extraOwnedCount: 0
                    }))
                expect(calculator.resolveDisplayAmountVnd).toHaveBeenCalled()
                expect(calculator.resolveAmountVnd).not.toHaveBeenCalled()
            })

        it("prices a checkout array as one order and computes installments from its final total",
            async () => {
                entityManager.find
                    .mockResolvedValueOnce(courses)
                    .mockResolvedValueOnce([])
                installments.computeInstallmentTotal.mockReturnValue({
                    months: 3,
                    markupPercent: 3,
                    totalAmountVnd: 2500,
                    monthlyAmountVnd: 834,
                })
                const result = await service.quote({
                    userId: "u",
                    courseIds: ["a",
                        "b"],
                    intent: CoursePriceQuoteIntent.Checkout,
                    installmentMonths: 3,
                })
                expect(result.lines.map((line) => line.displayDiscountPercent)).toEqual([10,
                    15])
                expect(result.bundleDiscountPercent).toBe(5)
                expect(installments.computeInstallmentTotal).toHaveBeenCalledWith(result.totalChargedVnd,
                    3)
                expect(result.selectedInstallment?.monthlyAmountVnd).toBe(834)
                expect(calculator.resolveAmountVnd).toHaveBeenCalled()
                expect(calculator.resolveDisplayAmountVnd).not.toHaveBeenCalled()
            })

        it("rejects a missing course id through the existing typed exception",
            async () => {
                entityManager.find.mockResolvedValueOnce([courses[0]])
                await expect(service.quote({
                    userId: "u",
                    courseIds: ["a",
                        "missing"],
                    intent: CoursePriceQuoteIntent.Discovery,
                })).rejects.toMatchObject({
                    code: "COURSE_NOT_FOUND_EXCEPTION"
                })
            })

        it("returns the complete zero result without querying for empty input",
            async () => {
                await expect(service.quote({
                    userId: "u", courseIds: [], intent: CoursePriceQuoteIntent.Discovery,
                })).resolves.toEqual(expect.objectContaining({
                    lines: [], totalListVnd: 0, totalPhaseVnd: 0, totalChargedVnd: 0,
                    itemCount: 0, selectedInstallment: null,
                }))
                expect(entityManager.find).not.toHaveBeenCalled()
                expect(loyalty.computeLoyaltyContext).not.toHaveBeenCalled()
            })

        it("returns zero when checkout excludes every owned course",
            async () => {
                entityManager.find
                    .mockResolvedValueOnce([courses[0]])
                    .mockResolvedValueOnce([{
                        courseId: "a",
                    }])
                await expect(service.quote({
                    userId: "u", courseIds: ["a",
                        "a"], intent: CoursePriceQuoteIntent.Checkout,
                })).resolves.toEqual(expect.objectContaining({
                    lines: [], totalChargedVnd: 0, itemCount: 0,
                }))
                expect(loyalty.computeLoyaltyContext).not.toHaveBeenCalled()
            })

        it("rejects with the typed not-found error when course lookup yields no rows",
            async () => {
                entityManager.find.mockResolvedValueOnce([])

                await expect(service.quote({
                    userId: "u",
                    courseIds: ["missing"],
                    intent: CoursePriceQuoteIntent.Discovery,
                })).rejects.toMatchObject({
                    code: "COURSE_NOT_FOUND_EXCEPTION",
                })
            })

        it("applies a single-course percent voucher to VND and USD totals",
            async () => {
                entityManager.find.mockResolvedValueOnce([courses[0]])
                calculator.resolveListAmountUsd.mockReturnValue(20)
                calculator.resolveAmountUsd.mockReturnValue(10)
                vouchers.previewDiscount.mockResolvedValue({
                    discountType: VoucherDiscountType.Percent,
                    percent: 10,
                })
                vouchers.applyToAmount.mockImplementation((amount: number) => amount * .9)
                installments.computeInstallmentOptions.mockReturnValue([{
                    months: 3,
                }])
                installments.computeInstallmentTotal.mockReturnValue({
                    months: 3, totalAmountVnd: 1000,
                })

                const result = await service.quote({
                    userId: "u", courseIds: ["a"], intent: CoursePriceQuoteIntent.Discovery,
                    voucherCode: "SAVE10", installmentMonths: 3,
                })
                expect(vouchers.previewDiscount).toHaveBeenCalledWith({
                    userId: "u", code: "SAVE10", courseId: "a",
                })
                expect(vouchers.applyToAmount).toHaveBeenCalledTimes(2)
                expect(result.voucherDiscountedPriceUsd).toBe(9)
                expect(result.totalChargedUsd).toBe(9)
                expect(result.selectedInstallment).toEqual({
                    months: 3, totalAmountVnd: 1000,
                })
            })

        it("rejects vouchers for multi-course checkout and tolerates a missing next price",
            async () => {
                entityManager.find.mockResolvedValueOnce(courses)
                await expect(service.quote({
                    userId: "u", courseIds: ["a",
                        "b"], intent: CoursePriceQuoteIntent.Discovery,
                    voucherCode: "ONE-COURSE",
                })).rejects.toMatchObject({
                    code: "INVALID_VOUCHER_EXCEPTION",
                })

                const throwingCalculator = {
                    getCurrentPricingPhase: jest.fn().mockReturnValue(PricingPhase.EarlyBird),
                    resolveListAmountVnd: jest.fn().mockReturnValue(100),
                    resolveAmountVnd: jest.fn(({ phase }: NextPhaseAmountParams) => {
                        if (phase === PricingPhase.Regular) {
                            throw new Error("next phase is not configured")
                        }
                        return 80
                    }),
                    resolveDisplayListAmountVnd: jest.fn().mockReturnValue(100),
                    resolveDisplayAmountVnd: jest.fn().mockReturnValue(80),
                    resolveListAmountUsd: jest.fn().mockReturnValue(null),
                    resolveAmountUsd: jest.fn().mockReturnValue(null),
                }
                const fallbackService = new CoursePriceQuoteService(
                    {
                        find: jest.fn()
                            .mockResolvedValueOnce([courses[0]])
                            .mockResolvedValueOnce([]), count: jest.fn().mockResolvedValue(0),
                    } as never,
                    throwingCalculator as never,
                    loyalty as never,
                    vouchers as never,
                    installments as never,
                )
                await expect(fallbackService.quote({
                    userId: "u", courseIds: ["a"], intent: CoursePriceQuoteIntent.Checkout,
                })).resolves.toEqual(expect.objectContaining({
                    lines: [expect.objectContaining({
                        nextPhase: PricingPhase.Regular, nextPhasePriceVnd: null,
                    })],
                }))
            })

        it("propagates a pricing calculator failure for a non-empty quote",
            async () => {
                entityManager.find.mockRejectedValueOnce(
                    new Error("pricing configuration missing"),
                )

                await expect(service.quote({
                    userId: "user-1",
                    courseIds: ["a"],
                    intent: CoursePriceQuoteIntent.Discovery,
                })).rejects.toThrow("pricing configuration missing")
            })

        it("sums nullable USD fields only when every course has a quote",
            () => {
                const methods = service as unknown as {
                    sumNullable: (lines: Array<{ listUsd?: number | null }>, field: "listUsd") => number | null
                }
                expect(methods.sumNullable([{
                    listUsd: 10
                },
                {
                    listUsd: 5
                }],
                "listUsd")).toBe(15)
                expect(methods.sumNullable([{
                    listUsd: 10
                },
                {
                    listUsd: null
                }],
                "listUsd")).toBeNull()
            })
    })
