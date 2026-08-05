import type {
    SubmitChallengeSubmissionRequest,
} from "../graphql-types/request"
import type {
    ExecuteParams,
} from "../../../../../types/execute"

/** Params for `SubmitChallengeSubmissionService.execute`. */
export type SubmitChallengeSubmissionParams =
    ExecuteParams<SubmitChallengeSubmissionRequest>

/** Result of `SubmitChallengeSubmissionService.execute`. */
export interface SubmitChallengeSubmissionResult {
    jobId: string
}
