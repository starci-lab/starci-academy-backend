import type {
    SubmitChallengeSubmissionRequest,
} from "../graphql-types/request"
import type {
    ExecuteParams,
} from "../../../../../types/execute"
import type {
    ValidatedGradingLane,
} from "@modules/ai/types/grading"
import type {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"

/** Params for `SubmitChallengeSubmissionService.execute`. */
export type SubmitChallengeSubmissionParams =
    ExecuteParams<SubmitChallengeSubmissionRequest>

/** Result of `SubmitChallengeSubmissionService.execute`. */
export interface SubmitChallengeSubmissionResult {
    jobId: string
}

/** Params to persist the caller's grading model/provider/lang selection on the submission row. */
export interface ApplySelectedGradingPreferencesParams {
    /** The client-sent model pick; `undefined` = leave the previous choice untouched. */
    selectedModel: string | undefined
    /** The client-sent provider pick; `undefined` = leave the previous choice untouched. */
    selectedModelProvider: ModelProvider | undefined
    /** The client-sent programming language; `undefined` = leave the previous choice untouched. */
    lang: string | undefined
    /** The validated lane, whose resolved model/provider are what actually get persisted. */
    validatedLane: ValidatedGradingLane
}
