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

/** One phase's score breakdown inside a graded mock-interview session. */
@ObjectType({
    description: "Score breakdown for one of the 5 canonical mock interview phases.",
})
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

/** One named attribute's score inside a graded mock-interview session. */
@ObjectType({
    description: "Score for one named evaluation attribute (communication, structured thinking, …).",
})
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

/** The graded result for one whole mock-interview session. */
@ObjectType({
    description: "Grade for a whole mock-interview session, scored against the 5-phase rubric.",
})
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
}

@ObjectType({
    description: "Response wrapper for the gradeMockInterviewSession mutation.",
})
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
