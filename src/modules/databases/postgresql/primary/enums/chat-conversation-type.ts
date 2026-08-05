import {
    createEnumType,
} from "@modules/common"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Kind of {@link ChatConversationEntity}. `community` is the single global member
 * chat room (no owning member); `founderDm` is a private 1:1 thread between one
 * member and the founder (the owning `member`).
 */
export enum ChatConversationType {
    /** The single global community chat room (member = null). */
    Community = "community",
    /** A private 1:1 direct-message thread between a member and the founder. */
    FounderDm = "founderDm",
}

/** GraphQL enum mirror of {@link ChatConversationType}. */
export const GraphQLTypeChatConversationType = createEnumType(ChatConversationType)

registerEnumType(
    GraphQLTypeChatConversationType,
    {
        name: "ChatConversationType",
        description: "Kind of chat conversation (community room or founder DM).",
        valuesMap: {
            [ChatConversationType.Community]: {
                description: "The single global community chat room.",
            },
            [ChatConversationType.FounderDm]: {
                description: "A private 1:1 thread between a member and the founder.",
            },
        },
    },
)
