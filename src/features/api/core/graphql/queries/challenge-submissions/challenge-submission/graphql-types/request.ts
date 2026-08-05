import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for fetching a challenge submission by primary id (includes user join rows).",
})
/**
 * Fetches one submission slot by `challenge_submissions.id`. The handler also
 * loads the caller's join row (attempts + feedbacks) onto the same entity.
 */
export class ChallengeSubmissionRequest {
    @Field(
        () => ID,
        {
            description: "Challenge submission id (challenge_submissions.id).",
        },
    )
        challengeSubmissionId: string
}
