import {
    createEnumType,
} from "@modules/common"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * User-facing AI surface (feature) a per-feature model ceiling can be set on.
 *
 * Each surface maps to one routing entry point; the user-set ceiling for a
 * surface caps how high the Auto chain may climb on that surface (a `null`
 * surface in the setting means the global default). Distinct from the
 * difficulty FLOOR (system-set per task) -- the surface only governs the CEIL.
 */
export enum AiCeilSurface {
    /** Ask AI while reading a lesson (lesson tutor chatbot). Floor = Free. */
    Chatbot = "chatbot",
    /** Grade submissions (challenge + capstone grading). Floor = by task difficulty. */
    Grading = "grading",
    /** Mock interview (mock interview grading). Floor = Economy. */
    Interview = "interview",
}

export const GraphQLTypeAiCeilSurface = createEnumType(AiCeilSurface)

registerEnumType(
    GraphQLTypeAiCeilSurface,
    {
        name: "AiCeilSurface",
        description: "AI surface (feature) a per-feature model ceiling applies to.",
        valuesMap: {
            [AiCeilSurface.Chatbot]: {
                description: "Ask AI while reading a lesson (lesson tutor).",
            },
            [AiCeilSurface.Grading]: {
                description: "Grade submissions (challenge + capstone).",
            },
            [AiCeilSurface.Interview]: {
                description: "Mock interview.",
            },
        },
    },
)
