import {
    createEnumType,
} from "@modules/common/utils/enum"
import {
    registerEnumType,
} from "@nestjs/graphql"

/**
 * Channel a {@link CommunityPostEntity} belongs to. A channel is a top-level
 * bucket the community feed can be filtered by — it does NOT change the post
 * mechanics (every channel is post + threaded comments + reactions), only the
 * audience/intent the FE groups posts under.
 */
export enum CommunityChannel {
    /** General chatter — the default catch-all channel. */
    General = "general",
    /** Posts asking for help / describing a problem the author is stuck on. */
    Problems = "problems",
    /** Questions addressed to the founder; the founder answers via comments. */
    FounderQa = "founderQa",
}

/** GraphQL enum mirror of {@link CommunityChannel}. */
export const GraphQLTypeCommunityChannel = createEnumType(CommunityChannel)

registerEnumType(
    GraphQLTypeCommunityChannel,
    {
        name: "CommunityChannel",
        description: "Top-level channel a community post belongs to.",
        valuesMap: {
            [CommunityChannel.General]: {
                description: "General chatter — the default catch-all channel.",
            },
            [CommunityChannel.Problems]: {
                description: "Posts describing a problem the author needs help with.",
            },
            [CommunityChannel.FounderQa]: {
                description: "Questions addressed to the founder (answered via comments).",
            },
        },
    },
)
