import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    CourseEntity,
} from "@modules/databases"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
    IPaginationPageResponseData,
    PaginationPageResponseData,
} from "@modules/api"

/** Paginated course rows returned by the courses query. */
@ObjectType({
    description: "Paginated list of courses.",
})
export class CoursesResponseData
    extends PaginationPageResponseData
    implements IPaginationPageResponseData<CourseEntity>
{
    @Field(() => [CourseEntity],
        {
            description: "Courses for the current page.",
        })
        data: Array<CourseEntity>
}

/** GraphQL envelope for the courses query. */
@ObjectType({
    description: "Response wrapper for the courses query.",
})
export class CoursesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CoursesResponseData>
{
    @Field(() => CoursesResponseData,
        {
            description: "Payload containing courses and pagination count.",
        })
        data: CoursesResponseData
}
