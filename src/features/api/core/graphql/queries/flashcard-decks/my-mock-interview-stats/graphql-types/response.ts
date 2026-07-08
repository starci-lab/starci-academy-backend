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

/** One point on the viewer's overall-score trend line. */
@ObjectType({
    description: "One point on the viewer's mock-interview overall-score trend line.",
})
export class MockInterviewStatsTrendPoint {
    @Field(
        () => String,
        {
            description: "ISO timestamp of when the attempt behind this point was graded.",
        },
    )
        completedAt: string

    @Field(
        () => Int,
        {
            description: "The attempt's overall score, 0-100.",
        },
    )
        overallScore: number

    @Field(
        () => String,
        {
            description: "The attempt's mode (\"qna\" | \"design\").",
        },
    )
        mode: string

    @Field(
        () => String,
        {
            description: "The attempt's coarse verdict band (\"pass\" | \"borderline\" | \"fail\").",
        },
    )
        verdict: string
}

/** One phase/kind breakdown entry, aggregated across the scanned attempts. */
@ObjectType({
    description: "One phase (design) or kind (qna) breakdown entry, aggregated across the viewer's scanned attempts.",
})
export class MockInterviewStatsBreakdownItem {
    @Field(
        () => String,
        {
            description: "The phase literal (design) or kind literal (qna) this entry aggregates.",
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

/** The single weakest breakdown entry across both axes — drives the "what to improve" callout. */
@ObjectType({
    description: "The single weakest phase/kind across both axes, when it qualifies.",
})
export class MockInterviewStatsWeakest {
    @Field(
        () => String,
        {
            description: "The weak phase/kind literal.",
        },
    )
        key: string

    @Field(
        () => String,
        {
            description: "Which axis this key belongs to — \"phase\" (design), \"kind\" (qna), or \"attribute\" (both modes).",
        },
    )
        axis: string

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
            description: "Count of attempts where this key fell below the weak threshold.",
        },
    )
        weakCount: number

    @Field(
        () => String,
        {
            nullable: true,
            description: "Best-effort matched course content (lesson) id to deep-link \"study this\" to; null when no confident match exists.",
        },
    )
        matchedContentId: string | null
}

/** How many sessions of each top-level mode the scanned window contains. */
@ObjectType({
    description: "Mode split across the viewer's scanned mock-interview attempts.",
})
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

/** Tally of the viewer's scanned attempts by coarse verdict band. */
@ObjectType({
    description: "Tally of the viewer's scanned mock-interview attempts by coarse verdict band.",
})
export class MockInterviewStatsVerdictCounts {
    @Field(
        () => Int,
        {
            description: "Attempts graded \"pass\".",
        },
    )
        pass: number

    @Field(
        () => Int,
        {
            description: "Attempts graded \"borderline\".",
        },
    )
        borderline: number

    @Field(
        () => Int,
        {
            description: "Attempts graded \"fail\".",
        },
    )
        fail: number
}

/** The viewer's aggregated mock-interview stats for one course. */
@ObjectType({
    description: "The viewer's aggregated mock-interview stats for one course.",
})
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

    @Field(
        () => [MockInterviewStatsBreakdownItem],
        {
            description: "Per-kind aggregate, mode=\"qna\" attempts only.",
        },
    )
        byKind: Array<MockInterviewStatsBreakdownItem>

    @Field(
        () => [MockInterviewStatsBreakdownItem],
        {
            description: "Per-attribute aggregate (communication/structuredThinking/tradeoffAwareness), across every attempt regardless of mode.",
        },
    )
        byAttribute: Array<MockInterviewStatsBreakdownItem>

    @Field(
        () => MockInterviewStatsWeakest,
        {
            nullable: true,
            description: "The single weakest phase/kind/attribute across all three axes, when it qualifies; null otherwise.",
        },
    )
        weakest: MockInterviewStatsWeakest | null

    @Field(
        () => MockInterviewStatsVerdictCounts,
        {
            description: "Tally of the viewer's scanned attempts by coarse verdict band.",
        },
    )
        verdictCounts: MockInterviewStatsVerdictCounts
}

/** Response wrapper for the myMockInterviewStats query. */
@ObjectType({
    description: "Response wrapper for the myMockInterviewStats query.",
})
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
