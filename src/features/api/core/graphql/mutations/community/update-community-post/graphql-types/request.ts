import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to update a community post's body.",
})
/** Request to update a community post's body. */
export class UpdateCommunityPostRequest {
    /** Id of the post to edit. */
    @Field(
        () => ID,
        {
            description: "Id of the post to edit.",
        },
    )
        postId: string

    /** New post body. */
    @Field(
        () => String,
        {
            description: "New post body.",
        },
    )
        body: string
}
