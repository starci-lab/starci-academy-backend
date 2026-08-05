import {
    KpiKey,
} from "@modules/databases/postgresql/primary/enums/kpi-key"
import type {
    UserStatsResult,
} from "./types"

/**
 * Map a user-stats projection onto each weekly KPI's CURRENT value, keyed by
 * {@link KpiKey}. Single source of truth shared by `myKpis` (display) and the
 * KPI-reward claim (eligibility check) so the two can never read a different
 * "current" for the same KPI.
 *
 * @param stats - the projection read via {@link UserStatsProjectionService.getStats}.
 * @returns the current-week value for every KPI.
 */
export const getKpiCurrentValues = (stats: UserStatsResult): Record<KpiKey, number> => ({
    [KpiKey.Lessons]: stats.weeklyLessons,
    [KpiKey.StudyDays]: stats.weeklyStudyDays,
    [KpiKey.Challenges]: stats.weeklyChallenges,
    [KpiKey.Coding]: stats.weeklyCoding,
    [KpiKey.Flashcards]: stats.weeklyFlashcards,
    [KpiKey.Milestones]: stats.weeklyMilestones,
})
