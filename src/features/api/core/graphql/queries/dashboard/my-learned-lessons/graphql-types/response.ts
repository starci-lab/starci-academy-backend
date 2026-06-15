import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * One recently-read lesson on the rail — a route-index token (resolves its route
 * on click), so it carries only an opaque global id + a label.
 */
@ObjectType({
    description: "A recently-read lesson (rail token).",
})
export class MyLearnedLessonItemData {
    @Field(
        () => String,
        {
            description: "Opaque global id of the lesson — pass to resolveRoute on click.",
        },
    )
        globalId: string

    @Field(
        () => String,
        {
            description: "Lesson title (the token label).",
        },
    )
        label: string
}

/**
 * Response wrapper for the myLearnedLessons query.
 */
@ObjectType({
    description: "Response wrapper for the myLearnedLessons query.",
})
export class MyLearnedLessonsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<MyLearnedLessonItemData>> {
    @Field(
        () => [MyLearnedLessonItemData],
        {
            description: "Lessons the viewer recently read, newest first.",
        },
    )
        data: Array<MyLearnedLessonItemData>
}
