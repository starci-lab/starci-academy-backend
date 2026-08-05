import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
} from "@modules/api/apollo/server/graphql-types/object-types/graphql-response"
import {
    IAbstractGraphQLResponse,
} from "@modules/api/apollo/server/types/graphql-response"

@ObjectType({
    description: "A single learning-feedback row in the learner CMS list.",
})
/**
 * One merged learning-feedback row for the viewer, from any of the three
 * sources (challenge submission feedback, milestone-task feedback, CV review).
 * Normalised to a single shape so the FE renders one unified timeline.
 */
export class LearningFeedbackItem {
    @Field(
        () => ID,
        {
            description: "Stable synthetic id (source + ordinal) for list keys.",
        },
    )
        id: string

    @Field(
        () => String,
        {
            description: "Source bucket: challenge | task | cv.",
        },
    )
        source: string

    @Field(
        () => String,
        {
            description: "Short human title (challenge / task title, or 'CV review').",
        },
    )
        title: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Owning course title, or null when the source has no course (CV).",
        },
    )
        courseTitle: string | null

    @Field(
        () => String,
        {
            description: "The feedback message / summary text.",
        },
    )
        summary: string

    @Field(
        () => String,
        {
            description: "When the feedback was created (ISO timestamp).",
        },
    )
        createdAt: string
}

@ObjectType({
    description: "Paginated list of the viewer's merged learning feedback.",
})
/**
 * The learning-feedbacks page payload: the merged list plus the total number of
 * feedback rows the viewer has (for client-side pagination).
 */
export class MyLearningFeedbacksData {
    @Field(
        () => [LearningFeedbackItem],
        {
            description: "The page of learning feedback (newest first across sources).",
        },
    )
        items: Array<LearningFeedbackItem>

    @Field(
        () => Int,
        {
            description: "Total number of feedback rows for the viewer (ignores paging).",
        },
    )
        total: number
}

@ObjectType({
    description: "Response wrapper for the myLearningFeedbacks query.",
})
/**
 * Response wrapper for the myLearningFeedbacks query.
 */
export class MyLearningFeedbacksResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyLearningFeedbacksData> {
    @Field(
        () => MyLearningFeedbacksData,
        {
            nullable: true,
            description: "The page of feedback + total count.",
        },
    )
        data: MyLearningFeedbacksData
}
