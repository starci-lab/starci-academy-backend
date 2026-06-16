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

/** CDC row from `coding_submissions` (a submission moves the submitter's coding aggregate). */
export interface CodingSubmissionCdcRow {
    /** The user who submitted. */
    user_id?: string
}

/** Params for reading the distinct-solved coding leaderboard. */
export interface UserCodingLeaderboardParams {
    /** Max entries to return (defaults applied by the service). */
    limit?: number
}

/** Raw leaderboard row read from `user_coding_projections` joined to users. */
export interface CodingLeaderboardRow {
    /** The ranked user's id. */
    user_id: string
    /** The ranked user's username (nullable in storage). */
    username: string | null
    /** Distinct problems solved, extracted from the jsonb value. */
    solved_count: number
}

/** One typed leaderboard entry returned by {@link UserCodingProjectionService.getLeaderboard}. */
export interface CodingLeaderboardEntryResult {
    /** The ranked user's id. */
    userId: string
    /** The ranked user's username ("" when unset). */
    username: string
    /** Distinct problems solved. */
    solvedCount: number
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
