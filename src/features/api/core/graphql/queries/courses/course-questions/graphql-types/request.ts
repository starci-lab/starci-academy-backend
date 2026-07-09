import {
    Field,
    ID,
    InputType,
    Int,
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/common"
import {
    CourseQuestionFilter,
} from "@modules/bussiness"

/** GraphQL type for the course-question answer-status filter. */
const GraphQLTypeCourseQuestionFilter = createEnumType(CourseQuestionFilter)

/** Register the course-question filter enum with NestJS GraphQL. */
registerEnumType(
    GraphQLTypeCourseQuestionFilter,
    {
        name: "CourseQuestionFilter",
        description: "Answer-status filter for the course Q&A roll-up.",
        valuesMap: {
            [CourseQuestionFilter.Unanswered]: {
                description: "Questions with zero replies yet (the answering queue).",
            },
            [CourseQuestionFilter.Answered]: {
                description: "Questions that already have at least one reply.",
            },
            [CourseQuestionFilter.Mine]: {
                description: "Questions authored by the calling user.",
            },
            [CourseQuestionFilter.All]: {
                description: "No answer-status filter — every question in the course.",
            },
        },
    },
)

/** Request for the course questions Q&A roll-up query. */
@InputType({
    description: "Request for aggregating a course's top-level questions across all lessons.",
})
export class CourseQuestionsRequest {
    /** Course whose lessons' questions are aggregated. */
    @Field(
        () => ID,
        {
            description: "Course whose lessons' questions are aggregated.",
        },
    )
        courseId: string

    /** Answer-status filter applied to the roll-up (default all). */
    @Field(
        () => GraphQLTypeCourseQuestionFilter,
        {
            nullable: true,
            defaultValue: CourseQuestionFilter.All,
            description: "Answer-status filter applied to the roll-up (default all).",
        },
    )
        filter?: CourseQuestionFilter

    /** Optional case-insensitive body substring to match. */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional case-insensitive body substring to match.",
        },
    )
        search?: string | null

    /** 1-based page number (default 1). */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "1-based page number (default 1).",
        },
    )
        page?: number

    /** Page size (default 20). */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "Page size (default 20).",
        },
    )
        limit?: number
}
