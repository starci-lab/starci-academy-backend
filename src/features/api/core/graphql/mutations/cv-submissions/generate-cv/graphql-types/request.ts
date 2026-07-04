import {
    Field,
    InputType,
} from "@nestjs/graphql"
import {
    AiMode,
    GraphQLTypeAiMode,
    GraphQLTypeModelProvider,
    ModelProvider,
} from "@modules/databases"

/**
 * Request for {@link GenerateCvResponse}: build a brand-new CV from the user's
 * free-text emphasis / target-role notes. The server creates a `Pending`
 * generation run and enqueues the background job (mode = Generate).
 */
@InputType({
    description: "Generate a brand-new CV from the user's free-text prompts.",
})
export class GenerateCvRequest {
    @Field(
        () => String,
        {
            nullable: true,
            description: "User's free-text emphasis / target-role notes for the CV.",
        },
    )
        extraPrompts?: string

    @Field(
        () => GraphQLTypeAiMode,
        {
            nullable: true,
            description: "AI lane to generate on (auto/premium); validated against entitlement at generate time.",
        },
    )
        mode?: AiMode

    /** Concrete model the user picked in the CV-generation model picker (e.g. "gpt-4o"). */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Concrete model name the user picked for CV generation; null = balancer default (Auto).",
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
}
