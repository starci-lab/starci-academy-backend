import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "A user search result (from the Elasticsearch `users` index).",
})
/**
 * One user search hit from the `users` Elasticsearch index -- the header fields a
 * result row / who-to-follow card shows. Carries the opaque global id (resolved
 * to the profile route on click) plus identity + discovery fields.
 */
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
            description: "Spendable Coin balance (usable as a popularity signal).",
        },
    )
        points: number
}

@ObjectType({
    description: "Response wrapper for the searchUsers query.",
})
/**
 * Response wrapper for the searchUsers query.
 */
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
