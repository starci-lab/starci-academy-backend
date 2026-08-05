import {
    Field,
    Float,
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
    description: "Score breakdown for one of the 5 canonical mock interview phases.",
})
/** One phase's score breakdown inside a graded mock-interview session. */
export class MockInterviewPhaseScoreItem {
    @Field(
        () => String,
        {
            description: "One of the 5 canonical mock interview phase literals (e.g. \"requirements\", \"deepDive\").",
        },
    )
        phase: string

    @Field(
        () => Float,
        {
            description: "Score the model assigned to this phase.",
        },
    )
        score: number

    @Field(
        () => Float,
        {
            description: "Maximum possible score for this phase (phase maxes sum to 100 across the breakdown).",
        },
    )
        max: number
}

@ObjectType({
    description: "Score for one named evaluation attribute (communication, structured thinking, …).",
})
/** One named attribute's score inside a graded mock-interview session. */
export class MockInterviewAttributeScoreItem {
    @Field(
        () => String,
        {
            description: "The named attribute (e.g. \"communication\", \"structuredThinking\", \"tradeoffAwareness\").",
        },
    )
        key: string

    @Field(
        () => Float,
        {
            description: "Score 0–100 the model assigned to this attribute.",
        },
    )
        score: number
}

@ObjectType({
    description: "Per-question model-answer review for one mode=\"qna\" question.",
})
/**
 * One `mode="qna"` question's full review -- the candidate's own answer paired
 * with the course's CANONICAL authored answer for the exact same flashcard
 * seed, so the learner can see exactly what a "correct" answer for THIS
 * course looks like (a generic tool has no ground truth to compare against).
 * Always an empty array on the parent for `mode="design"`.
 */
export class MockInterviewQuestionReviewItem {
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
            description: "The seed flashcard's authored model answer (Markdown) — the canonical, course-grounded correct answer; null when unavailable.",
        },
    )
        modelAnswer: string | null

    @Field(
        () => String,
        {
            description: "A one-line summary of what the candidate's answer was missing relative to the reference; empty string when the model omitted it.",
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
    description: "Grade for a whole mock-interview session, scored against the 5-phase rubric.",
})
/** The graded result for one whole mock-interview session. */
export class MockInterviewGradeSessionData {
    @Field(
        () => Int,
        {
            description: "Overall score for the whole session, integer 0–100.",
        },
    )
        overallScore: number

    @Field(
        () => String,
        {
            description: "Coarse pass/borderline/fail band (\"pass\" | \"borderline\" | \"fail\").",
        },
    )
        verdict: string

    @Field(
        () => [MockInterviewPhaseScoreItem],
        {
            description: "Per-phase score breakdown, one entry per phase the model chose to score.",
        },
    )
        phaseScores: Array<MockInterviewPhaseScoreItem>

    @Field(
        () => [MockInterviewAttributeScoreItem],
        {
            description: "Per-attribute score breakdown (communication, structured thinking, …).",
        },
    )
        attributeScores: Array<MockInterviewAttributeScoreItem>

    @Field(
        () => [String],
        {
            description: "Concrete things the candidate got right across the session.",
        },
    )
        strengths: Array<string>

    @Field(
        () => [String],
        {
            description: "Concrete things missing or wrong, framed as what to add.",
        },
    )
        gaps: Array<string>

    @Field(
        () => String,
        {
            nullable: true,
            description: "A natural follow-up an interviewer would ask next, or null.",
        },
    )
        followUpQuestion?: string | null

    @Field(
        () => [String],
        {
            description: "Distinct content (lesson) ids the RAG grounding excerpt was retrieved from, in similarity order — one flat list for the whole session (retrieval is not phase-scoped). Empty when retrieval missed/failed or the index has no hits; the FE renders its \"unmatched\" fallback in that case.",
        },
    )
        matchedContentIds: Array<string>

    @Field(
        () => [MockInterviewQuestionReviewItem],
        {
            description: "Per-question model-answer review — one entry per mode=\"qna\" question. Always empty for mode=\"design\".",
        },
    )
        questionReviews: Array<MockInterviewQuestionReviewItem>
}

@ObjectType({
    description: "Response wrapper for the gradeMockInterviewSession mutation.",
})
/**
 * Envelope for a finished session grade. `data` is nullable so the transform
 * interceptor can null it on the error path -- a required field would crash
 * GraphQL and hide the real exception (e.g. RAG/model failure).
 */
export class GradeMockInterviewSessionResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<MockInterviewGradeSessionData>
{
    @Field(
        () => MockInterviewGradeSessionData,
        {
            nullable: true,
            description: "The graded mock-interview session.",
        },
    )
        data: MockInterviewGradeSessionData
}
