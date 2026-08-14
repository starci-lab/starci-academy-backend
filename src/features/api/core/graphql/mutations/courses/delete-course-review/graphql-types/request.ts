import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "The review the caller wants to delete.",
})
/** Request for the deleteCourseReview mutation. */
export class DeleteCourseReviewRequest {
    /** Id of the review being deleted. */
    @Field(
        () => ID,
        {
            description: "Review id.",
        },
    )
        reviewId: string
}
