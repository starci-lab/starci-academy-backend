import {
    Field,
    ID,
    InputType,
    Int,
} from "@nestjs/graphql"

/**
 * Cursor-paginated request for a single user's activity timeline (the profile
 * "activity" tab). Unlike the home feed there is no tab/category — it is always
 * the named user's own activity, newest first.
 */
@InputType({
    description: "Cursor-paginated request for a user's activity timeline.",
})
export class UserFeedRequest {
    @Field(
        () => ID,
        {
            description: "Id of the user whose activity timeline to fetch.",
        },
    )
        userId: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Opaque cursor from the previous page's nextCursor; omit for page 1.",
        },
    )
        cursor?: string

    @Field(
        () => Int,
        {
            defaultValue: 20,
            description: "Max items per page.",
        },
    )
        limit?: number
}
