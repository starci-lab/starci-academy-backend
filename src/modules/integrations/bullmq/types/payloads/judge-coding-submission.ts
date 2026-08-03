/**
 * BullMQ job body for judging a coding-practice submission. The submission row
 * (with language, source, problem id) already exists in `coding_submissions`;
 * the worker loads it plus the problem's testcases by id, so the payload only
 * needs to carry identifiers.
 */
export interface JudgeCodingSubmissionPayload {
    /** Tracked job row id (`jobs.id`). */
    jobId: string
    /** `coding_submissions.id` to judge. */
    codingSubmissionId: string
}
