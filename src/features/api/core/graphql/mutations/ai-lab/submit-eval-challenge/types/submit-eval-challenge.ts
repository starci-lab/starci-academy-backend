import type {
    Locale,
} from "@modules/databases"
import type {
    SubmitEvalChallengeInput,
} from "../graphql-types"

/** Params for {@link SubmitEvalChallengeService.execute}. */
export interface SubmitEvalChallengeParams {
    /** Validated mutation input (eval set, enrollment, prompts, params, lane). */
    input: SubmitEvalChallengeInput
    /** Authenticated learner id submitting the eval run. */
    userId: string
    /** Request locale (drives the judge feedback language). */
    locale: Locale
}

/** Result of {@link SubmitEvalChallengeService.execute}. */
export interface SubmitEvalChallengeResult {
    /** Created eval run id (status Pending until the job grades it). */
    evalRunId: string
    /** Enqueued grading job id. */
    jobId: string
}
