import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    CourseQuestionNodeObject,
} from "./course-question-node.object"

/** A page of course questions plus the total count for the queried filter. */
@ObjectType({
    description: "A page of course questions plus the total count for the queried filter.",
})
export class CourseQuestionsPageObject {
    /** The page of question nodes. */
    @Field(
        () => [CourseQuestionNodeObject],
        {
            description: "The page of question nodes.",
        },
    )
        questions: Array<CourseQuestionNodeObject>

    /** Total questions matching the filter (for pagination). */
    @Field(
        () => Int,
        {
            description: "Total questions matching the filter (for pagination).",
        },
    )
        total: number
}
