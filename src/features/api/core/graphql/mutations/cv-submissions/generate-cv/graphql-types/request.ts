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

    /** Optional course/track to tie this CV to (`courses.id`). */
    @Field(
        () => ID,
        {
            nullable: true,
            description: "Optional course/track id to tie this CV to.",
        },
    )
        courseId?: string

    /** Optional user-facing name for this CV. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional user-facing name for this CV.",
        },
    )
        label?: string

    /** Optional target role this CV is aimed at (free-text). */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional target role this CV is aimed at (free-text).",
        },
    )
        targetRole?: string

    /** Optional language/locale for this CV (free-text, e.g. "en" / "vi"). */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional language/locale for this CV (free-text).",
        },
    )
        language?: string
}
