import type {
    ChallengeEntity,
} from "@modules/databases"

/** A flattened yes/no grading criterion resolved for one submission. */
export interface ResolvedChallengeCriterion {
    /** Criterion description: what is checked / observable evidence / what fails it. */
    body: string
    /** Points awarded when the criterion is met. */
    score: number
    /** When true, failing this criterion zeroes the whole submission. */
    critical: boolean
    /** Where the criterion came from: language-agnostic outcome or per-language approach. */
    kind: "outcome" | "approach"
}

/** Read a string field off a loosely-typed jsonb criterion record. */
function readString(record: Record<string, unknown>, key: string): string {
    const value = record[key]
    return typeof value === "string" ? value : ""
}

/** Read a numeric field off a loosely-typed jsonb criterion record. */
function readNumber(record: Record<string, unknown>, key: string): number {
    const value = record[key]
    return typeof value === "number" ? value : Number(value) || 0
}

/** Read a boolean field off a loosely-typed jsonb criterion record. */
function readBoolean(record: Record<string, unknown>, key: string): boolean {
    return Boolean(record[key])
}

/**
 * Collect the grading criteria for a SCHEMA V2 challenge: the language-agnostic `outcomeCriteria`
 * plus the `approachCriteria` bucket matching the learner's chosen programming language. When no
 * language is supplied (or no bucket matches), only the outcome criteria are returned.
 *
 * @param challenge - The hydrated challenge (criteria are jsonb columns).
 * @param lang - The learner's chosen programming language (typescript/java/csharp/go).
 * @returns The flattened, ordered list of criteria to grade.
 */
export function collectChallengeCriteria(
    challenge: ChallengeEntity | undefined,
    lang: string | undefined,
): Array<ResolvedChallengeCriterion> {
    // language-agnostic outcome criteria
    const outcome: Array<ResolvedChallengeCriterion> = (challenge?.outcomeCriteria ?? []).map(
        (record) => ({
            body: readString(record,
                "body"),
            score: readNumber(record,
                "score"),
            critical: readBoolean(record,
                "critical"),
            kind: "outcome",
        }),
    )
    // per-language approach bucket matching the learner's chosen language
    const approachBucket = (challenge?.approachCriteria ?? []).find(
        (bucket) => readString(bucket,
            "lang") === lang,
    )
    const approachData = Array.isArray(approachBucket?.data)
        ? (approachBucket?.data as Array<Record<string, unknown>>)
        : []
    const approach: Array<ResolvedChallengeCriterion> = approachData.map(
        (record) => ({
            body: readString(record,
                "body"),
            score: readNumber(record,
                "score"),
            critical: readBoolean(record,
                "critical"),
            kind: "approach",
        }),
    )
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
