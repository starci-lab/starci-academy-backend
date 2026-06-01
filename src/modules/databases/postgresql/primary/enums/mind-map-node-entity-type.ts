import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Polymorphic target type a mind-map node links to, used by the computed course mind-map graph
 * (`@xyflow/react` node `data.kind`).
 */
export enum MindMapNodeEntityType {
    /** Root node — the course itself. */
    Course = "course",
    /** Node links to a ModuleEntity row. */
    Module = "module",
    /** Node links to a ContentEntity row (lesson). */
    Lesson = "lesson",
    /** Node links to a ChallengeEntity row. */
    Challenge = "challenge",
    /** Node has no entity link (decorative or custom-authored). */
    Custom = "custom",
}

/**
 * GraphQL type for the mind-map node entity-type enum.
 */
export const GraphQLTypeMindMapNodeEntityType = createEnumType(
    MindMapNodeEntityType,
)

registerEnumType(
    GraphQLTypeMindMapNodeEntityType,
    {
        name: "MindMapNodeEntityType",
        description: "Polymorphic target type referenced by a mind-map node.",
        valuesMap: {
            [MindMapNodeEntityType.Course]: {
                description: "Root node — the course itself.",
            },
            [MindMapNodeEntityType.Module]: {
                description: "Node links to a ModuleEntity row.",
            },
            [MindMapNodeEntityType.Lesson]: {
                description: "Node links to a ContentEntity row (lesson).",
            },
            [MindMapNodeEntityType.Challenge]: {
                description: "Node links to a ChallengeEntity row.",
            },
            [MindMapNodeEntityType.Custom]: {
                description: "Node has no entity link (decorative or custom-authored).",
            },
        },
    },
)
