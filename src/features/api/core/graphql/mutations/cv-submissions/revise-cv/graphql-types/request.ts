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
 * Request for {@link ReviseCvResponse}: revise an existing uploaded CV
 * submission (`UserCVSubmissionEntity`) using the user's free-text notes. The
 * server validates the source submission exists + belongs to the caller, then
 * creates a `Pending` generation run and enqueues the job (mode = Revise).
 */
@InputType({
    description: "Revise an existing CV submission using the user's free-text prompts.",
})
export class ReviseCvRequest {
    @Field(
        () => ID,
        {
            description: "cv_submissions.id of the existing submission to revise.",
        },
    )
        cvSubmissionId: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "User's free-text emphasis / target-role notes for the revision.",
        },
    )
        extraPrompts?: string

    @Field(
        () => GraphQLTypeAiMode,
        {
            nullable: true,
            description: "AI lane to generate on (auto/premium/byok); validated against entitlement at generate time.",
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
