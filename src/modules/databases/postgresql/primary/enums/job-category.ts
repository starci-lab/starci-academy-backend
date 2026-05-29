import {
    createEnumType 
} from "@modules/common"
import {
    registerEnumType 
} from "@nestjs/graphql"

/**
 * UI-facing job categories for realtime status rendering.
 */
export enum JobCategory {
    SubmitChallenge = "submitChallenge",
    ReviewCv = "reviewCv",
    ReviewTask = "reviewTask",
    /** Judge a coding-practice submission against testcases. */
    JudgeCoding = "judgeCoding",
}

/**
 * Create the job status enum.
 */
export const GraphQLTypeJobCategory = createEnumType(JobCategory)

registerEnumType(
    GraphQLTypeJobCategory,
    {
        name: "JobCategory",
        description: "The category of a job.",
        valuesMap: {
            [JobCategory.SubmitChallenge]: {
                description: "Submit challenge job.",
            },
            [JobCategory.ReviewCv]: {
                description: "Review CV job.",
            },
            [JobCategory.ReviewTask]: {
                description: "Review personal project task job.",
            },
            [JobCategory.JudgeCoding]: {
                description: "Judge a coding-practice submission job.",
            },
        },
    },
)
