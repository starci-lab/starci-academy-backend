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
    description: "Challenge submission id; optionally the URL and/or the grading lane + model to sync onto the user row (upserts, creating the row if missing).",
})
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
        () => GraphQLTypeAiMode,
        {
            nullable: true,
            description: "AI grading lane to persist on the submission row (auto/premium/byok).",
        },
    )
        selectedMode?: AiMode

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
        () => String,
        {
            nullable: true,
            description: "Optional one-shot BYOK API key when selectedMode is byok.",
        },
    )
        byokApiKey?: string
}
