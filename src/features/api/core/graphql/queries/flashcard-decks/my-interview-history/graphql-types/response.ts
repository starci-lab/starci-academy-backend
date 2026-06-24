import {
    Field,
    Float,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

/**
 * A user's aggregated mock-interview history, derived from the append-only
 * `interview_attempts` log: average score, verdict breakdown, and the weakest
 * topics to revisit. Optionally scoped to one deck.
 */
@ObjectType({
    description: "A user's aggregated mock-interview history.",
})
export class MyInterviewHistoryData {
    @Field(
        () => Int,
        {
            description: "Total graded answers in scope.",
        },
    )
        totalAnswered: number

    @Field(
        () => Float,
        {
            description: "Mean score (0–100) across those answers, one decimal.",
        },
    )
        averageScore: number

    @Field(
        () => Int,
        {
            description: "Best (highest) score across those answers; 0 when none.",
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
        () => [String],
        {
            description: "Most frequent tags among answers not passed — topics to revisit.",
        },
    )
        weakTags: Array<string>

    @Field(
        () => String,
        {
            nullable: true,
            description: "ISO timestamp of the most recent attempt, or null when none.",
        },
    )
        lastAttemptAt: string | null
}

/** Response wrapper for the myInterviewHistory query. */
@ObjectType({
    description: "Response wrapper for the myInterviewHistory query.",
})
export class MyInterviewHistoryResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyInterviewHistoryData> {
    /** The viewer's aggregated interview history. */
    @Field(
        () => MyInterviewHistoryData,
        {
            nullable: true,
            description: "The viewer's aggregated interview history.",
        },
    )
        data: MyInterviewHistoryData
}
