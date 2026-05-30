import type {
    ChallengeSubmissionEntity,
} from "@modules/databases"

/** Minimal shape shared by approach/outcome criterion language rows (structural — either entity). */
interface CriterionLangProse {
    /** Programming language of this prose row. */
    lang: string
    /** Criterion prose text for that language. */
    body: string | null
}

/** A flattened yes/no grading criterion resolved for one submission + language. */
export interface ResolvedChallengeCriterion {
    /** Criterion description: what is checked / observable evidence / what fails it. */
    body: string
    /** Points awarded when the criterion is met (the rubric weight split across its criteria). */
    score: number
    /** When true, failing this criterion zeroes the whole submission. */
    critical: boolean
    /** Where the criterion came from: observable outcome or per-language approach. */
    kind: "outcome" | "approach"
}

/**
 * Pick a criterion's prose for the learner's chosen language; fall back to the first language bucket
 * when the chosen language is absent (e.g. a rubric that omits Go).
 *
 * @param langs - The criterion's per-language prose rows.
 * @param lang - The learner's chosen programming language.
 * @returns The matching (or fallback) prose, or an empty string when there is none.
 */
function pickLangBody(
    langs: Array<CriterionLangProse> | undefined,
    lang: string | undefined,
): string {
    const list = langs ?? []
    // exact language match first
    const matched = list.find((entry) => entry.lang === lang)
    // fall back to the first available language so grading never silently drops a criterion
    return (matched ?? list[0])?.body ?? ""
}

/**
 * Collect the grading criteria for a SCHEMA V2 submission: the per-language `outcomeCriteria` and
 * `approachCriteria` of the SPECIFIC submission being graded, resolved to the learner's chosen
 * language. Per-criterion score is NOT stored — each bucket's weight (`outcomeScore` 30 /
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
    // observable-behaviour criteria — split the submission's outcome weight (30) across them
    const outcomeItems = [...(submission?.outcomeCriteria ?? [])].sort(
        (prev, next) => prev.orderIndex - next.orderIndex,
    )
    const outcomeWeight = submission?.outcomeScore ?? 0
    const outcomePerCriterion = outcomeItems.length > 0 ? outcomeWeight / outcomeItems.length : 0
    const outcome: Array<ResolvedChallengeCriterion> = outcomeItems.map((criterion) => ({
        body: pickLangBody(criterion.langs,
            lang),
        score: outcomePerCriterion,
        critical: criterion.critical,
        kind: "outcome",
    }))
    // per-language approach criteria — split the submission's approach weight (70) across them
    const approachItems = [...(submission?.approachCriteria ?? [])].sort(
        (prev, next) => prev.orderIndex - next.orderIndex,
    )
    const approachWeight = submission?.approachScore ?? 0
    const approachPerCriterion = approachItems.length > 0 ? approachWeight / approachItems.length : 0
    const approach: Array<ResolvedChallengeCriterion> = approachItems.map((criterion) => ({
        body: pickLangBody(criterion.langs,
            lang),
        score: approachPerCriterion,
        critical: criterion.critical,
        kind: "approach",
    }))
    return [
        ...outcome,
        ...approach,
    ]
}

/**
 * Render the criteria list into the LLM prompt sections (one block per criterion).
 *
 * @param criteria - The resolved criteria to render.
 * @returns A markdown string listing every criterion with its index, score and critical flag.
 */
export function renderCriteriaPromptSections(
    criteria: Array<ResolvedChallengeCriterion>,
): string {
    return criteria
        .map(
            (criterion, index) => {
                const criticalTag = criterion.critical ? " (CRITICAL)" : ""
                return [
                    `### Criterion ${index} [${criterion.kind}]${criticalTag} (maxScore: ${criterion.score})`,
                    criterion.body,
                ].join("\n")
            },
        )
        .join("\n\n")
}
