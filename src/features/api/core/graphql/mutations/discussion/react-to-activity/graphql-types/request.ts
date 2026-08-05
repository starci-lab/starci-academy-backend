import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypeReactionType,
    ReactionType,
} from "@modules/databases/postgresql/primary/enums/reaction-type"

@InputType({
    description: "Request to set/change/remove a reaction on a feed activity.",
})
/** Request to set/change/remove the current user's reaction on a feed activity. */
export class ReactToActivityRequest {
    /** Activity being reacted to. */
    @Field(
        () => ID,
        {
            description: "Activity being reacted to.",
        },
    )
        activityId: string

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
