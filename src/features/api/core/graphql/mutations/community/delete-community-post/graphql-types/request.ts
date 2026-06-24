import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/** Request to soft-delete a community post. */
@InputType({
    description: "Request to soft-delete a community post.",
})
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
