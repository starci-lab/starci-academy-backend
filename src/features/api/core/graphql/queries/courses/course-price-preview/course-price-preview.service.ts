import {
    Injectable,
    NotFoundException,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    LoyaltyDiscountService,
} from "@modules/bussiness"
import {
    CoursePricingService,
} from "../../../mutations/courses/course-enroll/course-pricing.service"
import type {
    CoursePricePreviewData,
} from "./graphql-types"

/** Params for previewing a course's pre-checkout price for a viewer. */
export interface PreviewCoursePriceParams {
    /** The viewer to price for (loyalty discount is per-user). */
    userId: string
    /** The course to price. */
    courseId: string
}

/**
 * Prices a single course for the payment modal exactly as it would be charged at
 * checkout: the active pricing phase resolved by {@link CoursePricingService} with
 * the viewer's {@link LoyaltyDiscountService} discount applied — so the shown price
 * equals the eventual charge (no FE price guessing).
 */
@Injectable()
export class CoursePricePreviewService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly coursePricingService: CoursePricingService,
        private readonly loyaltyDiscountService: LoyaltyDiscountService,
    ) {}

    /**
     * Resolve the original + loyalty-discounted price (VND always, USD when set)
     * for a course and viewer.
     *
     * @param params - {@link PreviewCoursePriceParams}
     * @returns The course's price preview.
     */
    async preview(
        {
            userId,
            courseId,
        }: PreviewCoursePriceParams,
    ): Promise<CoursePricePreviewData> {
        // load the course with the relations the pricing service needs
        const course = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    id: courseId,
                },
                relations: {
                    metadata: true,
                    pricingPhases: true,
                },
            },
        )
        if (!course) {
            throw new NotFoundException("Course not found")
        }

        // one loyalty computation for the viewer (same percent prices the course)
        const {
            percent,
            reason,
            enrolledCount,
        } = await this.loyaltyDiscountService.computeLoyaltyDiscount(userId)

        // base prices (no discount) then the same prices with the discount applied
        const originalPriceVnd = this.coursePricingService.resolveAmountVnd({
            course,
        })
        const discountedPriceVnd = this.coursePricingService.resolveAmountVnd({
            course,
            discountPercent: percent,
        })
        const originalPriceUsd = this.coursePricingService.resolveAmountUsd({
            course,
        })
        const discountedPriceUsd = this.coursePricingService.resolveAmountUsd({
            course,
            discountPercent: percent,
        })

        return {
            originalPriceVnd,
            discountedPriceVnd,
            discountPercent: percent,
            originalPriceUsd,
            discountedPriceUsd,
            discountReason: reason,
            enrolledCount,
        }
    }
}
