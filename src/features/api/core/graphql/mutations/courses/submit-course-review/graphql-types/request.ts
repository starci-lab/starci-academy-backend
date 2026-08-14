import {
    Field,
    ID,
    InputType,
    Int,
} from "@nestjs/graphql"

@InputType({
    description: "A learner's star score and optional written review for a course.",
})
/** Request for the submitCourseReview mutation. */
export class SubmitCourseReviewRequest {
    /** Id of the course being reviewed. */
    @Field(
        () => ID,
        {
            description: "Course id.",
        },
    )
        courseId: string

    /** Whole-star score the learner is giving the course. */
    @Field(
        () => Int,
        {
            description: "Whole star score, 1 to 5 inclusive.",
        },
    )
        score: number

    /**
     * What the learner wrote, when they wrote anything.
     *
     * Optional because a score alone is a complete review; requiring prose produces one-word
     * bodies that make the list worse rather than better.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional written review.",
        },
    )
        body?: string
}
