/** Where a SCHEMA V2 grading criterion came from within the rubric. */
export type ResolvedChallengeCriterionKind = "outcome" | "approach"

/** Minimal shape shared by approach/outcome criterion language rows (structural — either entity). */
export interface CriterionLangProse {
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
    kind: ResolvedChallengeCriterionKind
}
