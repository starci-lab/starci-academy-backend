import type {
    EntityManager,
} from "typeorm"

/** Params for recomputing one user's coding projection row. */
export interface RecomputeUserCodingParams {
    /** The user whose coding aggregate to rebuild. */
    userId: string
    /** Caller's transaction manager (inline write path); omit for the read path. */
    entityManager?: EntityManager
}

/** One solved-count bucket (language or difficulty) in the projection value / read. */
export interface UserCodingSkillCountResult {
    /** Language value (python/typescript/…) or difficulty value (easy/medium/hard). */
    key: string
    /** Distinct problems solved in this bucket. */
    solved: number
}

/** The skills slice returned by {@link UserCodingProjectionService.getSkills}. */
export interface UserCodingSkillsResult {
    /** Solved counts grouped by language. */
    byLanguage: Array<UserCodingSkillCountResult>
    /** Solved counts grouped by difficulty. */
    byDifficulty: Array<UserCodingSkillCountResult>
}

/** One solved problem in the projection's jsonb `value.history` (raw jsonb shape). */
export interface UserCodingHistoryValue {
    /** Coding-problem title. */
    problemTitle: string
    /** Difficulty value (easy/medium/hard). */
    difficulty: string
    /** Language values the problem was solved in. */
    languages: Array<string>
    /** First-solve timestamp as an ISO string (jsonb), or null. */
    firstSolvedAt: string | null
}

/** One solved problem in the typed view returned by {@link UserCodingProjectionService.getHistory}. */
export interface UserCodingHistoryResult {
    /** Coding-problem title. */
    problemTitle: string
    /** Difficulty value (easy/medium/hard). */
    difficulty: string
    /** Language values the problem was solved in. */
    languages: Array<string>
    /** First-solve time, or null. */
    firstSolvedAt: Date | null
}
