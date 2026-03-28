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

/** Single course row returned by the course query. */
@ObjectType({
    description: "Payload for a single course lookup.",
})
export class CourseResponseData {
    @Field(() => CourseEntity,
        {
            nullable: true,
            description: "The course when found; null if no course matches the id.",
        })
        data: CourseEntity | null
}

/** GraphQL envelope for the course by id query. */
@ObjectType({
    description: "Response wrapper for the course query.",
})
export class CourseResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CourseResponseData>
{
    @Field(() => CourseResponseData,
        {
            description: "Payload containing the course or null.",
        })
        data: CourseResponseData
}
