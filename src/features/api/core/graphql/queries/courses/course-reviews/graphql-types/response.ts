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
    CourseReviewsPageObject,
} from "./course-reviews-page.object"

@ObjectType({
    description: "Response wrapper for the courseReviews query.",
})
/**
 * Response wrapper for the courseReviews query.
 *
 * `data` is nullable because the transform interceptor sets it to null on the error path.
 */
export class CourseReviewsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CourseReviewsPageObject>
{
    /** The page of reviews and the course's aggregate. */
    @Field(
        () => CourseReviewsPageObject,
        {
            nullable: true,
            description: "A page of reviews with the course's rating.",
        },
    )
        data: CourseReviewsPageObject
}
