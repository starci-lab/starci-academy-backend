import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * How a candidate applies to a job posting (`job_postings.apply_method`) — a
 * discriminator for which of `applyUrl` / `applyEmail` is populated, mirroring
 * how `FoundationKind` discriminates a foundation resource's payload shape.
 */
export enum JobApplyMethod {
    /** Candidate applies by visiting `applyUrl` (external ATS, form, etc.). */
    ExternalUrl = "external_url",
    /** Candidate applies by emailing `applyEmail`. */
    Email = "email",
}

export const GraphQLTypeJobApplyMethod = createEnumType(
    JobApplyMethod,
)

registerEnumType(
    GraphQLTypeJobApplyMethod,
    {
        name: "JobApplyMethod",
        description: "How a candidate applies to a job posting.",
        valuesMap: {
            [JobApplyMethod.ExternalUrl]: {
                description: "Apply via an external URL.",
            },
            [JobApplyMethod.Email]: {
                description: "Apply by sending an email.",
            },
        },
    },
)
