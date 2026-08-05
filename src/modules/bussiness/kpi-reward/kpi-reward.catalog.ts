import {
    KpiKey,
} from "@modules/databases/postgresql/primary/enums/kpi-key"

/**
 * Coin granted per unit of a KPI's FLOOR target when its reward is claimed
 * (`coinReward = Math.round(floorTarget * KPI_REWARD_PER_UNIT_TARGET[key])`).
 * Aiming higher (a bigger target) pays more -- but only the FLOOR (lowest
 * target in effect this week) counts, so raising the target after already
 * clearing a lower one cannot inflate the payout for work already done (see
 * `KpiWeeklyRewardFloorEntity`).
 *
 * Finalized against the shipped Coin economy (activity coin + shop prices) --
 * see `.artifacts/proposals/coin-xp-economy-numbers.proposal.md`. The
 * per-unit-multiplier shape was confirmed (not flat-per-tier): the bonus/effort
 * ratio holds constant at every target, matching "aim higher, earn more".
 * `flashcards` is deliberately the lowest multiplier -- it's the lowest-effort,
 * highest-volume KPI (presets up to 300/week), so a flat per-unit rate keeps
 * high-target grinding from paying disproportionately more than the other KPIs.
 */
export const KPI_REWARD_PER_UNIT_TARGET: Record<KpiKey, number> = {
    [KpiKey.Lessons]: 2,
    [KpiKey.StudyDays]: 4,
    [KpiKey.Challenges]: 5,
    [KpiKey.Coding]: 5,
    [KpiKey.Flashcards]: 0.2,
    [KpiKey.Milestones]: 10,
}

/**
 * Compute the coin reward for claiming one KPI at a given floor target.
 *
 * @param key - which KPI.
 * @param floorTarget - the lowest target that was in effect for this KPI this week.
 * @returns the coin amount to grant (rounded to the nearest whole coin).
 */
export const computeKpiCoinReward = (key: KpiKey, floorTarget: number): number =>
    Math.round(floorTarget * KPI_REWARD_PER_UNIT_TARGET[key])

/**
 * Per-KPI upper bound for a sane target (so a progress ring never goes
 * absurd). Enforced by {@link KpiRewardService.setTarget} when a user sets
 * their own weekly target.
 */
export const KPI_TARGET_MAX: Record<KpiKey, number> = {
    [KpiKey.Lessons]: 100,
    [KpiKey.StudyDays]: 7,
    [KpiKey.Challenges]: 100,
    [KpiKey.Coding]: 100,
    [KpiKey.Flashcards]: 1000,
    [KpiKey.Milestones]: 20,
}
