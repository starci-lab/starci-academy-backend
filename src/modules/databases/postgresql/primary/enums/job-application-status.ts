import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/lib/common/utils/enum"

/** Employer-facing lifecycle of an internal job application. */
export enum JobApplicationStatus {
    /** Application is persisted and awaiting employer review. */
    Submitted = "submitted",
    /** Employer has started evaluating the application. */
    Reviewing = "reviewing",
    /** Employer has declined the application. */
    Rejected = "rejected",
    /** Employer has accepted the application. */
    Accepted = "accepted",
}

export const GraphQLTypeJobApplicationStatus = createEnumType(JobApplicationStatus)

registerEnumType(
    GraphQLTypeJobApplicationStatus,
    {
        name: "JobApplicationStatus",
        description: "Lifecycle state of an internal job application.",
    },
)
