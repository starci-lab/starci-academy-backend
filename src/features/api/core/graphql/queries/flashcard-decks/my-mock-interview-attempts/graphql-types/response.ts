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

@ObjectType({
    description: "Score breakdown for one of the 5 canonical mock interview phases, on a past attempt.",
})
/** One phase's score breakdown inside a persisted mock-interview attempt. */
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

@ObjectType({
    description: "Score for one named evaluation attribute, on a past attempt.",
})
/** One named attribute's score inside a persisted mock-interview attempt. */
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

@ObjectType({
    description: "Per-question model-answer review for one mode=\"qna\" question, on a past attempt.",
})
/**
 * One persisted per-question model-answer review inside a past attempt --
 * mirrors {@link import("../../../../mutations/interview/grade-mock-interview-session/graphql-types/response").MockInterviewQuestionReviewItem}
 * exactly, so the history drawer renders it identically to the live
 * scorecard. Always empty on the parent for a `mode="design"` attempt.
 */
export class MockInterviewAttemptQuestionReviewItem {
    @Field(
        () => Int,
        {
            description: "0-based index of this question within the session.",
        },
    )
        questionIndex: number

    @Field(
        () => String,
        {
            description: "This question's cognitive frame (\"theory\" | \"reasoning\" | \"scenario\"), as drawn.",
        },
    )
        kind: string

    @Field(
        () => String,
        {
            description: "The interviewer's question text for this question.",
        },
    )
        question: string

    @Field(
        () => String,
        {
            description: "The candidate's own answer for this question.",
        },
    )
        candidateAnswer: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "The seed flashcard's authored model answer (Markdown); null when unavailable.",
        },
    )
        modelAnswer: string | null

    @Field(
        () => String,
        {
            description: "A one-line summary of what the candidate's answer was missing relative to the reference.",
        },
    )
        feedback: string

    @Field(
        () => Int,
        {
            description: "Score assigned to this question.",
        },
    )
        score: number

    @Field(
        () => Int,
        {
            description: "Maximum possible score for this question (always 100 for qna).",
        },
    )
        max: number

    @Field(
        () => String,
        {
            nullable: true,
            description: "Best-effort matched course content (lesson) id for this question; null when no confident match exists.",
        },
    )
        matchedContentId: string | null
}

@ObjectType({
    description: "One past graded mock-interview session.",
})
/** One past graded mock-interview session, for the viewer's history list. */
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
        () => String,
        {
            nullable: true,
            description: "The top-level flow this session ran (\"qna\" | \"design\"), or null for an attempt graded before the \"mode split\" (treated as \"design\").",
        },
    )
        mode: string | null

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
        () => [MockInterviewAttemptQuestionReviewItem],
        {
            description: "Per-question model-answer review — one entry per mode=\"qna\" question, snapshotted at grade time. Always empty for a mode=\"design\" attempt, or an attempt graded before this field existed.",
        },
    )
        questionReviews: Array<MockInterviewAttemptQuestionReviewItem>

    @Field(
        () => String,
        {
            description: "ISO timestamp of when this attempt was graded.",
        },
    )
        createdAt: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Optional user-chosen name for this practice session, copied from the session at grade time; null when the learner didn't name it (FE renders a time-based fallback).",
        },
    )
        name: string | null
}

@ObjectType({
    description: "A page of the viewer's mock-interview history.",
})
/** Data payload for the `myMockInterviewAttempts` query. */
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
/**
 * GraphQL envelope for `myMockInterviewAttempts`. `data` is one page of
 * the viewer's graded mock-interview history (newest first) so the
 * practice history screen can paginate without loading session transcripts.
 */
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
