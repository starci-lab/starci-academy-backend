import {
    Injectable 
} from "@nestjs/common"
import {
    CoursePriceQuoteService 
} from "@modules/bussiness/course-pricing/course-price-quote.service"
import {
    CoursePriceQuoteIntent 
} from "@modules/bussiness/course-pricing/types"
import type {
    PriceCartParams, PriceCartResult 
} from "./types/checkout"

@Injectable()
/** Compatibility adapter preserving the checkout handler's current priced-cart shape. */
export class CoursesCheckoutPricingService {
    constructor(private readonly quotes: CoursePriceQuoteService) {}

    async priceCart(params: PriceCartParams): Promise<PriceCartResult> {
        const quote = await this.quotes.quote({
            ...params, intent: CoursePriceQuoteIntent.Checkout 
        })
        return {
            lines: quote.lines.map((line) => ({
                course: line.course,
                listVnd: line.listVnd,
                chargedVnd: line.chargedVnd,
                listUsd: line.listUsd,
                chargedUsd: line.chargedUsd,
                discountPercent: line.displayDiscountPercent,
                pricingPhase: line.pricingPhase,
            })),
            totalListVnd: quote.totalListVnd,
            totalChargedVnd: quote.totalChargedVnd,
            totalListUsd: quote.totalListUsd,
            totalChargedUsd: quote.totalChargedUsd,
            bundleBonusPercent: quote.bundleDiscountPercent,
            itemCount: quote.itemCount,
        }
    }
}
