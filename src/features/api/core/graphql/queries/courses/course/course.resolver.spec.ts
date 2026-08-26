import {
    CourseResolver
} from "./course.resolver"
import {
    PricingPhase
} from "@modules/databases/postgresql/primary/enums/pricing-phase"

describe("CourseResolver",
    () => {
        it("falls back to early bird, reads enrollment stats, and delegates course lookup",
            async () => {
                const stats = {
                    getStats: jest.fn().mockResolvedValue({
                        enrollmentCount: 12
                    })
                }
                const service = {
                    execute: jest.fn().mockResolvedValue({
                        id: "c1"
                    })
                }
                const resolver = new CourseResolver(stats as never,
service as never)
                expect(resolver.currentPhase({
                    metadata: {
                    }
                } as never)).toBe(PricingPhase.EarlyBird)
                await expect(resolver.enrollmentCount({
                    id: "c1"
                } as never)).resolves.toBe(12)
                await expect(resolver.execute({
                    id: "c1"
                } as never,
"en" as never)).resolves.toEqual({
                    id: "c1"
                })
                expect(service.execute).toHaveBeenCalledWith({
                    request: {
                        id: "c1"
                    }, locale: "en"
                })
            })

        it("returns the explicitly seeded current pricing phase",
            () => {
                const resolver = new CourseResolver({
                } as never,
                {
                } as never)

                expect(resolver.currentPhase({
                    metadata: {
                        currentPhase: PricingPhase.Regular,
                    },
                } as never)).toBe(PricingPhase.Regular)
            })
    })
