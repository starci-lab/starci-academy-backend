import {
    createEnumType,
} from "@modules/common"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * How a CV generation run assembles its output: build a brand-new CV from the
 * user's free-text input, or revise an earlier `cv_generations` row
 * referenced by `source_cv_submission_id`.
 */
export enum CvGenerationMode {
    /** Build a brand-new CV from the user's supplied prompts. */
    Generate = "generate",
    /** Revise an existing CV submission using the user's supplied prompts. */
    Revise = "revise",
}

export const GraphQLTypeCvGenerationMode = createEnumType(CvGenerationMode)

registerEnumType(
    GraphQLTypeCvGenerationMode,
    {
        name: "CvGenerationMode",
        description: "How a CV generation run assembles its output (build new vs. revise existing).",
        valuesMap: {
            [CvGenerationMode.Generate]: {
                description: "Build a brand-new CV from the user's supplied prompts.",
            },
            [CvGenerationMode.Revise]: {
                description: "Revise an existing CV submission using the user's supplied prompts.",
            },
        },
    },
)
