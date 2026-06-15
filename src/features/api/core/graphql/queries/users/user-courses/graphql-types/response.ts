import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    MyCourseItemData,
} from "../../../dashboard/my-courses/graphql-types"

/**
 * Response wrapper for the userCourses query.
 *
 * Reuses {@link MyCourseItemData} (same shape): each item is a course the
 * profile owner has joined with its milestone / content / challenge progress.
 * Differs from `myCourses` only in subject — the user named in the route.
 */
@ObjectType({
    description: "Response wrapper for the userCourses query.",
})
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
