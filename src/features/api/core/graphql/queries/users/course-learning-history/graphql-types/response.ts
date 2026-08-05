import {
    Field,
    ID,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    ContentDifficulty,
    GraphQLTypeContentDifficulty,
} from "@modules/databases"
import {
    CourseLearningEventType,
    GraphQLTypeCourseLearningEventType,
} from "../enums"

@ObjectType({
    description: "A single per-course learning event (lesson/challenge/milestone).",
})
/**
 * One learning event in the per-course history timeline — a lesson the viewer
 * read, a challenge they passed, or a milestone task they completed within this
 * course. The frontend groups these by day using `at`.
 */
export class CourseLearningHistoryItemData {
    @Field(
        () => ID,
        {
            description: "Source activity id for this event (stable, used as the React key).",
        },
    )
        id: string

    @Field(
        () => GraphQLTypeCourseLearningEventType,
        {
            description: "Kind of learning event (lessonRead / challengePassed / milestonePassed).",
        },
    )
        type: CourseLearningEventType

    @Field(
        () => String,
        {
            description: "Event label — the lesson / challenge / milestone-task title.",
        },
    )
        label: string

    @Field(
        () => Date,
        {
            description: "When the event happened (used to group by day, newest first).",
        },
    )
        at: Date

    @Field(
        () => String,
        {
            nullable: true,
            description: "Owning module title; null for milestone events (no module).",
        },
    )
        moduleTitle: string | null

    @Field(
        () => GraphQLTypeContentDifficulty,
        {
            nullable: true,
            description: "Lesson difficulty when available; null otherwise.",
        },
    )
        difficulty: ContentDifficulty | null
}

@ObjectType({
    description: "A cursor-paginated page of per-course learning events.",
})
/** One cursor-paginated page of the per-course learning history. */
export class CourseLearningHistoryResponseData {
    @Field(
        () => [CourseLearningHistoryItemData],
        {
            description: "Learning events for this page, newest first.",
        },
    )
        items: Array<CourseLearningHistoryItemData>

    @Field(
        () => String,
        {
            nullable: true,
            description: "Opaque cursor for the next page; null when there are no more events.",
        },
    )
        nextCursor: string | null
}

@ObjectType({
    description: "Response wrapper for the courseLearningHistory query.",
})
/**
 * Response wrapper for the courseLearningHistory query — a page of learning
 * events (items + nextCursor) for the viewer within one course.
 */
export class CourseLearningHistoryResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<CourseLearningHistoryResponseData> {
    @Field(
        () => CourseLearningHistoryResponseData,
        {
            nullable: true,
            description: "A page of the viewer's per-course learning events + next cursor.",
        },
    )
        data: CourseLearningHistoryResponseData
}
