import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"

/**
 * Facebook-style reaction kinds a user can drop on a content or a comment.
 * Stored in the `type` column of `content_reactions` / `comment_reactions`.
 */
export enum ReactionType {
    /** A plain thumbs-up acknowledgement. */
    Like = "like",
    /** Strong positive affection. */
    Love = "love",
    /** Found it funny. */
    Haha = "haha",
    /** Surprised / impressed. */
    Wow = "wow",
    /** Saddened by the content. */
    Sad = "sad",
    /** Angered by the content. */
    Angry = "angry",
}

/**
 * GraphQL type for the reaction kind enum.
 */
export const GraphQLTypeReactionType = createEnumType(
    ReactionType,
)

/**
 * Register the reaction kind enum with NestJS GraphQL.
 */
registerEnumType(
    GraphQLTypeReactionType,
    {
        name: "ReactionType",
        description: "Facebook-style reaction kind for a content or comment.",
        valuesMap: {
            [ReactionType.Like]: {
                description: "A plain thumbs-up acknowledgement.",
            },
            [ReactionType.Love]: {
                description: "Strong positive affection.",
            },
            [ReactionType.Haha]: {
                description: "Found it funny.",
            },
            [ReactionType.Wow]: {
                description: "Surprised / impressed.",
            },
            [ReactionType.Sad]: {
                description: "Saddened by the content.",
            },
            [ReactionType.Angry]: {
                description: "Angered by the content.",
            },
        },
    },
)
