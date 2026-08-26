import {
    Field,
    ID,
    Int,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypeModelProvider,
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"

@InputType({
    description: "Challenge submission id; optionally the URL and/or the grading model to sync onto the user row (upserts, creating the row if missing).",
})
/**
 * Draft-save input: upserts URL / model onto the user row without spending
 * grading quota. Omit `url` to change only the model pick.
 */
export class SyncSubmissionRequest {
    @Field(
        () => ID,
        {
            description: "Challenge submission id.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Submission URL (validated against the submission type); omit to sync only the grading selection.",
        },
    )
        url?: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Concrete model name to persist on the submission row.",
        },
    )
        selectedModel?: string

    @Field(
        () => GraphQLTypeModelProvider,
        {
            nullable: true,
            description: "Provider serving the persisted model.",
        },
    )
        selectedModelProvider?: ModelProvider

    @Field(
        () => Int,
        {
            nullable: true,
            description: "Last draft revision observed by the caller; stale values are rejected instead of overwriting newer work.",
        },
    )
        expectedDraftRevision?: number
}
