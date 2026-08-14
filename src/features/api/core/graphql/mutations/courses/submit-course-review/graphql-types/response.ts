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
    description: "Response wrapper for the submitCourseReview mutation.",
})
/**
 * Response wrapper for the submitCourseReview mutation.
 *
 * `data` is nullable because the transform interceptor sets it to null on the error path; a
 * non-nullable field would crash GraphQL and hide the real error behind that crash.
 */
export class SubmitCourseReviewResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CourseReviewEntity>
{
    /** The review that was written. */
    @Field(
        () => CourseReviewEntity,
        {
            nullable: true,
            description: "The review row that was created.",
        },
    )
        data: CourseReviewEntity
}
