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
    CourseQuestionsPageObject,
} from "./course-questions-page.object"

@ObjectType({
    description: "Response wrapper for the course questions query.",
})
/** Response wrapper for the course questions query. */
export class CourseQuestionsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CourseQuestionsPageObject>
{
    /** The page of course questions for the requested filter. */
    @Field(
        () => CourseQuestionsPageObject,
        {
            nullable: true,
            description: "The page of course questions for the requested filter.",
        },
    )
        data: CourseQuestionsPageObject
}
