import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * User-facing AI surface ("hạng mục") a per-feature model ceiling can be set on.
 *
 * Each surface maps to one routing entry point; the user-set ceiling for a
 * surface caps how high the Auto chain may climb on that surface (a `null`
 * surface in the setting means the global default). Distinct from the
 * difficulty FLOOR (system-set per task) — the surface only governs the CEIL.
 */
export enum AiCeilSurface {
    /** Hỏi AI khi đọc bài (lesson tutor chatbot). Floor = Free. */
    Chatbot = "chatbot",
    /** Chấm bài (challenge + capstone grading). Floor = by task difficulty. */
    Grading = "grading",
    /** Phỏng vấn thử (mock interview grading). Floor = Economy. */
    Interview = "interview",
}

export const GraphQLTypeAiCeilSurface = createEnumType(AiCeilSurface)

registerEnumType(
    GraphQLTypeAiCeilSurface,
    {
        name: "AiCeilSurface",
        description: "AI surface (hạng mục) a per-feature model ceiling applies to.",
        valuesMap: {
            [AiCeilSurface.Chatbot]: {
                description: "Hỏi AI khi đọc bài (lesson tutor).",
            },
            [AiCeilSurface.Grading]: {
                description: "Chấm bài (challenge + capstone).",
            },
            [AiCeilSurface.Interview]: {
                description: "Phỏng vấn thử (mock interview).",
            },
        },
    },
)
