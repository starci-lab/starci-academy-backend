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
    CoursePricePreviewData 
} from "./graphql-types/response"

/** Params for previewing one course through the canonical quote engine. */
export interface PreviewCoursePriceParams {
    userId: string
    courseId: string
    voucherCode?: string
}

@Injectable()
/** Compatibility adapter for the legacy single-course preview query. */
export class CoursePricePreviewService {
    constructor(private readonly quotes: CoursePriceQuoteService) {}

    async preview(params: PreviewCoursePriceParams): Promise<CoursePricePreviewData> {
        const quote = await this.quotes.quote({
            userId: params.userId,
            courseIds: [params.courseId],
            intent: CoursePriceQuoteIntent.Discovery,
            voucherCode: params.voucherCode,
        })
        const line = quote.lines[0]
        return {
            originalPriceVnd: line.listVnd,
            phasePriceVnd: line.phaseVnd,
            discountedPriceVnd: line.chargedVnd,
            discountPercent: line.displayDiscountPercent,
            originalPriceUsd: line.listUsd,
            phasePriceUsd: line.phaseUsd,
            discountedPriceUsd: line.chargedUsd,
            discountReason: line.discountReason,
            enrolledCount: line.enrolledCount,
            voucherDiscountedPriceVnd: quote.voucherDiscountedPriceVnd,
            currentPhase: line.pricingPhase,
            nextPhase: line.nextPhase,
            seatsRemainingInCurrentPhase: line.seatsRemainingInCurrentPhase,
            nextPhasePriceVnd: line.nextPhasePriceVnd,
            nextPhasePriceUsd: line.nextPhasePriceUsd,
            installmentOptions: quote.installmentOptions,
        }
    }
}
