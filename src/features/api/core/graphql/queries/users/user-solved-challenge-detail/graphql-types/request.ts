import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for a target user's single solved-challenge submission detail (public profile).",
})
/**
 * Request for a single passed challenge submission's detail on a user's
 * PUBLIC profile -- `userId` is the profile owner (NOT necessarily the
 * caller); the caller's own identity (if any) is resolved separately by
 * `KeycloakOptionalAuthGraphQLGuard` for the owner-bypass check inside
 * {@link GraphQLProfileVisibilityGuard}.
 */
export class UserSolvedChallengeDetailRequest {
    @Field(
        () => ID,
        {
            description: "Id of the profile owner (target user) whose submission to fetch. Also read by GraphQLProfileVisibilityGuard for the lock check.",
        },
    )
        userId: string

    @Field(
        () => ID,
        {
            description: "Submission id (`user_challenge_submissions.id`, i.e. the `id` field on a `userSolvedChallenges` list item).",
        },
    )
        submissionId: string
}
