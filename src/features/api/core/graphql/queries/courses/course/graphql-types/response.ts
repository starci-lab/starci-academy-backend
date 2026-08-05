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
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "Response wrapper for the course query.",
})
/** GraphQL envelope for the course by id query. */
export class CourseResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CourseEntity>
{
    /** Payload containing the course when found. */
    @Field(() => CourseEntity,
        {
            nullable: true,
            description: "The course for the requested id (errors if not found).",
        })
        data: CourseEntity
}


