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
