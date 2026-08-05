import type {
    AchievementEntity,
} from "@modules/databases"

/**
 * Base class for ONE badge (one animal). Each subclass owns:
 * - its `slug` (pairs the code logic to the seeded DB definition), and
 * - its `getSql()` -- a scalar SQL subquery (`$1` = userId) returning the badge's
 *   metric value.
 *
 * The orchestrator stitches every badge's `getSql()` into a single composite
 * query (one round-trip), then asks each badge `checkEligible(value, definition)`
 * which tiers the value has reached. Eligibility bars (threshold / tierThresholds)
 * live on the seeded DB `definition`; override `checkEligible` only for a badge
 * with non-standard logic.
 */
export abstract class AbstractBadge {
    /** Stable slug -- must match a seeded achievement definition. */
    abstract readonly slug: string

    /**
     * A scalar SQL subquery (wrapped in parens, `$1` = userId) that returns this
     * badge's metric value, e.g. `(SELECT COUNT(*) FROM user_follows WHERE following_id = $1)`.
     */
    abstract getSql(): string

    /**
     * Which tiers the metric value has reached, given the badge's seeded bars.
     * A tiered definition yields one entry per tier met (1-based); a single-tier
     * definition yields `[null]` once its threshold is met; `[]` means not eligible.
     *
     * @param value - the badge's current metric value for the user.
     * @param definition - the seeded definition carrying `threshold` / `tierThresholds`.
     * @returns the tiers to award (empty when not eligible).
     */
    checkEligible(
        value: number,
        definition: AchievementEntity,
    ): Array<number | null> {
        const tierThresholds = definition.tierThresholds
        // single-tier badge -> the null tier once the bar is met
        if (!tierThresholds || tierThresholds.length === 0) {
            return value >= definition.threshold ? [null] : []
        }
        // tiered badge -> one 1-based tier per bar the value has cleared
        const reached: Array<number | null> = []
        tierThresholds.forEach((bar, index) => {
            if (value >= bar) {
                reached.push(index + 1)
            }
        })
        return reached
    }
}
