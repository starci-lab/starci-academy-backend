import {
    Field,
    ID,
    Int,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypeMockInterviewPhase,
    MockInterviewPhase,
} from "@modules/databases/postgresql/primary/enums/mock-interview-phase"
import {
    GraphQLTypeModelProvider,
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"

@InputType({
    description: "One turn of a recorded mock-interview transcript.",
})
/**
 * One recorded turn of a completed mock-interview transcript. The candidate
 * answered across all 5 phases in a single conversation (kind="design") -- the
 * server grades the WHOLE ordered list of turns at once, not one question at
 * a time.
 */
export class MockInterviewTurnInput {
    @Field(
        () => String,
        {
            description: "Who spoke this turn — \"interviewer\" or \"candidate\".",
        },
    )
        role: string

    @Field(
        () => GraphQLTypeMockInterviewPhase,
        {
            description: "Which of the 5 canonical interview phases this turn belongs to (kind=\"design\" only — send any valid value for a Q&A-kind session; the server ignores it and uses questionIndex instead).",
        },
    )
        phase: MockInterviewPhase

    @Field(
        () => String,
        {
            description: "The turn's text content (candidate turns are speech-to-text transcribed).",
        },
    )
        content: string

    /**
     * 0-based index of the question this turn belongs to, for a Q&A-kind
     * (theory/reasoning/scenario) session -- additive field (nullable, so an
     * older client omitting it still validates); REQUIRED for the server to
     * group a Q&A session's turns into per-question `phaseScores` entries
     * (Question 1, Question 2, ... as emitted by the grader). Ignored for kind="design" (grouping there still
     * comes from `phase`).
     */
    @Field(
        () => Int,
        {
            nullable: true,
            description: "0-based question index this turn belongs to (Q&A kinds only); ignored for kind=\"design\".",
        },
    )
        questionIndex?: number

    /**
     * Free-form string (not an enum -- the only value that currently exists is
     * "code") mirroring the FE's `MockInterviewTurn.artifactHint` -- set on an
     * interviewer turn whose question shipped GIVEN code seeded into the
     * editable code tool, so a session resumed from
     * `syncMockInterviewSessionTurns`'s snapshot can re-render the "code
     * loaded into the editor" chip instead of the code inline, matching what
     * the learner originally saw. Reused by (and additive to)
     * `syncMockInterviewSessionTurns` -- `gradeMockInterviewSession` itself
     * never reads this field, only echoes/ignores it.
     */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Set to \"code\" on an interviewer turn whose given code was seeded into the editable code tool; omitted otherwise.",
        },
    )
        artifactHint?: string
}

@InputType({
    description: "Grade a whole mock-interview session against the 5-phase rubric.",
})
/**
 * Request for grading a WHOLE completed mock-interview session against the
 * 5-phase rubric, grounded in what the course actually taught. The server
 * RAG-retrieves course material scoped to `courseId` -- the client never
 * sends grading criteria. `locale` is taken from the request context
 * decorator, not this input.
 */
export class GradeMockInterviewSessionRequest {
    @Field(
        () => ID,
        {
            description: "Course the session belongs to — scopes the RAG grounding + the resolved enrollment.",
        },
    )
        courseId: string

    @Field(
        () => ID,
        {
            description: "The prompt the learner worked through (a milestone-task id, from mockInterviewPrompts).",
        },
    )
        promptId: string

    @Field(
        () => String,
        {
            description: "Snapshot of the prompt's title, so the server does not need to re-look it up.",
        },
    )
        promptTitle: string

    @Field(
        () => String,
        {
            nullable: true,
            description: "Seniority level the session was conducted at, or null for \"any level\".",
        },
    )
        level?: string

    @Field(
        () => [MockInterviewTurnInput],
        {
            description: "The full recorded transcript, one entry per conversational turn, in order.",
        },
    )
        turns: Array<MockInterviewTurnInput>

    @Field(
        () => ID,
        {
            description: "Client-generated id grouping this attempt into its interview run.",
        },
    )
        sessionId: string

    /** Concrete model the user picked in the grading dropdown (e.g. "gpt-4o"). */
    @Field(
        () => String,
        {
            nullable: true,
            description: "Concrete model name the user picked for grading; null = balancer default.",
        },
    )
        selectedModel?: string

    /** Provider serving {@link selectedModel}. */
    @Field(
        () => GraphQLTypeModelProvider,
        {
            nullable: true,
            description: "Provider serving the picked model.",
        },
    )
        selectedModelProvider?: ModelProvider
}
