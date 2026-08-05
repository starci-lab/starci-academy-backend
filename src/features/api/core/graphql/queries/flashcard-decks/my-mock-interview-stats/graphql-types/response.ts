import {
    Field,
    Int,
    Float,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"

@ObjectType({
    description: "One point on the viewer's mock-interview overall-score trend line.",
})
/** One point on the viewer's overall-score trend line. */
export class MockInterviewStatsTrendPoint {
    @Field(
        () => Int,
        {
            description: "The attempt's overall score, 0-100.",
        },
    )
        overallScore: number
}

@ObjectType({
    description: "One phase (design) breakdown entry, aggregated across the viewer's scanned attempts.",
})
/** One phase (design) breakdown entry, aggregated across the scanned attempts. */
export class MockInterviewStatsBreakdownItem {
    @Field(
        () => String,
        {
            description: "The phase literal (design) this entry aggregates.",
        },
    )
        key: string

    @Field(
        () => Float,
        {
            description: "Average score across every attempt carrying this key.",
        },
    )
        avgScore: number

    @Field(
        () => Float,
        {
            description: "Average max across every attempt carrying this key.",
        },
    )
        avgMax: number

    @Field(
        () => Int,
        {
            description: "Count of attempts where this key's score/max ratio fell below the weak threshold.",
        },
    )
        weakCount: number

    @Field(
        () => Int,
        {
            description: "Total attempts carrying this key.",
        },
    )
        attemptCount: number
}

@ObjectType({
    description: "Mode split across the viewer's scanned mock-interview attempts.",
})
/** How many sessions of each top-level mode the scanned window contains. */
export class MockInterviewStatsModeSplit {
    @Field(
        () => Int,
        {
            description: "Completed mode=\"qna\" attempts in the scanned window.",
        },
    )
        qnaCount: number

    @Field(
        () => Int,
        {
            description: "Completed mode=\"design\" (or null-mode legacy) attempts in the scanned window.",
        },
    )
        designCount: number
}

@ObjectType({
    description: "The viewer's aggregated mock-interview stats for one course.",
})
/**
 * The viewer's aggregated mock-interview stats for one course — the
 * readiness hero (vs the pass bar, projected from the trend delta) +
 * the per-phase breakdown that `MockInterviewStats` renders
 * (`stats-canonical-fold` — 1 hero + 1 zone).
 */
export class MyMockInterviewStatsData {
    @Field(
        () => Boolean,
        {
            description: "True when the scanned window has too few attempts for a trustworthy aggregate — every other field is empty/zero when true.",
        },
    )
        insufficientData: boolean

    @Field(
        () => MockInterviewStatsModeSplit,
        {
            description: "Mode split across the scanned window.",
        },
    )
        modeSplit: MockInterviewStatsModeSplit

    @Field(
        () => [MockInterviewStatsTrendPoint],
        {
            description: "Overall-score trend across the most recent attempts (bounded, oldest of the window first).",
        },
    )
        trend: Array<MockInterviewStatsTrendPoint>

    @Field(
        () => [MockInterviewStatsBreakdownItem],
        {
            description: "Per-phase aggregate, mode=\"design\" attempts only.",
        },
    )
        byPhase: Array<MockInterviewStatsBreakdownItem>
}

@ObjectType({
    description: "Response wrapper for the myMockInterviewStats query.",
})
/** Response wrapper for the myMockInterviewStats query. */
export class MyMockInterviewStatsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyMockInterviewStatsData>
{
    @Field(
        () => MyMockInterviewStatsData,
        {
            nullable: true,
            description: "The viewer's aggregated mock-interview stats.",
        },
    )
        data: MyMockInterviewStatsData
}
