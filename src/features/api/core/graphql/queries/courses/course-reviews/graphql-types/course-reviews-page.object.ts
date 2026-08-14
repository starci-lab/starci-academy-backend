import {
    Field,
    Float,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    CourseReviewEntity,
} from "@modules/databases/postgresql/primary/entities/course-review.entity"

@ObjectType({
    description: "One page of a course's reviews, with the aggregate that summarises all of them.",
})
/**
 * A page of reviews plus the course's whole-population aggregate.
 *
 * The aggregate travels WITH the page rather than as a second query because the two are read
 * together on every screen that shows either, and splitting them would make a rating and the
 * reviews under it capable of disagreeing on screen while both were individually correct.
 */
export class CourseReviewsPageObject {
    /** The reviews on this page, newest first. */
    @Field(
        () => [CourseReviewEntity],
        {
            description: "Reviews on this page, newest first.",
        },
    )
        nodes: Array<CourseReviewEntity>

    /** How many reviews the course has in total. */
    @Field(
        () => Int,
        {
            description: "Total reviews on the course, across every page.",
        },
    )
        total: number

    /**
     * Mean score across every review, or zero when there are none.
     *
     * Read from the projection rather than computed here: a mean over the whole population is not
     * something a page of ten rows can answer.
     */
    @Field(
        () => Float,
        {
            description: "Mean score across every review; zero when the course has none.",
        },
    )
        averageScore: number
}
