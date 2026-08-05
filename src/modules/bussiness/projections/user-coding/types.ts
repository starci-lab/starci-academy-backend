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
    /** Language value (python/typescript/...) or difficulty value (easy/medium/hard). */
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
    /** Solved counts grouped by problem domain (arrays/strings/trees/...). */
    byDomain: Array<UserCodingSkillCountResult>
}

/** One solved problem in the projection's jsonb `value.history` (raw jsonb shape). */
export interface UserCodingHistoryValue {
    /** Coding-problem title. */
    problemTitle: string
    /** Stable URL slug of the problem (drives `/profile/<username>/skills/<slug>`). */
    slug: string
    /** Difficulty value (easy/medium/hard). */
    difficulty: string
    /** Problem domain value (arrays/strings/trees/dynamicProgramming/...). */
    domain: string
    /** Language values the problem was solved in. */
    languages: Array<string>
    /** First-solve timestamp as an ISO string (jsonb), or null. */
    firstSolvedAt: string | null
}

/** One solved problem in the typed view returned by {@link UserCodingProjectionService.getHistory}. */
export interface UserCodingHistoryResult {
    /** Coding-problem title. */
    problemTitle: string
    /** Stable URL slug of the problem (drives `/profile/<username>/skills/<slug>`). */
    slug: string
    /** Difficulty value (easy/medium/hard). */
    difficulty: string
    /** Problem domain value (arrays/strings/trees/dynamicProgramming/...). */
    domain: string
    /** Language values the problem was solved in. */
    languages: Array<string>
    /** First-solve time, or null. */
    firstSolvedAt: Date | null
}

/** Params for reading a user's 1-based global rank by distinct solved coding problems. */
export interface UserCodingRankParams {
    /** The user whose global coding rank to compute. */
    userId: string
}

/** Raw row carrying a user's computed coding standing in a single pass. */
export interface UserCodingStandingRow {
    /** This user's distinct solved-problem count (0 when no row). */
    mine: number
    /** The user's 1-based global rank, or null when they have 0 solves. */
    rank: number | null
    /** How many pooled users this user strictly beats (lower solved count). */
    beaten: number
    /** Total pool size (users with at least one solve). */
    pool_size: number
}

/** A user's derived coding standing: 1-based rank + percentile by distinct solved problems. */
export interface CodingStandingResult {
    /** The user's 1-based global coding rank, or null when they have 0 solves. */
    rank: number | null
    /** 0-100 percentile of users this user's solved count beats, or null when they have 0 solves. */
    percentile: number | null
}
