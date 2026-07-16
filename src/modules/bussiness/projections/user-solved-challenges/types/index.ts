import type {
    EntityManager,
} from "typeorm"

/** Params for recomputing one user's solved-challenges projection row. */
export interface RecomputeUserSolvedChallengesParams {
    /** The user whose passed-challenge-submissions aggregate to rebuild. */
    userId: string
    /** Caller's transaction manager (inline write path); omit for the read path. */
    entityManager?: EntityManager
}

/** CDC row from `user_challenge_submission_attempts` (carries the parent submission id, not user_id). */
export interface ChallengeSubmissionAttemptCdcRow {
    /** The user_challenge_submissions row this attempt belongs to. */
    user_challenge_submission_id?: string
}

/** Raw row resolving the owning user id from a challenge-submission attempt's parent submission. */
export interface SolvedSubmissionUserIdRow {
    /** The user who owns the looked-up submission. */
    user_id: string
}

/** One passed challenge submission in the projection's jsonb `value.challenges` (raw jsonb shape). */
export interface UserSolvedChallengeValue {
    /** Stable id for this submission (`user_challenge_submissions.id`) — the detail-lookup key. Absent on a cache row written before this field existed (self-heals on next recompute). */
    id?: string
    /** Challenge / submission-requirement title. */
    title: string
    /** Submitted link (GitHub repo or Google Docs URL). */
    submissionUrl: string
    /** Submission type value (githubUrl / googleDocsUrl). */
    submissionType: string
    /** Language the user chose, or null. */
    selectedLang: string | null
    /** Challenge difficulty value (easy/medium/hard/insane/…), or null for legacy submissions lacking a parent challenge. */
    difficulty: string | null
    /** Score from the passing attempt (the attempt that set passedAt), or null when not graded. */
    score: number | null
    /** Raw id (`courses.id`) of the course the challenge belongs to, or null when unresolved. Absent on a cache row written before this field existed (self-heals on next recompute). */
    courseId?: string | null
    /** Title of the course the challenge belongs to (default-locale snapshot), or null when the parent course is unresolved. */
    courseTitle: string | null
    /** Passed timestamp as an ISO string (jsonb), or null. */
    passedAt: string | null
}

/** Result of a user's derived challenge-strength percentile + global rank. */
export interface ChallengeStrengthResult {
    /** 0-100 percentile of users this user's strength score beats (rounded), or null when the user has no passes (unranked). */
    percentile: number | null
    /** 1-based global rank by strength score (strengthScore DESC, tie-break updated_at ASC), or null when the user has no passes. */
    rank: number | null
    /** Total XP earned from challenges (sum of `xp_histories.amount` for the Challenge source); 0 when none. */
    xp: number
}

/** Raw row carrying a user's computed challenge-strength percentile + rank, plus pool size. */
export interface ChallengeStrengthRow {
    /** The user's own strength score (0 when no passes). */
    mine: number
    /** The user's 1-based global rank among the strength pool (null when mine <= 0). */
    rank: number | null
    /** Count of pool users with a strictly lower strength score than this user. */
    beaten: number
    /** Total users in the strength pool (strengthScore > 0, includes this user when ranked). */
    pool_size: number
    /** Total challenge XP from the ledger (sum of amounts for the Challenge source). */
    xp: number
}

/** One passed challenge submission in the typed view returned by the service. */
export interface UserSolvedChallengeResult {
    /** Stable id for this submission (`user_challenge_submissions.id`) — the detail-lookup key, or null for a not-yet-recomputed cache row. */
    id: string | null
    /** Challenge / submission-requirement title. */
    title: string
    /** Submitted link (GitHub repo or Google Docs URL). */
    submissionUrl: string
    /** Submission type value (githubUrl / googleDocsUrl). */
    submissionType: string
    /** Language the user chose, or null. */
    selectedLang: string | null
    /** Challenge difficulty value (easy/medium/hard/insane/…), or null for legacy submissions lacking a parent challenge. */
    difficulty: string | null
    /** Score from the passing attempt (the attempt that set passedAt), or null when not graded. */
    score: number | null
    /** Raw id (`courses.id`) of the course the challenge belongs to, or null when unresolved — the resolver turns this into `courseGlobalId`. */
    courseId: string | null
    /** Title of the course the challenge belongs to (default-locale snapshot), or null when the parent course is unresolved. */
    courseTitle: string | null
    /** Passed time, or null. */
    passedAt: Date | null
}
