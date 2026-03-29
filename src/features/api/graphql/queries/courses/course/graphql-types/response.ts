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
} from "@modules/api"

/** GraphQL envelope for the course by id query. */
@ObjectType({
    description: "Response wrapper for the course query.",
})
export class CourseResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CourseEntity>
{
    /** Payload containing the course when found. */
    @Field(() => CourseEntity,
        {
            description: "The course for the requested id (errors if not found).",
        })
        data: CourseEntity
}


