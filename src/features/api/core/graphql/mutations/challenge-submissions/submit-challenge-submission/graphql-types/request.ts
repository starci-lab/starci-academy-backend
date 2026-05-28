import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    AiMode,
    GraphQLTypeAiMode,
} from "@modules/databases"

@InputType({
    description: "Enqueue grading for one challenge submission; pass `githubUrl` on first submit to create the user row.",
})
export class SubmitChallengeSubmissionRequest {
    @Field(
        () => ID,
        {
            description: "`challenge_submissions.id` to enqueue grading for.",
        },
    )
        challengeSubmissionId: string

    /**
     * Submission URL (GitHub repo, Google Doc, etc.).
     * Required when no `user_challenge_submissions` row exists yet; optional otherwise to overwrite before enqueue.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Submission URL; required on first submit if the user row does not exist yet.",
        },
    )
        githubUrl?: string

    @Field(
        () => GraphQLTypeAiMode,
        {
            nullable: true,
            description: "AI lane to grade on (auto/premium/byok); validated against entitlement at grade time.",
        },
    )
        mode?: AiMode

}
