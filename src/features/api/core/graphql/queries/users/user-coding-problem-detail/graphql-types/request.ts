import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/**
 * Request for a coding problem's detail on a user's PUBLIC profile
 * (`/profile/<username>/skills/<slug>`) — `userId` is the profile owner (NOT
 * necessarily the caller); the caller's own identity (if any) is resolved
 * separately by `KeycloakOptionalAuthGraphQLGuard` for the owner-bypass check
 * inside {@link GraphQLProfileVisibilityGuard}.
 */
@InputType({
    description: "Request for a target user's coding-problem detail (public profile).",
})
export class UserCodingProblemDetailRequest {
    @Field(
        () => ID,
        {
            description: "Id of the profile owner (target user) whose submission summary to fetch. Also read by GraphQLProfileVisibilityGuard for the lock check.",
        },
    )
        userId: string

    @Field(
        () => String,
        {
            description: "Stable URL slug of the coding problem (e.g. `two-sum`).",
        },
    )
        slug: string
}
