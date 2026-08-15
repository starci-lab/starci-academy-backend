import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CoursePriceQuoteService,
} from "@modules/bussiness/course-pricing/course-price-quote.service"
import {
    CoursePriceQuoteIntent,
} from "@modules/bussiness/course-pricing/types"
import type {
    ListRecommendedCoursesParams,
    RecommendedCourseIdRow,
    RecommendedCourseItem,
} from "./types"

@Injectable()
/**
 * Lists recommended courses for a viewer: the most popular courses the viewer
 * does NOT already own, each priced with the SAME loyalty discount applied at
 * checkout (so the shown price matches the eventual charge). Popularity is
 * ordered by enrollment count (recency tiebreak); already-owned courses are
 * excluded with an `enrollments` subquery.
 */
export class RecommendedCoursesService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly coursePriceQuoteService: CoursePriceQuoteService,
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

        const quote = await this.coursePriceQuoteService.quote({
            userId,
            courseIds,
            intent: CoursePriceQuoteIntent.Discovery,
        })

        return quote.lines.map((line): RecommendedCourseItem => {
            const course = line.course
            return {
                displayId: course.displayId,
                title: course.title,
                description: course.description,
                thumbnailUrl: course.coverImageUrl,
                originalPriceVnd: line.listVnd,
                discountedPriceVnd: line.chargedVnd,
                discountPercent: line.displayDiscountPercent,
                originalPriceUsd: line.listUsd,
                discountedPriceUsd: line.chargedUsd,
                discountReason: line.discountReason,
                enrolledCount: line.enrolledCount,
            }
        })
    }
}
