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

interface CourseFixtureOverrides extends Omit<Partial<CourseEntity>, "metadata" | "pricingPhases"> {
    metadata?: {
        currentPhase: PricingPhase
    }
    pricingPhases?: Array<{
        phase: PricingPhase
        price: number
        priceUsd: number | null
    }>
}

const course = (overrides: CourseFixtureOverrides = {
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

        it("handles regular pricing, explicit phases, and missing USD values",
            () => {
                const regular = course({
                    originalPrice: 100,
                    originalPriceUsd: undefined,
                    metadata: {
                        currentPhase: PricingPhase.Regular,
                    },
                    pricingPhases: [],
                })
                expect(service.resolveAmountVnd({
                    course: regular,
                })).toBe(1)
                expect(service.resolveAmountUsd({
                    course: regular,
                })).toBeNull()
                expect(service.resolveListAmountUsd({
                    course: regular,
                })).toBeNull()

                const pioneer = course({
                    metadata: {
                        currentPhase: PricingPhase.Regular,
                    },
                    pricingPhases: [{
                        phase: PricingPhase.Pioneer,
                        price: 900,
                        priceUsd: null,
                    }],
                })
                expect(service.resolveAmountVnd({
                    course: pioneer, phase: PricingPhase.Pioneer, discountPercent: 10,
                })).toBe(8)
                expect(service.resolveAmountUsd({
                    course: pioneer, phase: PricingPhase.Pioneer,
                })).toBeNull()
            })

        it("falls back to the active phase for a missing list price and charm-rounds USD",
            () => {
                const input = course({
                    originalPrice: undefined,
                    originalPriceUsd: .5,
                })
                expect(service.resolveDisplayListAmountVnd({
                    course: input,
                })).toBe(1250000)
                expect(service.resolveListAmountVnd({
                    course: input,
                })).toBe(12500)
                expect(service.resolveListAmountUsd({
                    course: input,
                })).toBe(.99)
                expect(service.resolveAmountUsd({
                    course: input, discountPercent: 100,
                })).toBe(0.99)
            })
    })
