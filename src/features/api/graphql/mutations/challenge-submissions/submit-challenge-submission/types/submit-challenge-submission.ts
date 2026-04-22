import type {
    SubmitChallengeSubmissionRequest,
} from "../graphql-types"
import type {
    ExecuteParams,
} from "../../../../../types"

/** Params for `SubmitChallengeSubmissionService.execute`. */
export type SubmitChallengeSubmissionParams =
    ExecuteParams<SubmitChallengeSubmissionRequest>

/** Result of `SubmitChallengeSubmissionService.execute`. */
export interface SubmitChallengeSubmissionResult {
    jobId: string
}
