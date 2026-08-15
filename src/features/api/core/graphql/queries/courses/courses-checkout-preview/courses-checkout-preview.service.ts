import {
    Injectable,
} from "@nestjs/common"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    CoursePriceQuoteService,
} from "@modules/bussiness/course-pricing/course-price-quote.service"
import {
    CoursePriceQuoteIntent,
} from "@modules/bussiness/course-pricing/types"
import {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    CoursesCheckoutPreviewRequest,
} from "./graphql-types/request"
import type {
    CoursesCheckoutPreviewData,
} from "./graphql-types/response"

@Injectable()
/**
 * Prices a cart for display, reusing the SAME {@link CoursesCheckoutPricingService}
 * the real checkout uses -- so the total shown in the cart equals the total charged
 * at checkout (progressive loyalty + order bundle bonus included).
 */
export class CoursesCheckoutPreviewService {
    constructor(
        private readonly coursePriceQuoteService: CoursePriceQuoteService,
    ) {}

    /**
     * Price the requested courses and map them to the preview payload.
     *
     * @param params - Request (course ids) + auth context.
     * @returns The per-course preview lines + order totals + savings.
     */
    async execute(
        {
            request: {
                courseIds,
            },
            user,
        }: ExecuteParams<CoursesCheckoutPreviewRequest>,
    ): Promise<CoursesCheckoutPreviewData> {
        // a logged-in user is required -- pricing depends on their loyalty + owned set
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // price the cart exactly as the checkout would (shared service = single source)
        const priced = await this.coursePriceQuoteService.quote({
            userId: user.id,
            courseIds,
            intent: CoursePriceQuoteIntent.Checkout,
        })
        // map internal priced lines -> the GraphQL shape (course id + per-line prices)
        const lines = priced.lines.map((line) => ({
            courseId: line.course.id,
            listVnd: line.listVnd,
            chargedVnd: line.chargedVnd,
            listUsd: line.listUsd,
            chargedUsd: line.chargedUsd,
            discountPercent: line.displayDiscountPercent,
        }))
        return {
            lines,
            totalListVnd: priced.totalListVnd,
            totalChargedVnd: priced.totalChargedVnd,
            // total saved = struck list total − charged total (never negative)
            savingsVnd: Math.max(
                0,
                priced.totalListVnd - priced.totalChargedVnd,
            ),
            totalListUsd: priced.totalListUsd,
            totalChargedUsd: priced.totalChargedUsd,
            bundleBonusPercent: priced.bundleDiscountPercent,
            itemCount: priced.itemCount,
            // installment terms priced off the WHOLE order's charged VND total
            // (after per-line loyalty + order bundle bonus) -- never per-line,
            // per §2.3 of the design doc
            installmentOptions: priced.installmentOptions,
        }
    }
}
