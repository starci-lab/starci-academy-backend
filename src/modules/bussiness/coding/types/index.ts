import type {
    CodingDifficulty,
    CodingLanguage,
    CodingProblemEntity,
    CodingProblemSolutionEntity,
    CodingSubmissionEntity,
    CodingVerdict,
    Locale,
} from "@modules/databases"

/**
 * Client-measured behavioural telemetry sent alongside a coding submission.
 * All fields are optional (older clients omit them). Currently captured for
 * transport only — no server-side consumer reads it back.
 */
export interface CodingClientTelemetry {
    /** Number of paste events into the editor during the attempt. */
    pasteCount?: number
    /** Largest single paste size in characters. */
    pasteSizeMax?: number
    /** Total keystrokes recorded in the editor. */
    keystrokeCount?: number
    /** Number of times the editor tab lost focus. */
    tabBlurCount?: number
    /** Elapsed time from opening the problem to submitting, in milliseconds. */
    timeOpenToSubmitMs?: number
}

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
    /** Locale for the pre-localized catalog title. */
    locale?: Locale
}

/** Result of listing coding problems (shared catalog only — no per-user state). */
export interface ListCodingProblemsResult {
    /** The page of problems (pre-localized title; catalog fields only). */
    problems: Array<CodingProblemEntity>
    /** Total number of problems matching the filters. */
    total: number
}

/** Params for loading one problem by slug. */
export interface GetCodingProblemParams {
    /** Stable URL slug. */
    slug: string
    /** Locale for translated title/statement. */
    locale?: Locale
}

/** Params for loading a problem's approach hint (from Elasticsearch). */
export interface GetCodingProblemHintParams {
    /** Stable URL slug. */
    slug: string
    /** Locale for the hint markdown (falls back to English). */
    locale?: Locale
}

/**
 * Raw `_source` shape of a coding-problem approach-hint document as stored in
 * Elasticsearch (both fields optional because the index/document may be partial
 * or missing).
 */
export interface CodingProblemHintSource {
    /** Stable URL slug of the problem. */
    slug?: string
    /** The approach-hint markdown body. */
    hint?: string
}

/** A problem's approach-hint document (sourced from Elasticsearch). */
export interface CodingProblemHintResult {
    /** Stable URL slug of the problem. */
    slug: string
    /** The approach-hint markdown. */
    hint: string
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
    /** Client behavioural telemetry for anti-cheat scoring (optional). */
    telemetry?: CodingClientTelemetry
    /** Best-effort client IP captured at submit time (optional). */
    ipAddress?: string | null
    /** Raw User-Agent captured at submit time (optional). */
    userAgent?: string | null
    /** Client device fingerprint captured at submit time (optional). */
    fingerprint?: string | null
}

/** Result of submitting a solution. */
export interface SubmitCodingSolutionResult {
    /** The created `coding_submissions.id`. */
    submissionId: string
    /** The judging `jobs.id` to subscribe to over Socket.IO. */
    jobId: string
}

/**
 * Result of recording a solution reveal: whether it was newly recorded plus the
 * problem's reference solutions. This gated mutation is the ONLY place solutions
 * are served to the client (the problem detail read never carries them).
 */
export interface RecordSolutionRevealResult {
    /** True when this call recorded a new reveal; false when already revealed. */
    revealed: boolean
    /** The problem's full reference solutions, one per supported language. */
    solutions: Array<CodingProblemSolutionEntity>
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

/**
 * Internal row shape returned by the distinct-problem-id SQL aggregates used to
 * compute per-user coding progress (solved / attempted / revealed problem ids).
 */
export interface CodingProblemIdRow {
    /** A distinct `coding_problem_id` (aliased as `id` in the query). */
    id: string
}

/**
 * Internal row shape returned by the user coding-points SQL (the user's
 * cumulative coding score).
 */
export interface CodingPointsRow {
    /** The user's cumulative coding score (Postgres may return it as text). */
    points: number | string
}

/** Params for reading a target user's accepted-submission summary for one problem. */
export interface GetAcceptedSubmissionSummaryParams {
    /** The target user's id (the profile owner being viewed, not necessarily the caller). */
    userId: string
    /** The problem's id (`coding_problems.id`). */
    problemId: string
}

/**
 * Raw row from the accepted-submission-summary SQL aggregate. Always exactly
 * one row (scalar subqueries with no FROM), with every field null when the
 * user has no accepted submission for the problem.
 *
 * The `passed_count` / `total_count` / `first_solved_at` fields are
 * deliberately snake_case — unlike every other interface in this file — because
 * they mirror the raw SQL column aliases returned by the query in
 * `coding-submission.service.ts` (`AS "passed_count"` etc.). This is an
 * intentional 1:1 mirror of the driver's row shape, not a naming-convention
 * oversight; do not rename these fields to camelCase.
 */
export interface AcceptedSubmissionSummaryRow {
    /** Distinct languages used across ALL accepted attempts, or null when none. */
    languages: Array<CodingLanguage> | null
    /** `passed_count` from the EARLIEST accepted attempt (Postgres may return int as text). */
    passed_count: number | string | null
    /** `total_count` from the EARLIEST accepted attempt (Postgres may return int as text). */
    total_count: number | string | null
    /** Earliest accepted attempt's `created_at`, or null when none. */
    first_solved_at: Date | null
}

/**
 * A target user's accepted-submission summary for one coding problem — backs
 * the public profile's `userCodingProblemDetail` read. Deliberately a
 * hand-rolled shape (never the raw {@link CodingSubmissionEntity}): it never
 * carries `sourceCode` / `perCaseResults` / reference solutions.
 */
export interface AcceptedSubmissionSummaryResult {
    /** Distinct languages the user solved this problem in, across all accepted attempts. */
    languages: Array<CodingLanguage>
    /** Always {@link CodingVerdict.Accepted} — this summary only exists when at least one accepted attempt exists. */
    verdict: CodingVerdict
    /** Passed-testcase count from the earliest accepted attempt. */
    passedCount: number
    /** Total-testcase count from the earliest accepted attempt. */
    totalCount: number
    /** When the problem was first solved. */
    firstSolvedAt: Date
}
