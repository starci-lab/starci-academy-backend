import {
    Injectable,
} from "@nestjs/common"
import {
    CoursePriceQuoteService,
} from "@modules/bussiness/course-pricing/course-price-quote.service"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    CoursePriceQuotesRequest,
} from "./graphql-types/request"
import type {
    CoursePriceQuotesData,
} from "./graphql-types/response"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"

@Injectable()
/** Thin transport mapper for the canonical business quote engine. */
export class CoursePriceQuotesService {
    constructor(private readonly quotes: CoursePriceQuoteService) {}

    async execute(params: ExecuteParams<CoursePriceQuotesRequest>): Promise<CoursePriceQuotesData> {
        if (!params.user) {
            throw new UserNotFoundException({
            })
        }
        const quote = await this.quotes.quote({
            userId: params.user.id,
            ...params.request,
        })
        return {
            ...quote,
            lines: quote.lines.map((line) => ({
                courseId: line.course.id,
                listPriceVnd: line.listVnd,
                phasePriceVnd: line.phaseVnd,
                chargedPriceVnd: line.chargedVnd,
                listPriceUsd: line.listUsd,
                phasePriceUsd: line.phaseUsd,
                chargedPriceUsd: line.chargedUsd,
                loyaltyDiscountPercent: line.loyaltyDiscountPercent,
                bundleDiscountPercent: line.bundleDiscountPercent,
                displayDiscountPercent: line.displayDiscountPercent,
                discountReason: line.discountReason,
                enrolledCount: line.enrolledCount,
                currentPhase: line.pricingPhase,
                nextPhase: line.nextPhase,
                seatsRemainingInCurrentPhase: line.seatsRemainingInCurrentPhase,
                nextPhasePriceVnd: line.nextPhasePriceVnd,
                nextPhasePriceUsd: line.nextPhasePriceUsd,
            })),
        }
    }
}
