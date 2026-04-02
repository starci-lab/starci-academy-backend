import type {
    ChallengePromptEntity,
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import type {
    ProccessGitUrlPayload,
} from "@modules/bullmq"
import type {
    Document,
} from "@langchain/core/documents"
import type {
    JobContext,
} from "../../types"

/** Job context for the process-git-url pipeline; carries DB rows and intermediate documents. */
export interface ProccessGitUrlPipelineContext extends JobContext<ProccessGitUrlPayload> {
    /** Loaded repo documents (load-docs → split). */
    docs?: Array<Document>
    /** Split chunks (split → vectorize / grading context). */
    chunks?: Array<Document>
    /** GitHub URL from `user_challenge_submissions`. */
    submissionUrl?: string
    /** Grading rubric rows from `challenge_prompts`. */
    gradingPrompts?: Array<ChallengePromptEntity>
    /** User submission row to update after grading. */
    userChallengeSubmission?: UserChallengeSubmissionEntity
    /** Final score 1–20 after grading step. */
    score?: number
}
