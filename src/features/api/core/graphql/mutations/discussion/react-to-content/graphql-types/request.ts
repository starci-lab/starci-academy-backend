import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypeReactionType,
    ReactionType,
} from "@modules/databases"

/** Request to set/change/remove the current user's reaction on a content. */
@InputType({
    description: "Request to set/change/remove a reaction on a content.",
})
export class ReactToContentRequest {
    /** Content being reacted to. */
    @Field(
        () => ID,
        {
            description: "Content being reacted to.",
        },
    )
        contentId: string

    /** New emotion, or null to remove the existing reaction. */
    @Field(
        () => GraphQLTypeReactionType,
        {
            nullable: true,
            description: "New emotion, or null to remove the existing reaction.",
        },
    )
        type?: ReactionType | null
}
