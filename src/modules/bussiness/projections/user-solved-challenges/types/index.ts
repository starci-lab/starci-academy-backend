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
    /** Challenge / submission-requirement title. */
    title: string
    /** Submitted link (GitHub repo or Google Docs URL). */
    submissionUrl: string
    /** Submission type value (githubUrl / googleDocsUrl). */
    submissionType: string
    /** Language the user chose, or null. */
    selectedLang: string | null
    /** Passed timestamp as an ISO string (jsonb), or null. */
    passedAt: string | null
}

/** One passed challenge submission in the typed view returned by the service. */
export interface UserSolvedChallengeResult {
    /** Challenge / submission-requirement title. */
    title: string
    /** Submitted link (GitHub repo or Google Docs URL). */
    submissionUrl: string
    /** Submission type value (githubUrl / googleDocsUrl). */
    submissionType: string
    /** Language the user chose, or null. */
    selectedLang: string | null
    /** Passed time, or null. */
    passedAt: Date | null
}
