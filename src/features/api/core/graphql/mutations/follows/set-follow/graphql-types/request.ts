import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to follow or unfollow another user.",
})
/**
 * Request to follow or unfollow another user (idempotent toggle).
 */
export class SetFollowRequest {
    @Field(
        () => ID,
        {
            description: "Id of the user to follow or unfollow.",
        },
    )
        userId: string

    @Field(
        () => Boolean,
        {
            description: "True to follow, false to unfollow.",
        },
    )
        follow: boolean
}
