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

/** One phase's score breakdown inside a persisted mock-interview attempt. */
@ObjectType({
    description: "Score breakdown for one of the 5 canonical mock interview phases, on a past attempt.",
})
export class MockInterviewAttemptPhaseScoreItem {
    @Field(
        () => String,
        {
            description: "One of the 5 canonical mock interview phase literals (e.g. \"requirements\", \"deepDive\").",
        },
    )
        phase: string

    @Field(
        () => Int,
        {
            description: "Score the model assigned to this phase.",
        },
    )
        score: number

    @Field(
        () => Int,
        {
            description: "Maximum possible score for this phase.",
        },
    )
        max: number
}

/** One named attribute's score inside a persisted mock-interview attempt. */
@ObjectType({
    description: "Score for one named evaluation attribute, on a past attempt.",
})
export class MockInterviewAttemptAttributeScoreItem {
    @Field(
        () => String,
        {
            description: "The named attribute (e.g. \"communication\", \"structuredThinking\", \"tradeoffAwareness\").",
        },
    )
        key: string

    @Field(
        () => Int,
        {
            description: "Score 0–100 the model assigned to this attribute.",
        },
    )
        score: number
}

/** One past graded mock-interview session, for the viewer's history list. */
@ObjectType({
    description: "One past graded mock-interview session.",
})
export class MockInterviewAttemptItem {
    @Field(
        () => ID,
        {
            description: "Attempt row id.",
        },
    )
        id: string

    @Field(
        () => ID,
        {
            description: "Client-generated id grouping this attempt into its interview run.",
        },
    )
        sessionId: string

    @Field(
        () => ID,
        {
            description: "The prompt (capstone milestone-task id or a curated classic slug) worked through.",
        },
    )
        promptId: string

    @Field(
        () => String,
        {
            description: "Snapshot of the prompt's title at grade time.",
        },
    )
        promptTitle: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Seniority level the session was graded against, or null (any level).",
        },
    )
        level: string | null

    @Field(
        () => Int,
        {
            description: "Integer 0–100 overall score.",
        },
    )
        overallScore: number

    @Field(
        () => String,
        {
            description: "Coarse pass/borderline/fail band.",
        },
    )
        verdict: string

    @Field(
        () => [MockInterviewAttemptPhaseScoreItem],
        {
            description: "Per-phase score breakdown.",
        },
    )
        phaseScores: Array<MockInterviewAttemptPhaseScoreItem>

    @Field(
        () => [MockInterviewAttemptAttributeScoreItem],
        {
            description: "Per-attribute score breakdown.",
        },
    )
        attributeScores: Array<MockInterviewAttemptAttributeScoreItem>

    @Field(
        () => [String],
        {
            description: "Concrete things done right.",
        },
    )
        strengths: Array<string>

    @Field(
        () => [String],
        {
            description: "Concrete gaps to address.",
        },
    )
        gaps: Array<string>

    @Field(
        () => String,
        {
            nullable: true,
            description: "A follow-up an interviewer would ask next, or null.",
        },
    )
        followUpQuestion: string | null

    @Field(
        () => [String],
        {
            description: "Distinct content (lesson) ids the RAG grounding excerpt was retrieved from at grade time (snapshot), in similarity order. Empty when retrieval missed/failed/index absent at grade time, or for attempts graded before this field existed.",
        },
    )
        matchedContentIds: Array<string>

    @Field(
        () => String,
        {
            description: "ISO timestamp of when this attempt was graded.",
        },
    )
        createdAt: string
}

/** Data payload for the `myMockInterviewAttempts` query. */
@ObjectType({
    description: "A page of the viewer's mock-interview history.",
})
export class MyMockInterviewAttemptsData {
    @Field(
        () => Int,
        {
            description: "Total attempts matching the scope, regardless of the requested page.",
        },
    )
        totalCount: number

    @Field(
        () => [MockInterviewAttemptItem],
        {
            description: "This page's attempts, newest first.",
        },
    )
        items: Array<MockInterviewAttemptItem>
}

@ObjectType({
    description: "Response wrapper for the myMockInterviewAttempts query.",
})
export class MyMockInterviewAttemptsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MyMockInterviewAttemptsData>
{
    @Field(
        () => MyMockInterviewAttemptsData,
        {
            nullable: true,
            description: "The viewer's mock-interview history page.",
        },
    )
        data: MyMockInterviewAttemptsData
}
