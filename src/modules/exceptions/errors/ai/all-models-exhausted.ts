import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/**
 * Metadata for the all-models-exhausted exception.
 */
export interface AllModelsExhaustedExceptionMetadata extends AbstractExceptionMetadata {
    /** Total `(model, key)` attempts the loop made before giving up. */
    attempts: number
    /** Number of models in the fallback chain that were tried. */
    modelsTried: number
}

/**
 * Thrown by `UseApiService.useApi` when every model in the fallback chain
 * has run out of healthy keys.
 */
export class AllModelsExhaustedException extends AbstractException {
    constructor({
        attempts,
        modelsTried,
        originalError,
    }: AllModelsExhaustedExceptionMetadata) {
        super(
            `AI Balancer: all ${modelsTried} fallback models exhausted after ${attempts} attempts`,
            "ALL_MODELS_EXHAUSTED_EXCEPTION",
            {
                attempts,
                modelsTried,
                originalError,
            },
        )
    }
}
