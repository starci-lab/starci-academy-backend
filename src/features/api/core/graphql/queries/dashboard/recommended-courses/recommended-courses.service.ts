import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    In,
} from "typeorm"
import {
    CourseEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    CoursePricingService,
} from "../../../mutations/courses/course-enroll/course-pricing.service"
import {
    LoyaltyDiscountService,
} from "@modules/bussiness"
import type {
    ListRecommendedCoursesParams,
    RecommendedCourseIdRow,
    RecommendedCourseItem,
} from "./types"

/**
 * Lists recommended courses for a viewer: the most popular courses the viewer
 * does NOT already own, each priced with the SAME loyalty discount applied at
 * checkout (so the shown price matches the eventual charge). Popularity is
 * ordered by enrollment count (recency tiebreak); already-owned courses are
 * excluded with an `enrollments` subquery.
 */
@Injectable()
export class RecommendedCoursesService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly coursePricingService: CoursePricingService,
        private readonly loyaltyDiscountService: LoyaltyDiscountService,
    ) {}

    /**
     * List the top-N recommended (priced) courses for a viewer.
     *
     * @param params - {@link ListRecommendedCoursesParams}
     * @returns Priced recommended courses (empty when none qualify).
     */
    async list(
        {
            userId,
            limit,
        }: ListRecommendedCoursesParams,
    ): Promise<Array<RecommendedCourseItem>> {
        // top-N popular courses the viewer does not already own (ids only)
        const idRows = await this.entityManager.query<Array<RecommendedCourseIdRow>>(
            `SELECT c.id
             FROM courses c
             WHERE c.id NOT IN (
                 SELECT e.course_id FROM enrollments e WHERE e.user_id = $1
             )
             ORDER BY (
                 SELECT COUNT(*) FROM enrollments e2 WHERE e2.course_id = c.id
             ) DESC, c.created_at DESC
             LIMIT $2`,
            [
                userId,
                limit,
            ],
        )
        const courseIds = idRows.map((row) => row.id)
        if (courseIds.length === 0) {
            return []
        }

        // load the full course rows with the pricing relations needed to price
        const courses = await this.entityManager.find(
            CourseEntity,
            {
                where: {
                    id: In(courseIds),
                },
                relations: {
                    metadata: true,
                    pricingPhases: true,
                },
            },
        )
        // preserve the popularity ordering from the id query
        const byId = new Map(courses.map((course) => [course.id, course]))

        // one loyalty computation per viewer — the same percent prices every course
        const {
            percent,
            reason,
            enrolledCount,
        } = await this.loyaltyDiscountService.computeLoyaltyDiscount(userId)

        const items: Array<RecommendedCourseItem> = []
        for (const courseId of courseIds) {
            const course = byId.get(courseId)
            if (!course) {
                continue
            }
            // base prices (no discount) then the same prices with the discount
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
            items.push({
                displayId: course.displayId,
                title: course.title,
                description: course.description,
                coverImageUrl: course.coverImageUrl,
                originalPriceVnd,
                discountedPriceVnd,
                discountPercent: percent,
                originalPriceUsd,
                discountedPriceUsd,
                discountReason: reason,
                enrolledCount,
            })
        }
        return items
    }
}
