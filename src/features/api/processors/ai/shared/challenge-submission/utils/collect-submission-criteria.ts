import type {
    ChallengeSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/challenge-submission.entity"
import type {
    ResolvedChallengeCriterion,
} from "../types/criteria"
import {
    pickLangBody,
} from "./pick-lang-body"
import {
    splitIntegerWeight,
} from "./split-integer-weight"

/**
 * Collect the grading criteria for a SCHEMA V2 submission: the per-language `outcomeCriteria` and
 * `approachCriteria` of the SPECIFIC submission being graded, resolved to the learner's chosen
 * language. Per-criterion score is NOT stored -- each bucket's weight (`outcomeScore` 30 /
 * `approachScore` 70 on the submission) is split equally across its criteria.
 *
 * @param submission - The hydrated challenge submission (with `approachCriteria.langs` +
 *   `outcomeCriteria.langs` loaded).
 * @param lang - The learner's chosen programming language (typescript/java/csharp/go).
 * @returns The flattened, ordered list of criteria to grade (outcome first, then approach).
 */
export function collectSubmissionCriteria(
    submission: ChallengeSubmissionEntity | undefined,
    lang: string | undefined,
): Array<ResolvedChallengeCriterion> {
    const outcomeItems = [...(submission?.outcomeCriteria ?? [])].sort(
        (prev, next) => prev.orderIndex - next.orderIndex,
    )
    const outcomeWeight = submission?.outcomeScore ?? 0
    const outcomeScores = splitIntegerWeight(outcomeWeight,
        outcomeItems.length)
    const outcome: Array<ResolvedChallengeCriterion> = outcomeItems.map((criterion, index) => ({
        body: pickLangBody(criterion.langs,
            lang),
        score: outcomeScores[index] ?? 0,
        critical: criterion.critical,
        kind: "outcome",
    }))
    const approachItems = [...(submission?.approachCriteria ?? [])].sort(
        (prev, next) => prev.orderIndex - next.orderIndex,
    )
    const approachWeight = submission?.approachScore ?? 0
    const approachScores = splitIntegerWeight(approachWeight,
        approachItems.length)
    const approach: Array<ResolvedChallengeCriterion> = approachItems.map((criterion, index) => ({
        body: pickLangBody(criterion.langs,
            lang),
        score: approachScores[index] ?? 0,
        critical: criterion.critical,
        kind: "approach",
    }))
    return [
        ...outcome,
        ...approach,
    ]
}
