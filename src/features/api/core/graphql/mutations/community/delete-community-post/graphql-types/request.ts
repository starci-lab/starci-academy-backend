import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to soft-delete a community post.",
})
/** Request to soft-delete a community post. */
export class DeleteCommunityPostRequest {
    /** Id of the post to soft-delete. */
    @Field(
        () => ID,
        {
            description: "Id of the post to soft-delete.",
        },
    )
        postId: string
}
