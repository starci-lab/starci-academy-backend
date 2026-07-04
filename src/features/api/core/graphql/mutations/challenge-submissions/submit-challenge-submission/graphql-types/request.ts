import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    AiMode,
    GraphQLTypeAiMode,
    GraphQLTypeModelProvider,
    ModelProvider,
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
            description: "AI lane to grade on (auto/premium); validated against entitlement at grade time.",
        },
    )
        mode?: AiMode

    /** Concrete model the user picked in the grading dropdown (e.g. "gpt-4o"). */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Concrete model name the user picked for grading; null = balancer default.",
        },
    )
        selectedModel?: string

    /** Provider serving {@link selectedModel}. */
    @Field(
        () => GraphQLTypeModelProvider,
        {
            nullable: true,
            description: "Provider serving the picked model.",
        },
    )
        selectedModelProvider?: ModelProvider

    /**
     * SCHEMA V2 only: programming language the learner chose (typescript/java/csharp/go). Selects
     * the matching approach-criteria bucket when grading a verified challenge.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "SCHEMA V2: programming language chosen by the learner (selects approach criteria).",
        },
    )
        lang?: string

}
