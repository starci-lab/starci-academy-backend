import {
    Field,
    InputType,
    Int,
} from "@nestjs/graphql"

@InputType({
    description: "Free-text user search request (Elasticsearch `users` index).",
})
/**
 * Request for the `searchUsers` query -- a free-text search over the `users`
 * Elasticsearch index (handle / display name / bio).
 */
export class SearchUsersRequest {
    @Field(
        () => String,
        {
            description: "Search keyword matched against username, display name and bio.",
        },
    )
        query: string

    @Field(
        () => Int,
        {
            nullable: true,
            defaultValue: 10,
            description: "Maximum number of users to return.",
        },
    )
        limit?: number
}
