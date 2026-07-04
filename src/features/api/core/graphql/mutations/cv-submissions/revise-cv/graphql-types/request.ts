import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
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
