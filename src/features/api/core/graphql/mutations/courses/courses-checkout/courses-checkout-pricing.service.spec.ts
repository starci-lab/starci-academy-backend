import {
    Test, type TestingModule 
} from "@nestjs/testing"
import {
    CoursePriceQuoteService 
} from "@modules/bussiness/course-pricing/course-price-quote.service"
import {
    CoursePriceQuoteIntent, type CoursePriceQuoteResult 
} from "@modules/bussiness/course-pricing/types"
import {
    PricingPhase 
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    DiscountReason 
} from "@modules/databases/postgresql/primary/enums/discount-reason"
import {
    CoursesCheckoutPricingService 
} from "./courses-checkout-pricing.service"

describe("CoursesCheckoutPricingService",
    () => {
        let module: TestingModule
        let service: CoursesCheckoutPricingService
        const quote = jest.fn<Promise<CoursePriceQuoteResult>, [unknown]>()

        beforeEach(async () => {
            quote.mockReset()
            module = await Test.createTestingModule({
                providers: [
                    CoursesCheckoutPricingService,
                    {
                        provide: CoursePriceQuoteService, useValue: {
                            quote 
                        } 
                    },
                ],
            }).compile()
            service = module.get(CoursesCheckoutPricingService)
        })

        afterEach(async () => module.close())

        it("delegates an array as checkout intent and preserves priced cart output",
            async () => {
                const course = {
                    id: "course-1" 
                }
                quote.mockResolvedValue({
                    lines: [{
                        course,
                        listVnd: 1500,
                        phaseVnd: 1250,
                        chargedVnd: 1188,
                        listUsd: 15.99,
                        phaseUsd: 12.99,
                        chargedUsd: 11.99,
                        loyaltyDiscountPercent: 5,
                        bundleDiscountPercent: 0,
                        displayDiscountPercent: 5,
                        discountReason: DiscountReason.EnrolledCount,
                        enrolledCount: 1,
                        pricingPhase: PricingPhase.EarlyBird,
                        nextPhase: null,
                        seatsRemainingInCurrentPhase: 10,
                        nextPhasePriceVnd: null,
                        nextPhasePriceUsd: null,
                    }],
                    totalListVnd: 1500,
                    totalPhaseVnd: 1250,
                    totalChargedVnd: 1188,
                    totalListUsd: 15.99,
                    totalPhaseUsd: 12.99,
                    totalChargedUsd: 11.99,
                    savingsVnd: 312,
                    bundleDiscountPercent: 0,
                    itemCount: 1,
                    voucherDiscountedPriceVnd: null,
                    installmentOptions: [],
                    selectedInstallment: null,
                } as unknown as CoursePriceQuoteResult)

                await expect(service.priceCart({
                    userId: "user-1", courseIds: ["course-1"] 
                }))
                    .resolves.toEqual({
                        lines: [{
                            course,
                            listVnd: 1500,
                            chargedVnd: 1188,
                            listUsd: 15.99,
                            chargedUsd: 11.99,
                            discountPercent: 5,
                            pricingPhase: PricingPhase.EarlyBird,
                        }],
                        totalListVnd: 1500,
                        totalChargedVnd: 1188,
                        totalListUsd: 15.99,
                        totalChargedUsd: 11.99,
                        bundleBonusPercent: 0,
                        itemCount: 1,
                    })
                expect(quote).toHaveBeenCalledWith({
                    userId: "user-1",
                    courseIds: ["course-1"],
                    intent: CoursePriceQuoteIntent.Checkout,
                })
            })

        it("propagates a typed engine refusal unchanged",
            async () => {
                const refusal = new Error("typed refusal")
                quote.mockRejectedValue(refusal)
                await expect(service.priceCart({
                    userId: "user-1", courseIds: ["missing"] 
                }))
                    .rejects.toBe(refusal)
            })
    })
