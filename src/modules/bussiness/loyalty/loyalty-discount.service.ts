import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    DiscountReason,
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    UserStatsProjectionService,
} from "../projections"
import type {
    EnrolledCountRow,
    LoyaltyDiscountResult,
} from "./types"

/** Bonus percent granted per course the user already owns. */
const PERCENT_PER_ENROLLED_COURSE = 5
/** Bonus percent granted when the user is "diligent". */
const DILIGENT_BONUS_PERCENT = 5
/** Hard cap on the total loyalty discount. */
const MAX_DISCOUNT_PERCENT = 30
/** Streak threshold (consecutive active days) that counts as diligent. */
const DILIGENT_STREAK_THRESHOLD = 7
/** Total-points threshold that counts as diligent. */
const DILIGENT_POINTS_THRESHOLD = 1000

/**
 * Computes the engagement-based loyalty discount applied to course checkouts:
 * a bundle bonus per already-owned course plus a "diligent" bonus, capped. The
 * SAME percent is applied at checkout (via {@link CoursePricingService}) and
 * surfaced on the recommended-courses query, so the charged price always matches
 * what the buyer was shown.
 */
@Injectable()
export class LoyaltyDiscountService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userStatsProjectionService: UserStatsProjectionService,
    ) {}

    /**
     * Compute the loyalty discount for a user.
     *
     * `+5` per course the user already owns/enrolled (bundle/loyalty), plus `+5`
     * when the user is diligent (current streak >= 7 OR total points >= 1000),
     * capped at 30. The reason reflects which bonuses contributed.
     *
     * @param userId - The user to price for.
     * @returns The percent (0–30), the reason, and the enrolled-course count.
     */
    async computeLoyaltyDiscount(
        userId: string,
    ): Promise<LoyaltyDiscountResult> {
        // count courses the user already owns (bundle/loyalty signal)
        const enrolledCount = await this.countEnrolledCourses(userId)
        // streak (from the user-stats projection) + total points (user row)
        const diligent = await this.isDiligent(userId)

        // bundle bonus scales with owned courses; diligent bonus is flat
        const enrolledBonus = enrolledCount * PERCENT_PER_ENROLLED_COURSE
        const diligentBonus = diligent ? DILIGENT_BONUS_PERCENT : 0
        // cap the combined discount at the maximum
        const percent = Math.min(
            MAX_DISCOUNT_PERCENT,
            enrolledBonus + diligentBonus,
        )

        return {
            percent,
            reason: this.resolveReason({
                hasEnrolledBonus: enrolledBonus > 0,
                diligent,
            }),
            enrolledCount,
        }
    }

    /**
     * Count the courses a user is already enrolled in. `course_id` is a virtual
     * `@RelationId` so the count runs against the column directly.
     *
     * @param userId - The user to count enrollments for.
     * @returns The enrolled-course count (0 when none).
     */
    private async countEnrolledCourses(
        userId: string,
    ): Promise<number> {
        const rows = await this.entityManager.query<Array<EnrolledCountRow>>(
            "SELECT COUNT(*)::text AS count FROM enrollments WHERE user_id = $1",
            [
                userId,
            ],
        )
        return Number(rows[0]?.count) || 0
    }

    /**
     * Whether the user qualifies as diligent: a current streak of at least 7
     * days OR a total-points balance of at least 1000.
     *
     * @param userId - The user to check.
     * @returns True when either diligence signal is met.
     */
    private async isDiligent(
        userId: string,
    ): Promise<boolean> {
        // streak comes from the user-stats projection (no inline aggregate)
        const stats = await this.userStatsProjectionService.getStats(userId)
        if (stats.streak >= DILIGENT_STREAK_THRESHOLD) {
            return true
        }
        // total points are materialized on the user row
        const user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    totalPoints: true,
                },
            },
        )
        return (user?.totalPoints ?? 0) >= DILIGENT_POINTS_THRESHOLD
    }

    /**
     * Map the two contributing signals onto the {@link DiscountReason} enum.
     *
     * @param params - Whether each bonus contributed.
     * @returns The discount reason for FE copy.
     */
    private resolveReason(
        {
            hasEnrolledBonus,
            diligent,
        }: {
            hasEnrolledBonus: boolean
            diligent: boolean
        },
    ): DiscountReason {
        if (hasEnrolledBonus && diligent) {
            return DiscountReason.Both
        }
        if (hasEnrolledBonus) {
            return DiscountReason.EnrolledCount
        }
        if (diligent) {
            return DiscountReason.Diligent
        }
        return DiscountReason.None
    }
}
