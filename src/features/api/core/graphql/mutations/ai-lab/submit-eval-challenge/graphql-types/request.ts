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
import {
    AiLabRunParamsInput,
} from "../../run-playground-prompt/graphql-types"

/**
 * Input for the submitEvalChallenge mutation. Reuses the loose `mode` /
 * `selectedModel` / `selectedModelProvider` lane fields (mapped
 * to `AiJobSelection` in the service layer) and the shared `AiLabRunParamsInput`.
 */
@InputType({
    description: "Submit a prompt template for grading against an AI Lab eval set; enqueues an async grading job.",
})
export class SubmitEvalChallengeInput {
    @Field(
        () => ID,
        {
            description: "Eval set whose cases the submission is graded against.",
        },
    )
        evalSetId: string

    @Field(
        () => ID,
        {
            description: "Enrollment the submission is made under.",
        },
    )
        enrollmentId: string

    /** Submitted system prompt (omit for none). */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Submitted system prompt; omit for none.",
        },
    )
        systemPrompt?: string

    @Field(
        () => String,
        {
            description: "Submitted user prompt template (contains the `{{input}}` placeholder).",
        },
    )
        userTemplate: string

    /** Sampling / generation parameters submitted for grading. */
    @Field(
        () => AiLabRunParamsInput,
        {
            nullable: true,
            description: "Sampling / generation parameters; model defaults apply when omitted.",
        },
    )
        params?: AiLabRunParamsInput

    /** AI lane to grade on (auto/premium); validated against entitlement. */
    @Field(
        () => GraphQLTypeAiMode,
        {
            nullable: true,
            description: "AI lane to grade on (auto/premium); validated against entitlement.",
        },
    )
        mode?: AiMode

    /** Concrete model the learner picked; null = balancer default. */
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
