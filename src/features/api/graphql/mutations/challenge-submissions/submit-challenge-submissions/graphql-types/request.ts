import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

/** Request to queue automated grading for submission definitions under one challenge. */
@InputType({
    description: "Challenge id whose submission rows to grade (GitHub only); user must have synced URLs first.",
})
export class SubmitChallengeSubmissionsRequest {
    @Field(
        () => ID,
        {
            description: "`challenges.id` for submissions to enqueue.",
        },
    )
        challengeId: string
}
