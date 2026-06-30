import {
    Field,
    Float,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * One interview RUN (the 5/10 questions answered in a single session),
 * aggregated from the `interview_attempts` rows sharing an `interview_session_id`.
 */
@ObjectType({
    description: "A single mock-interview run (session) with its aggregated scores.",
})
export class InterviewSessionItem {
    @Field(
        () => ID,
        {
            description: "The run's session id.",
        },
    )
        sessionId: string

    @Field(
        () => String,
        {
            description: "ISO timestamp the run started (earliest answer).",
        },
    )
        startedAt: string

    @Field(
        () => Int,
        {
            description: "How many questions were answered in the run.",
        },
    )
        questionCount: number

    @Field(
        () => Float,
        {
            description: "Mean score (0–100) across the run, one decimal.",
        },
    )
        averageScore: number

    @Field(
        () => Int,
        {
            description: "Best (highest) score in the run.",
        },
    )
        bestScore: number

    @Field(
        () => Int,
        {
            description: "How many answers passed.",
        },
    )
        passCount: number

    @Field(
        () => Int,
        {
            description: "How many answers were borderline.",
        },
    )
        borderlineCount: number

    @Field(
        () => Int,
        {
            description: "How many answers failed.",
        },
    )
        failCount: number

    @Field(
        () => String,
        {
            nullable: true,
            description: "Dominant seniority level across the run's questions, or null.",
        },
    )
        level: string | null
}

/** A page of interview runs plus the total run count for pagination. */
@ObjectType({
    description: "A page of mock-interview runs plus the total run count.",
})
export class InterviewSessionsData {
    @Field(
        () => [InterviewSessionItem],
        {
            description: "The runs on this page, newest first.",
        },
    )
        items: Array<InterviewSessionItem>

    @Field(
        () => Int,
        {
            description: "Total number of runs in scope (for pagination).",
        },
    )
        totalCount: number
}

/** Response wrapper for the interviewSessions query. */
@ObjectType({
    description: "Response wrapper for the interviewSessions query.",
})
export class InterviewSessionsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<InterviewSessionsData> {
    /** The viewer's paginated interview runs. */
    @Field(
        () => InterviewSessionsData,
        {
            nullable: true,
            description: "The viewer's paginated interview runs.",
        },
    )
        data: InterviewSessionsData
}
