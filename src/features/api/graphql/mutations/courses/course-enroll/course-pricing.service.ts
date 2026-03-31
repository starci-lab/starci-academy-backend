import {
    CourseEntity,
    PricingPhase,
} from "@modules/databases"
import {
    CourseNoRegularPriceException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    ResolveCourseAmountVndParams,
} from "./types"
/**
 * Resolves course checkout amounts in VND from `originalPrice` and `pricing_phases`.
 */
@Injectable()
export class CoursePricingService {
    /**
     * Integer VND amount for PayOS / Sepay (Regular → `originalPrice`, other tiers → `pricing_phases.price`).
     *
     * @param param - Course with `pricingPhases` loaded and the tier to charge
     * @returns Rounded VND minor units (integer)
     */
    resolveAmountVnd(
        {
            course,
        }: ResolveCourseAmountVndParams,
    ): number {
        const currentPhase = this.getCurrentPricingPhase(course)
        if (currentPhase === PricingPhase.Regular) {
            const priceVnd = course.originalPrice
            if (priceVnd == null || priceVnd <= 0) {
                throw new CourseNoRegularPriceException(
                    {
                        courseId: course.id,
                    },
                )
            }
            return priceVnd
        }
        const pricingPhase = course.pricingPhases.find(
            (pricingPhase) => pricingPhase.phase === currentPhase,
        )
        return pricingPhase?.price ?? 0
    }

    /**
     * Get the current pricing phase of a course.
     *
     * @param course - The course to get the current pricing phase of.
     * @returns The current pricing phase of the course.
     */
    getCurrentPricingPhase(
        course: CourseEntity,
    ): PricingPhase {
        return course.currentPhase ?? PricingPhase.Regular
    }
}
