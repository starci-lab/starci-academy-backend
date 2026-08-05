import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request to fetch a single community post by id.",
})
/** Request to fetch a single community post by id. */
export class CommunityPostRequest {
    /** Id of the post to fetch. */
    @Field(
        () => ID,
        {
            description: "Id of the post to fetch.",
        },
    )
        postId: string
}
