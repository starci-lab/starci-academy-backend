import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Challenge submission id whose URL will be graded; user must have synced URL first.",
})
export class SubmitChallengeSubmissionRequest {
    @Field(
        () => ID,
        {
            description: "`challenge_submissions.id` to enqueue grading for.",
        },
    )
        challengeSubmissionId: string
}
