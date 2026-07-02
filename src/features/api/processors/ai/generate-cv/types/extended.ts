import {
    UserCvGenerationEntity,
} from "@modules/databases"

/**
 * Extended context for the generate-cv pipeline: the `Pending` generation row
 * created at enqueue time, loaded once by the worker and shared across steps.
 */
export interface ExtendedGenerateCvContext {
    /** The CV generation run being processed (status `Pending` on entry). */
    cvGeneration: UserCvGenerationEntity
}
