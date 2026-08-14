import {
    Field,
    ID,
    InputType,
    Int,
} from "@nestjs/graphql"

@InputType({
    description: "Fields to change on a review the caller wrote.",
})
/**
 * Request for the updateCourseReview mutation.
 *
 * Both editable fields are optional and mean three different things by their absence: an omitted
 * `score` keeps the score, an omitted `body` keeps the body, and an explicit null `body` clears it.
 * A shape where absence and clearing were the same value would make "remove what I wrote" unsayable.
 */
export class UpdateCourseReviewRequest {
    /** Id of the review being edited. */
    @Field(
        () => ID,
        {
            description: "Review id.",
        },
    )
        reviewId: string

    /** New whole-star score, when the score is changing. */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "New whole star score, 1 to 5 inclusive. Omit to keep the current score.",
        },
    )
        score?: number

    /** New written review, or null to clear it. Omit to keep the current body. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "New written review, or null to clear it. Omit to keep the current body.",
        },
    )
        body?: string | null
}
