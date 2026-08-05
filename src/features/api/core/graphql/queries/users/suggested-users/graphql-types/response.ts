import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "A suggested user to follow (who-to-follow card).",
})
/**
 * One "who to follow" suggestion for the dashboard rail — a user the viewer does
 * not already follow, surfaced as a clickable card. Carries the opaque global id
 * (resolved to the profile route on click) plus the header fields the card shows.
 */
export class SuggestedUserData {
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
        () => Boolean,
        {
            description: "Whether the user is open to work (shows a hiring badge on the card).",
        },
    )
        openToWork: boolean
}

@ObjectType({
    description: "Response wrapper for the suggestedUsers query.",
})
/**
 * Response wrapper for the suggestedUsers query.
 */
export class SuggestedUsersResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<SuggestedUserData>> {
    @Field(
        () => [SuggestedUserData],
        {
            description: "Suggested users to follow, most-followed first.",
        },
    )
        data: Array<SuggestedUserData>
}
