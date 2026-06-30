import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/** One answered question within a run, with its grade + persisted feedback. */
@ObjectType({
    description: "One answered question in a mock-interview run, with grade + feedback.",
})
export class InterviewSessionAttemptItem {
    @Field(
        () => ID,
        {
            description: "Attempt id.",
        },
    )
        id: string

    @Field(
        () => Int,
        {
            description: "Integer 0–100 score.",
        },
    )
        score: number

    @Field(
        () => String,
        {
            description: "Coarse verdict band (pass/borderline/fail).",
        },
    )
        verdict: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Seniority level of the question, or null.",
        },
    )
        level: string | null

    @Field(
        () => [String],
        {
            description: "Technology tags of the question.",
        },
    )
        tags: Array<string>

    @Field(
        () => String,
        {
            description: "The question prompt (Markdown).",
        },
    )
        question: string

    @Field(
        () => [String],
        {
            description: "Concrete strengths (empty for legacy rows).",
        },
    )
        strengths: Array<string>

    @Field(
        () => [String],
        {
            description: "Concrete gaps (empty for legacy rows).",
        },
    )
        gaps: Array<string>

    @Field(
        () => String,
        {
            nullable: true,
            description: "One-line nudge toward the model answer, or null.",
        },
    )
        modelAnswerHint: string | null

    @Field(
        () => String,
        {
            description: "ISO timestamp the answer was graded.",
        },
    )
        createdAt: string
}

/** The answered questions of one run, in answer order. */
@ObjectType({
    description: "The answered questions of one mock-interview run.",
})
export class InterviewSessionAttemptsData {
    @Field(
        () => [InterviewSessionAttemptItem],
        {
            description: "The run's answers, in answer order.",
        },
    )
        items: Array<InterviewSessionAttemptItem>
}

/** Response wrapper for the interviewSessionAttempts query. */
@ObjectType({
    description: "Response wrapper for the interviewSessionAttempts query.",
})
export class InterviewSessionAttemptsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<InterviewSessionAttemptsData> {
    /** The run's answered questions. */
    @Field(
        () => InterviewSessionAttemptsData,
        {
            nullable: true,
            description: "The run's answered questions.",
        },
    )
        data: InterviewSessionAttemptsData
}
