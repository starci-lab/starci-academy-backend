import {
    Injectable,
} from "@nestjs/common"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    CoursesCheckoutPricingService,
} from "@features/api/core/graphql/mutations/courses/courses-checkout"
import {
    ExecuteParams,
} from "@features/api/core/types"
import type {
    CoursesCheckoutPreviewData,
    CoursesCheckoutPreviewRequest,
} from "./graphql-types"

/**
 * Prices a cart for display, reusing the SAME {@link CoursesCheckoutPricingService}
 * the real checkout uses — so the total shown in the cart equals the total charged
 * at checkout (progressive loyalty + order bundle bonus included).
 */
@Injectable()
export class CoursesCheckoutPreviewService {
    constructor(
        private readonly coursesCheckoutPricingService: CoursesCheckoutPricingService,
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
        // a logged-in user is required — pricing depends on their loyalty + owned set
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // price the cart exactly as the checkout would (shared service = single source)
        const priced = await this.coursesCheckoutPricingService.priceCart({
            userId: user.id,
            courseIds,
        })
        // map internal priced lines → the GraphQL shape (course id + per-line prices)
        const lines = priced.lines.map((line) => ({
            courseId: line.course.id,
            listVnd: line.listVnd,
            chargedVnd: line.chargedVnd,
            listUsd: line.listUsd,
            chargedUsd: line.chargedUsd,
            discountPercent: line.discountPercent,
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
            bundleBonusPercent: priced.bundleBonusPercent,
            itemCount: priced.itemCount,
        }
    }
}
