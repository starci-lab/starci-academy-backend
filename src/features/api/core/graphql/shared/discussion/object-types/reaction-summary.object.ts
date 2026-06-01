import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeReactionType,
    ReactionType,
} from "@modules/databases"

/** A single emotion bucket with how many users picked it. */
@ObjectType({
    description: "A single emotion bucket with its count.",
})
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

/** Aggregate reaction state for a target (content or comment) from one user's view. */
@ObjectType({
    description: "Aggregate reactions for a target plus the viewer's own pick.",
})
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
}
