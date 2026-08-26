import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypeModelProvider,
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"

@InputType({
    description: "One immutable deliverable included in a whole-Challenge submit.",
})
/** Identifies one saved draft and its stable job identity inside an aggregate submit. */
export class SubmitChallengeDeliverableRequest {
    @Field(() => ID,
        {
            description: "Authored challenge deliverable identity.",
        })
        challengeSubmissionId: string

    @Field(() => String,
        {
            description: "Client-stable grading job identity for this deliverable.",
        })
        idempotencyKey: string
}

@InputType({
    description: "Enqueue grading for one challenge submission; pass `githubUrl` on first submit to create the user row.",
})
/**
 * Enqueue-grading input. `githubUrl` is required only on first submit (no
 * user row yet); later calls may omit it to grade the already-synced URL
 * without rewriting it.
 */
export class SubmitChallengeSubmissionRequest {
    @Field(
        () => ID,
        {
            description: "`challenge_submissions.id` to enqueue grading for.",
        },
    )
        challengeSubmissionId: string

    @Field(
        () => [SubmitChallengeDeliverableRequest],
        {
            nullable: true,
            description: "Complete authored deliverable collection committed as one whole-Challenge attempt.",
        },
    )
        deliverables?: Array<SubmitChallengeDeliverableRequest>

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

    @Field(
        () => String,
        {
            nullable: true,
            description: "Client-stable idempotency key; replays return the same durable attempt and job.",
        },
    )
        idempotencyKey?: string

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Client-stable identity shared by every deliverable in one whole-Challenge attempt.",
        },
    )
        attemptGroupId?: string

}
