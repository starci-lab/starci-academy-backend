import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "What the deleteCourseReview mutation removed.",
})
/**
 * Outcome of a review deletion.
 *
 * It carries the id rather than the removed row: the row is gone, and a client's only remaining
 * job is to drop it from the list it is already holding. Returning a corpse would invite a caller
 * to render it.
 */
export class DeleteCourseReviewResponseData {
    /** Id of the review that was removed. */
    @Field(
        () => ID,
        {
            description: "Id of the removed review.",
        },
    )
        reviewId: string

    /** Id of the course whose aggregate will be rebuilt as a result. */
    @Field(
        () => ID,
        {
            description: "Course whose review aggregate the removal invalidates.",
        },
    )
        courseId: string
}

@ObjectType({
    description: "Response wrapper for the deleteCourseReview mutation.",
})
/**
 * Response wrapper for the deleteCourseReview mutation.
 *
 * `data` is nullable because the transform interceptor sets it to null on the error path.
 */
export class DeleteCourseReviewResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<DeleteCourseReviewResponseData>
{
    /** Removal outcome for the requested review. */
    @Field(
        () => DeleteCourseReviewResponseData,
        {
            nullable: true,
        },
    )
        data: DeleteCourseReviewResponseData
}
