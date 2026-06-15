/** Raw row from the by-language solved-count grouping. */
export interface UserCodingSkillLanguageRow {
    /** Submission language value (python/typescript/…). */
    language: string
    /** Distinct problems solved in that language. */
    solved: number
}

/** Raw row from the by-difficulty solved-count grouping. */
export interface UserCodingSkillDifficultyRow {
    /** Problem difficulty value (easy/medium/hard). */
    difficulty: string
    /** Distinct problems solved at that difficulty. */
    solved: number
}
