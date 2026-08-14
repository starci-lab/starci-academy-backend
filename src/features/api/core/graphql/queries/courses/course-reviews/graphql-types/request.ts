import {
    Field,
    ID,
    InputType,
    Int,
} from "@nestjs/graphql"

@InputType({
    description: "Which course's reviews to list, and which page of them.",
})
/** Request for the courseReviews query. */
export class CourseReviewsRequest {
    /** Id of the course whose reviews are being listed. */
    @Field(
        () => ID,
        {
            description: "Course id.",
        },
    )
        courseId: string

    /**
     * How many rows to skip.
     *
     * An offset rather than a page number on purpose: a page number carries a base, and two
     * callers can disagree about whether the first page is 0 or 1 while both look correct. This
     * repository already carries that disagreement between a documented filter and a legacy hook,
     * and it is not worth reproducing in a new door.
     */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "How many reviews to skip. Defaults to none.",
        },
    )
        offset?: number

    /** How many reviews to return. */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "How many reviews to return. Clamped to a server maximum.",
        },
    )
        limit?: number
}
