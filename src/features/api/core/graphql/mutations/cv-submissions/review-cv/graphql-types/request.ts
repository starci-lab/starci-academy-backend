import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Input for queuing CV review at a specific rubric level.",
})
export class ReviewCvRequest {
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
            description: "Required `template_cvs.id` — which review rubric level to use.",
        },
    )
        templateCvId: string
}
