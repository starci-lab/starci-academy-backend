import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    DiscountReason,
} from "@modules/databases/postgresql/primary/enums/discount-reason"
import {
    RecommendedCoursesService,
} from "./recommended-courses.service"

describe("RecommendedCoursesService",
    () => {
        it("maps the full list-to-charge comparison returned by the canonical discovery quote",
            async () => {
                const entityManager = {
                    query: jest.fn().mockResolvedValue([{
                        id: "course-1",
                    }]),
                }
                const coursePriceQuoteService = {
                    quote: jest.fn().mockResolvedValue({
                        lines: [{
                            course: {
                                displayId: "system-design-mastery",
                                title: "System Design Mastery",
                                description: null,
                                coverImageUrl: "/system-design.png",
                            },
                            listVnd: 2_000_000,
                            phaseVnd: 1_750_000,
                            chargedVnd: 1_750_000,
                            listUsd: null,
                            phaseUsd: null,
                            chargedUsd: null,
                            displayDiscountPercent: 13,
                            discountReason: DiscountReason.None,
                            enrolledCount: 0,
                            pricingPhase: PricingPhase.EarlyBird,
                        }],
                    }),
                }
                const service = new RecommendedCoursesService(
                    entityManager as never,
                    coursePriceQuoteService as never,
                )

                await expect(service.list({
                    userId: "viewer-1",
                    limit: 3,
                })).resolves.toEqual([expect.objectContaining({
                    originalPriceVnd: 2_000_000,
                    discountedPriceVnd: 1_750_000,
                    discountPercent: 13,
                })])
            })
    })
