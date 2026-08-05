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
    MyCourseItemData,
} from "../../../dashboard/my-courses/graphql-types/response"

@ObjectType({
    description: "Response wrapper for the userCourses query.",
})
/**
 * Response wrapper for the userCourses query.
 *
 * Reuses {@link MyCourseItemData} (same shape): each item is a course the
 * profile owner has joined with its milestone / content / challenge progress.
 * Differs from `myCourses` only in subject -- the user named in the route.
 */
export class UserCoursesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<MyCourseItemData>> {
    @Field(
        () => [MyCourseItemData],
        {
            description: "Every joined course with its milestone progress.",
        },
    )
        data: Array<MyCourseItemData>
}
