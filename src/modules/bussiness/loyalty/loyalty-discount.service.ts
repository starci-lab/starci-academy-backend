import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    DiscountReason,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    UserStatsProjectionService,
} from "../projections/user-stats/user-stats-projection.service"
import {
    UserXpProjectionService,
} from "../projections/user-xp/user-xp-projection.service"
import type {
    ApplyBundleBonusParams,
    ComputeLoyaltyDiscountParams,
    EnrolledCountRow,
    LoyaltyContext,
    LoyaltyDiscountResult,
    ResolveLoyaltyPercentParams,
} from "./types"

/** Bonus percent granted per course the user already owns. */
const PERCENT_PER_ENROLLED_COURSE = 5
/** Bonus percent granted when the user is "diligent". */
const DILIGENT_BONUS_PERCENT = 5
/** Hard cap on the engagement-based loyalty discount (before any bundle bonus). */
const MAX_DISCOUNT_PERCENT = 30
/** Streak threshold (consecutive active days) that counts as diligent. */
const DILIGENT_STREAK_THRESHOLD = 7
/** Total-points threshold that counts as diligent. */
const DILIGENT_POINTS_THRESHOLD = 1000
/** Bundle bonus percent for a cart holding exactly 2 courses in one checkout. */
const BUNDLE_BONUS_PERCENT_TIER_2 = 5
/** Bundle bonus percent for a cart holding 3 or more courses in one checkout. */
const BUNDLE_BONUS_PERCENT_TIER_3 = 10
/**
 * Hard cap on the loyalty percent + bundle bonus COMBINED — higher than
 * {@link MAX_DISCOUNT_PERCENT} so a large multi-course cart can still clear the
 * loyalty-only ceiling once its bundle bonus is added.
 */
const MAX_COMBINED_DISCOUNT_PERCENT = 40

/**
 * Computes the discount applied to course checkouts, in two independent parts:
 *
 * 1. **Engagement-based loyalty** ({@link computeLoyaltyDiscount}) — a bonus per
 *    already-owned course plus a "diligent" bonus, capped at
 *    {@link MAX_DISCOUNT_PERCENT}. Based on the buyer's HISTORY, not the order
 *    being checked out.
 * 2. **Bundle bonus** ({@link computeBundleBonusPercent}) — a flat tiered bonus
 *    for buying several courses in ONE order, independent of history.
 *    {@link applyBundleBonus} combines the two, capped at
 *    {@link MAX_COMBINED_DISCOUNT_PERCENT}.
 *
 * The SAME percent computed here is applied at checkout (via
 * {@link CoursePricingService}) and surfaced on the recommended-courses query, so
 * the charged price always matches what the buyer was shown.
 */
@Injectable()
export class LoyaltyDiscountService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userStatsProjectionService: UserStatsProjectionService,
        private readonly userXpProjectionService: UserXpProjectionService,
    ) {}

    /**
     * Compute the engagement-based loyalty discount for a user.
     *
     * `+5` per course the user already owns/enrolled (bundle/loyalty), plus `+5`
     * when the user is diligent (current streak >= 7 OR total points >= 1000),
     * capped at 30. The reason reflects which bonuses contributed.
     *
     * @param params - The user to price for, and an optional extra-owned-count
     * used by a multi-course checkout to price a later line as if earlier lines
     * of the SAME order were already bought (see {@link ComputeLoyaltyDiscountParams}).
     * @returns The percent (0–30), the reason, and the enrolled-course count used.
     */
    async computeLoyaltyDiscount(
        {
            userId,
            extraOwnedCount = 0,
        }: ComputeLoyaltyDiscountParams,
    ): Promise<LoyaltyDiscountResult> {
        // fetch the two DB inputs once, then derive the percent (pure)
        const context = await this.computeLoyaltyContext(userId)
        return this.resolveLoyaltyPercent({
            context,
            extraOwnedCount,
        })
    }

    /**
     * Fetch the two DB-derived loyalty inputs for a user ONCE (owned-course count +
     * diligence). Callers that price many lines for the same user (a cart checkout /
     * its preview) should call this a single time and then derive each line's
     * percent with {@link resolveLoyaltyPercent}, instead of re-hitting the DB per
     * line.
     *
     * @param userId - The user to load loyalty inputs for.
     * @returns The owned-course count + diligence flag.
     */
    async computeLoyaltyContext(
        userId: string,
    ): Promise<LoyaltyContext> {
        // count courses the user already owns (bundle/loyalty signal)
        const ownedCount = await this.countEnrolledCourses(userId)
        // streak (from the user-stats projection) + total points (user row)
        const diligent = await this.isDiligent(userId)
        return {
            ownedCount,
            diligent,
        }
    }

    /**
     * Derive the loyalty percent from an already-fetched {@link LoyaltyContext} —
     * pure arithmetic, NO DB access. `+5` per owned course (plus any
     * `extraOwnedCount` for progressive cart pricing) + `+5` when diligent, capped
     * at {@link MAX_DISCOUNT_PERCENT}.
     *
     * @param params - The DB-derived context + optional extra-owned-count.
     * @returns The percent (0–30), the reason, and the enrolled-course count used.
     */
    resolveLoyaltyPercent(
        {
            context,
            extraOwnedCount = 0,
        }: ResolveLoyaltyPercentParams,
    ): LoyaltyDiscountResult {
        // treat both real-owned and the progressive extra count as owned courses
        const enrolledCount = context.ownedCount + extraOwnedCount
        // bundle bonus scales with owned courses; diligent bonus is flat
        const enrolledBonus = enrolledCount * PERCENT_PER_ENROLLED_COURSE
        const diligentBonus = context.diligent ? DILIGENT_BONUS_PERCENT : 0
        // cap the combined discount at the maximum
        const percent = Math.min(
            MAX_DISCOUNT_PERCENT,
            enrolledBonus + diligentBonus,
        )

        return {
            percent,
            reason: this.resolveReason({
                hasEnrolledBonus: enrolledBonus > 0,
                diligent: context.diligent,
            }),
            enrolledCount,
        }
    }

    /**
     * Bonus percent for buying several courses in ONE order (cart checkout),
     * independent of the buyer's history: `+5` for exactly 2 courses, `+10` for 3
     * or more, `0` for a single course. Tiered (not cumulative) — a 5-course cart
     * still gets the flat +10, not +50.
     *
     * @param itemCount - Number of distinct courses in the order.
     * @returns The bundle bonus percent (0, 5, or 10).
     */
    computeBundleBonusPercent(
        itemCount: number,
    ): number {
        // 3+ courses in one order → the top bundle tier
        if (itemCount >= 3) {
            return BUNDLE_BONUS_PERCENT_TIER_3
        }
        // exactly 2 courses → the entry bundle tier
        if (itemCount >= 2) {
            return BUNDLE_BONUS_PERCENT_TIER_2
        }
        // a single course earns no bundle bonus
        return 0
    }

    /**
     * Combine a line's base loyalty percent with the order's bundle bonus, capped
     * at {@link MAX_COMBINED_DISCOUNT_PERCENT} so a large cart's bundle bonus can
     * still push the total past the loyalty-only ceiling.
     *
     * @param params - The line's base loyalty percent and the order's item count.
     * @returns The combined, capped discount percent to charge this line.
     */
    applyBundleBonus(
        {
            basePercent,
            itemCount,
        }: ApplyBundleBonusParams,
    ): number {
        return Math.min(
            MAX_COMBINED_DISCOUNT_PERCENT,
            basePercent + this.computeBundleBonusPercent(itemCount),
        )
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
        // global Points — SUM of every XP grant across all courses + coding —
        // read from the XP projection (single source of truth: xp_histories)
        const { totalPoints } = await this.userXpProjectionService.getXp({
            userId,
        })
        return totalPoints >= DILIGENT_POINTS_THRESHOLD
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
