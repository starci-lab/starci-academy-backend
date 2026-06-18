import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * One user search hit from the `users` Elasticsearch index — the header fields a
 * result row / who-to-follow card shows. Carries the opaque global id (resolved
 * to the profile route on click) plus identity + discovery fields.
 */
@ObjectType({
    description: "A user search result (from the Elasticsearch `users` index).",
})
export class SearchUserData {
    @Field(
        () => String,
        {
            description: "Opaque global id of the user — pass to resolveRoute on click.",
        },
    )
        globalId: string

    @Field(
        () => String,
        {
            description: "Username (the @handle and profile route segment).",
        },
    )
        username: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Display name; null when unset (the UI falls back to username).",
        },
    )
        displayName: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Avatar public URL; null when the user has none.",
        },
    )
        avatar: string | null

    @Field(
        () => String,
        {
            nullable: true,
            description: "Short profile bio / tagline; null when unset.",
        },
    )
        bio: string | null

    @Field(
        () => Boolean,
        {
            description: "Whether the user is open to work (shows a hiring badge).",
        },
    )
        openToWork: boolean

    @Field(
        () => Int,
        {
            description: "Spendable reward-points balance (usable as a popularity signal).",
        },
    )
        points: number
}

/**
 * Response wrapper for the searchUsers query.
 */
@ObjectType({
    description: "Response wrapper for the searchUsers query.",
})
export class SearchUsersResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<SearchUserData>> {
    @Field(
        () => [SearchUserData],
        {
            description: "Matching users, best-match first.",
        },
    )
        data: Array<SearchUserData>
}
