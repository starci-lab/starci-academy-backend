import {
    CoursePriceQuoteLineData, CoursePriceQuotesData 
} from "./response"
describe("course price quote response DTOs",
    () => { it("carries nullable prices and totals",
        () => { const line = Object.assign(new CoursePriceQuoteLineData(),
            {
                courseId: "c1", chargedPriceVnd: 100, chargedPriceUsd: null, currentPhase: "EarlyBird" 
            }); const data = Object.assign(new CoursePriceQuotesData(),
            {
                lines: [line], totalChargedVnd: 100, totalChargedUsd: null, itemCount: 1 
            }); expect(data).toMatchObject({
            lines: [expect.objectContaining({
                chargedPriceUsd: null 
            })], totalChargedVnd: 100, itemCount: 1 
        }) }) })
