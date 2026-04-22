import {
    registerEnumType 
} from "@nestjs/graphql"
import {
    createEnumType 
} from "@modules/common"

/**
 * The status of a job.
 */
export enum JobStatus {
    Queued = "queued",
    Processing = "processing",
    Completed = "completed",
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
