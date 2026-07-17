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
    /** Node links to a MilestoneEntity row (capstone chapter). */
    Milestone = "milestone",
    /** Node links to a FlashcardDeckEntity row. */
    Flashcard = "flashcard",
    /** Node links to a mock-interview bank. */
    Interview = "interview",
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
            [MindMapNodeEntityType.Milestone]: {
                description: "Node links to a MilestoneEntity row (capstone chapter).",
            },
            [MindMapNodeEntityType.Flashcard]: {
                description: "Node links to a FlashcardDeckEntity row.",
            },
            [MindMapNodeEntityType.Interview]: {
                description: "Node links to a mock-interview bank.",
            },
            [MindMapNodeEntityType.Custom]: {
                description: "Node has no entity link (decorative or custom-authored).",
            },
        },
    },
)
