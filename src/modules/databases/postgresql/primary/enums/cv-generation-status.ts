import {
    createEnumType,
} from "@modules/common"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Processing status of a CV generation run.
 */
export enum CvGenerationStatus {
    /** Run created; not yet picked up by the worker. */
    Pending = "pending",
    /** Worker is currently assembling / generating the CV. */
    Processing = "processing",
    /** Generation completed successfully. */
    Done = "done",
    /** Worker failed; see `errorMessage` / job logs for details. */
    Failed = "failed",
}

export const GraphQLTypeCvGenerationStatus = createEnumType(CvGenerationStatus)

registerEnumType(
    GraphQLTypeCvGenerationStatus,
    {
        name: "CvGenerationStatus",
        description: "Processing status of a CV generation run.",
        valuesMap: {
            [CvGenerationStatus.Pending]: {
                description: "Run created; not yet picked up by the worker.",
            },
            [CvGenerationStatus.Processing]: {
                description: "Worker is currently assembling / generating the CV.",
            },
            [CvGenerationStatus.Done]: {
                description: "Generation completed successfully.",
            },
            [CvGenerationStatus.Failed]: {
                description: "Worker failed; see errorMessage / job logs for details.",
            },
        },
    },
)
