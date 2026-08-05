import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    PaginationPageResponseData,
} from "@modules/api/apollo/server/graphql-types/object-types/pagination-page"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"
import {
    IPaginationPageResponseData,
} from "@modules/api/apollo/server/types/pagination"



/** Paginated course rows returned by the courses query. */

@ObjectType({
    description: "Paginated list of courses.",
})

/** Paginated list of courses. */
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



@ObjectType({
    description: "Response wrapper for the courses query.",
})
/** GraphQL envelope for the courses query. */
export class CoursesResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CoursesResponseData>
{
    @Field(() => CoursesResponseData,
        {
            nullable: true,

            description: "Payload containing courses and pagination count.",

        })
        data: CoursesResponseData

}


