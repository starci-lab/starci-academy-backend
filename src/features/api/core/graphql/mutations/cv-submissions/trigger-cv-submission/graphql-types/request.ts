import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Input for manually triggering CV submission processing.",
})
export class TriggerCvSubmissionRequest {
    @Field(
        () => ID,
        {
            description: "`cv_submissions.id` to enqueue for processing.",
        },
    )
        cvSubmissionId: string

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Optional `cv_submission_attempts.id` to process a specific version.",
        },
    )
        cvSubmissionAttemptId?: string

    @Field(
        () => ID,
        {
            nullable: true,
            description: "Optional `template_cvs.id` to select which review rubric level to use (Junior/Mid/Senior). Defaults to 0-standard.",
        },
    )
        templateCvId?: string
}