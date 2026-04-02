export interface ProccessGitUrlPayload {
    /** The ID of the tracked job record. */
    jobId: string
    /** The ID of the challenge to process. */
    challengeId: string
    /** The ID of the user that submitted the challenge. */
    userId: string
    /** Challenge submission definition id (`challenge_submissions.id`). */
    submissionId: string
    /** Optional Git branch when cloning the submitted repository. */
    branch?: string
}
