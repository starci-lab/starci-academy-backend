import type {
    AiMode,
    ModelProvider,
} from "@modules/databases"

/** Params for {@link GradingLaneValidationService.validate}. */
export interface ValidateGradingLaneParams {
    /** Submitter whose entitlement gates the lane. */
    userId: string
    /** Requested lane; defaults to {@link AiMode.Auto} when omitted. */
    mode?: AiMode
    /** Concrete model name from the client picker. */
    model?: string
    /** Provider for {@link ValidateGradingLaneParams.model}. */
    provider?: ModelProvider
}
