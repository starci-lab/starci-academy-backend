import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    CourseQuestionsPageObject,
} from "./course-questions-page.object"

/** Response wrapper for the course questions query. */
@ObjectType({
    description: "Response wrapper for the course questions query.",
})
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
