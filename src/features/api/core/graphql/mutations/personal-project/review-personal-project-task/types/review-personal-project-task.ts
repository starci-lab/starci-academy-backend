import type {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"

/** Result of resolving the GitHub URL to review, and whether the caller sent one this call. */
export interface ResolvedReviewGithubUrl {
    /** The URL to review: the caller's (trimmed), else the enrollment's stored one. */
    resolvedGithubUrl: string
    /** Whether the caller sent a non-empty `githubUrl` this call (vs. reusing the stored one). */
    hasGithubUrlInRequest: boolean
}

/** Result of resolving the branch to review, and whether the caller sent one this call. */
export interface ResolvedReviewBranch {
    /** Whether the caller sent a `branch` field at all (vs. omitted). */
    branchProvided: boolean
    /** Trimmed branch name, or `""` when not provided. */
    branchTrimmed: string
    /** The branch to enqueue the review with, or `undefined` for the worker's default. */
    resolvedBranchForEnqueue: string | undefined
}

/** Params to patch the enrollment's stored GitHub URL/branch with what this call resolved. */
export interface ApplyReviewEnrollmentPatchParams {
    /** The enrollment row to patch and (conditionally) save. */
    enrollment: EnrollmentEntity
    /** From {@link ResolvedReviewGithubUrl}. */
    hasGithubUrlInRequest: boolean
    /** From {@link ResolvedReviewGithubUrl}. */
    resolvedGithubUrl: string
    /** From {@link ResolvedReviewBranch}. */
    branchProvided: boolean
    /** From {@link ResolvedReviewBranch}. */
    branchTrimmed: string
}
