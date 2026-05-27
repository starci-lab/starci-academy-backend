import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Polymorphic target type a mind-map node may link to.
 * Stored in `mind_map_nodes.entity_type` (nullable when the node is purely decorative).
 */
export enum MindMapNodeEntityType {
    Module = "module",
    Lesson = "lesson",
    Challenge = "challenge",
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
