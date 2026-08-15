import {
    PricingPhase 
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    DiscountReason 
} from "@modules/databases/postgresql/primary/enums/discount-reason"
import {
    CoursePriceQuoteService 
} from "./course-price-quote.service"
import {
    CoursePriceQuoteIntent 
} from "./types"

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
    })
