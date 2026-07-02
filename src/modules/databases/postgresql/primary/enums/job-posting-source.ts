import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Where a job posting row originated (`job_postings.source`) — a provenance
 * tag, NOT a moderation state. Both values go live immediately on insert;
 * there is no approve/reject workflow for v1.
 */
export enum JobPostingSource {
    /** Curated by the content team via the `.mount/data/jobs` seed pipeline. */
    Seeded = "seeded",
    /** Created by a logged-in user through the public `submitJobPosting` mutation. */
    Submitted = "submitted",
}

export const GraphQLTypeJobPostingSource = createEnumType(
    JobPostingSource,
)

registerEnumType(
    GraphQLTypeJobPostingSource,
    {
        name: "JobPostingSource",
        description: "Where a job posting originated (provenance, not a moderation state).",
        valuesMap: {
            [JobPostingSource.Seeded]: {
                description: "Curated by the content team via the seed pipeline.",
            },
            [JobPostingSource.Submitted]: {
                description: "Submitted by a logged-in user through the public form.",
            },
        },
    },
)
