import {
    createEnumType,
} from "@modules/common"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Where the unified "user CV" originated from: **generated** by the system from
 * the user's verified StarCi achievements (the moat), or **uploaded** by the
 * user bringing their own CV file into the platform. Both sources live in the
 * same `cv_generations` table and are graded by the same rubric (WF-03b).
 */
export enum CvSource {
    /** AI-built CV assembled from the user's activity / free-text prompts. */
    Generated = "generated",
    /** User's own CV file uploaded into the platform. */
    Uploaded = "uploaded",
}

export const GraphQLTypeCvSource = createEnumType(CvSource)

registerEnumType(
    GraphQLTypeCvSource,
    {
        name: "CvSource",
        description: "Origin of a user CV (system-generated vs. user-uploaded).",
        valuesMap: {
            [CvSource.Generated]: {
                description: "AI-built CV assembled from the user's activity / free-text prompts.",
            },
            [CvSource.Uploaded]: {
                description: "User's own CV file uploaded into the platform.",
            },
        },
    },
)
