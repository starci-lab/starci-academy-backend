import {
    createEnumType,
} from "@modules/common"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Processing status of a CV submission.
 */
export enum CvSubmissionStatus {
    /** Submission created; not yet picked up by the worker. */
    Pending = "pending",
    /** Worker is currently extracting / analysing. */
    Processing = "processing",
    /** Analysis completed successfully. */
    Done = "done",
    /** Worker failed; see job logs for details. */
    Failed = "failed",
}

export const GraphQLTypeCvSubmissionStatus = createEnumType(CvSubmissionStatus)

registerEnumType(
    GraphQLTypeCvSubmissionStatus,
    {
        name: "CvSubmissionStatus",
        description: "Processing status of a CV submission.",
        valuesMap: {
            [CvSubmissionStatus.Pending]: {
                description: "Submission created; not yet picked up by the worker.",
            },
            [CvSubmissionStatus.Processing]: {
                description: "Worker is currently extracting / analysing.",
            },
            [CvSubmissionStatus.Done]: {
                description: "Analysis completed successfully.",
            },
            [CvSubmissionStatus.Failed]: {
                description: "Worker failed; see job logs for details.",
            },
        },
    },
)
