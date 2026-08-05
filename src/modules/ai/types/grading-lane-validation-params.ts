import type {
    ModelProvider,
} from "@modules/databases"

/** Params for {@link GradingLaneValidationService.validate}. */
export interface ValidateGradingLaneParams {
    /** Submitter whose entitlement gates the model pick. */
    userId: string
    /** Concrete model name from the client picker; absent -> balancer picks. */
    model?: string
    /** Provider for {@link ValidateGradingLaneParams.model}. */
    provider?: ModelProvider
}
