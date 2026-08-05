import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * The status of a job.
 */
export enum JobStatus {
    /** Worker has not claimed it yet — client keeps polling / subscribing. */
    Queued = "queued",
    /** In-flight — UI shows progress and must not resubmit as a new job. */
    Processing = "processing",
    /** Finished successfully — result payload is safe to read. */
    Completed = "completed",
    /** Terminal error recorded — UI may offer retry as a new enqueue. */
    Failed = "failed",
}

/**
 * Create the job status enum.
 */
export const GraphQLTypeJobStatus = createEnumType(JobStatus)

registerEnumType(
    GraphQLTypeJobStatus,
    {
        name: "JobStatus",
        description: "The status of a job.",
        valuesMap: {
            [JobStatus.Queued]: {
                description: "The job is queued.",
            },
            [JobStatus.Processing]: {
                description: "The job is processing.",
            },
            [JobStatus.Completed]: {
                description: "The job is completed.",
            },
            [JobStatus.Failed]: {
                description: "The job is failed.",
            },
        },
    },
)

