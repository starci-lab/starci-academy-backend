import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeReactionType,
    ReactionType,
} from "@modules/databases"

@ObjectType({
    description: "A single emotion bucket with its count.",
})
/** A single emotion bucket with how many users picked it. */
export class ReactionCountObject {
    /** The emotion kind. */
    @Field(
        () => GraphQLTypeReactionType,
        {
            description: "The emotion kind.",
        },
    )
        type: ReactionType

    /** How many users picked this emotion. */
    @Field(
        () => Int,
        {
            description: "How many users picked this emotion.",
        },
    )
        count: number
}

@ObjectType({
    description: "Aggregate reactions for a target plus the viewer's own pick.",
})
/** Aggregate reaction state for a target (content or comment) from one user's view. */
export class ReactionSummaryObject {
    /** Per-emotion counts (only emotions with at least one reaction). */
    @Field(
        () => [ReactionCountObject],
        {
            description: "Per-emotion counts (only emotions with at least one reaction).",
        },
    )
        counts: Array<ReactionCountObject>

    /** Total reactions across all emotions. */
    @Field(
        () => Int,
        {
            description: "Total reactions across all emotions.",
        },
    )
        total: number

    /** The viewing user's own reaction, or null if they have not reacted. */
    @Field(
        () => GraphQLTypeReactionType,
        {
            nullable: true,
            description: "The viewing user's own reaction, or null if none.",
        },
    )
        myReaction: ReactionType | null

    /**
     * Number of distinct users who have marked this content as read (view count).
     * Only populated for content-level summaries; 0 for comment summaries.
     */
    @Field(
        () => Int,
        {
            description: "Number of distinct users who have read this content.",
        },
    )
        viewCount: number

    /**
     * Number of times this content has been shared.
     * Reserved for future use -- always 0 until share tracking is implemented.
     */
    @Field(
        () => Int,
        {
            description: "Number of shares (reserved; always 0 until share tracking is wired).",
        },
    )
        shareCount: number
}
