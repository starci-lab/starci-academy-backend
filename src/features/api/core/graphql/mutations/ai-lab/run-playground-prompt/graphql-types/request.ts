import {
    Field,
    Float,
    ID,
    InputType,
    Int,
} from "@nestjs/graphql"
import {
    AiMode,
    GraphQLTypeAiMode,
    GraphQLTypeModelProvider,
    ModelProvider,
} from "@modules/databases"

/**
 * Sampling / generation parameters for a playground run. Mirrors the
 * `AiLabRunParamsObject` jsonb shape on the entity; all fields are optional so
 * the model defaults apply when omitted. Reused by the eval-challenge mutation.
 */
@InputType({
    description: "Sampling / generation parameters for an AI Lab run (all optional).",
})
export class AiLabRunParamsInput {
    /** Sampling temperature (0 = deterministic); omit for the model default. */
    @Field(
        () => Float,
        {
            nullable: true,
            description: "Sampling temperature (0 = deterministic).",
        },
    )
        temperature?: number

    /** Nucleus sampling probability mass; omit for the model default. */
    @Field(
        () => Float,
        {
            nullable: true,
            description: "Nucleus sampling probability mass.",
        },
    )
        topP?: number

    /** Hard cap on completion tokens; omit for the model default. */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Hard cap on completion tokens.",
        },
    )
        maxTokens?: number
}

/**
 * Input for the runPlaygroundPrompt mutation. The loose `mode` /
 * `selectedModel` / `selectedModelProvider` fields map to the
 * discriminated `AiJobSelection` in the service layer exactly as the
 * submit-challenge flow does (no nested AiJobSelection input exists today).
 */
@InputType({
    description: "Run a prompt against an AI Lab playground; returns a run id the FE streams over Socket.IO.",
})
export class RunPlaygroundPromptInput {
    @Field(
        () => ID,
        {
            description: "Playground the run belongs to.",
        },
    )
        playgroundId: string

    /** System prompt the learner submitted (omit for none). */
    @Field(
        () => String,
        {
            nullable: true,
            description: "System prompt the learner submitted; omit for none.",
        },
    )
        systemPrompt?: string

    @Field(
        () => String,
        {
            description: "User prompt the learner submitted.",
        },
    )
        userPrompt: string

    /** Sampling / generation parameters for the run. */
    @Field(
        () => AiLabRunParamsInput,
        {
            nullable: true,
            description: "Sampling / generation parameters; model defaults apply when omitted.",
        },
    )
        params?: AiLabRunParamsInput

    /** AI lane to run on (auto/premium); validated against entitlement. */
    @Field(
        () => GraphQLTypeAiMode,
        {
            nullable: true,
            description: "AI lane to run on (auto/premium); validated against entitlement.",
        },
    )
        mode?: AiMode

    /** Concrete model the learner picked (e.g. "gpt-4o"); null = balancer default. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Concrete model the learner picked; null = balancer default.",
        },
    )
        selectedModel?: string

    /** Provider serving the picked model. */
    @Field(
        () => GraphQLTypeModelProvider,
        {
            nullable: true,
            description: "Provider serving the picked model.",
        },
    )
        selectedModelProvider?: ModelProvider
}
