import type {
    CodingDifficulty,
    CodingLanguage,
    CodingProblemEntity,
    CodingSubmissionEntity,
    Locale,
} from "@modules/databases"

/** Params for listing coding problems with optional filters + pagination. */
export interface ListCodingProblemsParams {
    /** Filter by difficulty tier. */
    difficulty?: CodingDifficulty
    /** Filter to problems carrying this tag. */
    tag?: string
    /** 1-based page number. */
    page?: number
    /** Page size. */
    limit?: number
    /** When set, compute which listed problems this user has solved. */
    userId?: string
    /** Locale for translated title (statement omitted in list view). */
    locale?: Locale
}

/** Result of listing coding problems. */
export interface ListCodingProblemsResult {
    /** The page of problems (translations applied to title). */
    problems: Array<CodingProblemEntity>
    /** Total number of problems matching the filters. */
    total: number
    /** Ids of problems the requesting user has an Accepted submission for. */
    solvedProblemIds: Array<string>
}

/** Params for loading one problem by slug. */
export interface GetCodingProblemParams {
    /** Stable URL slug. */
    slug: string
    /** Locale for translated title/statement. */
    locale?: Locale
}

/** Params for the coding leaderboard. */
export interface CodingLeaderboardParams {
    /** Max number of ranked users to return. */
    limit?: number
}

/** One ranked entry in the coding leaderboard. */
export interface CodingLeaderboardEntry {
    /** The user's id. */
    userId: string
    /** The user's display username (may be empty when unset). */
    username: string
    /** Number of distinct problems the user has solved (Accepted). */
    solvedCount: number
}

/** Params for submitting a solution. */
export interface SubmitCodingSolutionParams {
    /** Submitting user's id. */
    userId: string
    /** Target problem slug. */
    slug: string
    /** Language of the submission. */
    language: CodingLanguage
    /** The submitted source code. */
    sourceCode: string
}

/** Result of submitting a solution. */
export interface SubmitCodingSolutionResult {
    /** The created `coding_submissions.id`. */
    submissionId: string
    /** The judging `jobs.id` to subscribe to over Socket.IO. */
    jobId: string
}

/** Params for listing the current user's submissions to one problem. */
export interface ListMyCodingSubmissionsParams {
    /** The requesting user's id. */
    userId: string
    /** Target problem slug. */
    slug: string
    /** 1-based page number. */
    page?: number
    /** Page size. */
    limit?: number
}

/** Result of listing a user's submissions. */
export interface ListMyCodingSubmissionsResult {
    /** The page of submissions (newest first). */
    submissions: Array<CodingSubmissionEntity>
    /** Total number of submissions by the user for the problem. */
    total: number
}
