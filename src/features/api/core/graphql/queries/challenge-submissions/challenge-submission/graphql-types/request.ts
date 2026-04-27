import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for fetching a challenge submission by primary id (includes user join rows).",
})
export class ChallengeSubmissionRequest {
    @Field(
        () => ID,
        {
            description: "Challenge submission id (challenge_submissions.id).",
        },
    )
        challengeSubmissionId: string
}
