import type {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    PricingPhaseNoPriceException,
} from "@modules/platform/exceptions/errors/courses/pricing-phase-no-price"
import {
    CoursePriceCalculatorService,
} from "./course-price-calculator.service"

const course = (overrides: Partial<CourseEntity> = {
}): CourseEntity => ({
    id: "course-1",
    originalPrice: 1500000,
    originalPriceUsd: 60,
    metadata: {
        currentPhase: PricingPhase.EarlyBird,
    },
    pricingPhases: [{
        phase: PricingPhase.EarlyBird,
        price: 1250000,
        priceUsd: 50,
    }],
    ...overrides,
}) as CourseEntity

describe("CoursePriceCalculatorService",
    () => {
        const service = new CoursePriceCalculatorService()

        it("keeps list, phase and discounted VND amounts on the same local divisor",
            () => {
                const input = course()

                expect(service.resolveListAmountVnd({
                    course: input 
                })).toBe(15000)
                expect(service.resolveAmountVnd({
                    course: input 
                })).toBe(12500)
                expect(service.resolveAmountVnd({
                    course: input, discountPercent: 5 
                })).toBe(11875)
            })

        it("keeps discovery amounts at their full real values",
            () => {
                const input = course()

                expect(service.resolveDisplayListAmountVnd({
                    course: input,
                })).toBe(1500000)
                expect(service.resolveDisplayAmountVnd({
                    course: input,
                })).toBe(1250000)
                expect(service.resolveDisplayAmountVnd({
                    course: input, discountPercent: 5,
                })).toBe(1187500)
            })

        it("uses explicit phase USD and clamps discounts before charm rounding",
            () => {
                const input = course()

                expect(service.resolveAmountUsd({
                    course: input 
                })).toBe(49.99)
                expect(service.resolveAmountUsd({
                    course: input, discountPercent: -10 
                })).toBe(49.99)
                expect(service.resolveAmountUsd({
                    course: input, discountPercent: 120 
                })).toBe(.99)
            })

        it("falls back to Early Bird when course metadata is absent",
            () => {
                expect(service.getCurrentPricingPhase(course({
                    metadata: undefined 
                }))).toBe(
                    PricingPhase.EarlyBird,
                )
            })

        it("rejects a non-regular phase without a configured price",
            () => {
                const input = course({
                    pricingPhases: [] 
                })

                expect(() => service.resolveAmountVnd({
                    course: input 
                })).toThrow(
                    PricingPhaseNoPriceException,
                )
            })
    })
