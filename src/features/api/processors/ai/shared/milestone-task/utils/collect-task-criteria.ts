import type {
    MilestoneTaskApproachCriteriaEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task-approach-criteria.entity"
import type {
    MilestoneTaskOutcomeCriteriaEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task-outcome-criteria.entity"
import type {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import type {
    CriterionLangProse,
    ResolvedChallengeCriterion,
} from "../../challenge-submission/types/criteria"
import {
    pickLangBody,
} from "../../challenge-submission/utils/pick-lang-body"

/**
 * Collect the grading criteria for a SCHEMA V2 milestone task -- mirrors the Challenge V2
 * `collectSubmissionCriteria` (criterion-first, resolved to the learner's chosen language), but each
 * milestone criterion carries its OWN explicit `score` (outcome 10 / approach 40-15-15) instead of a
 * split bucket weight. Outcome prose is agnostic (a single `agnostic` lang row -> `pickLangBody`
 * fallback); approach prose is per-language.
 *
 * @param task - The milestone task with `outcomeCriteria.langs` + `approachCriteria.langs` loaded.
 * @param lang - The learner's chosen programming language (typescript/java/csharp/go).
 * @returns The flattened, ordered list of criteria to grade (outcome first, then approach).
 */
export function collectMilestoneTaskCriteria(
    task: MilestoneTaskEntity | undefined,
    lang: string | undefined,
): Array<ResolvedChallengeCriterion> {
    const outcomeItems: Array<MilestoneTaskOutcomeCriteriaEntity> = [...(task?.outcomeCriteria ?? [])]
        .sort((prev, next) => prev.orderIndex - next.orderIndex)
    const outcome: Array<ResolvedChallengeCriterion> = outcomeItems.map((criterion) => ({
        body: pickLangBody(criterion.langs as Array<CriterionLangProse>,
            lang),
        score: criterion.score ?? 0,
        critical: Boolean(criterion.critical),
        kind: "outcome",
    }))
    const approachItems: Array<MilestoneTaskApproachCriteriaEntity> = [...(task?.approachCriteria ?? [])]
        .sort((prev, next) => prev.orderIndex - next.orderIndex)
    const approach: Array<ResolvedChallengeCriterion> = approachItems.map((criterion) => ({
        body: pickLangBody(criterion.langs as Array<CriterionLangProse>,
            lang),
        score: criterion.score ?? 0,
        critical: Boolean(criterion.critical),
        kind: "approach",
    }))
    return [
        ...outcome,
        ...approach,
    ]
}
