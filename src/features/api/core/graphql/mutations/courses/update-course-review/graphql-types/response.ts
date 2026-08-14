import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    CourseReviewEntity,
} from "@modules/databases/postgresql/primary/entities/course-review.entity"

@ObjectType({
    description: "Response wrapper for the updateCourseReview mutation.",
})
/**
 * Response wrapper for the updateCourseReview mutation.
 *
 * `data` is nullable because the transform interceptor sets it to null on the error path.
 */
export class UpdateCourseReviewResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CourseReviewEntity>
{
    /** The review after the edit. */
    @Field(
        () => CourseReviewEntity,
        {
            nullable: true,
            description: "The review row as it now stands.",
        },
    )
        data: CourseReviewEntity
}
