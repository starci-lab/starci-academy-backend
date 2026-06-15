import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * One joined course with its milestone (personal-project) progress — the rail's
 * "my courses" item. A 0/0 row is a course with no milestone tasks yet (the
 * client renders it without a progress bar).
 */
@ObjectType({
    description: "A joined course with milestone progress (rail item).",
})
export class MyCourseItemData {
    @Field(
        () => String,
        {
            description: "Opaque global id of the course — pass to resolveRoute on click.",
        },
    )
        globalId: string

    @Field(
        () => String,
        {
            description: "Course title (the token label).",
        },
    )
        label: string

    @Field(
        () => Int,
        {
            description: "Lessons the viewer has read in the course.",
        },
    )
        contentCompleted: number

    @Field(
        () => Int,
        {
            description: "Total contents (lessons) in the course.",
        },
    )
        contentTotal: number

    @Field(
        () => Int,
        {
            description: "Challenges the viewer has passed in the course.",
        },
    )
        challengeCompleted: number

    @Field(
        () => Int,
        {
            description: "Total challenges in the course.",
        },
    )
        challengeTotal: number

    @Field(
        () => Int,
        {
            description: "Number of milestone tasks the viewer has passed.",
        },
    )
        completed: number

    @Field(
        () => Int,
        {
            description: "Total milestone tasks in the course.",
        },
    )
        total: number
}

/**
 * Response wrapper for the myCourses query.
 */
@ObjectType({
    description: "Response wrapper for the myCourses query.",
})
export class MyCoursesResponse
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
