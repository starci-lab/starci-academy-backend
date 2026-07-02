import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

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
}
