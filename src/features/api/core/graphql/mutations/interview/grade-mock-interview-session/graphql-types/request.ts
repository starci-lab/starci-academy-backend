import {
    Field,
    ID,
    InputType,
} from "@nestjs/graphql"
import {
    GraphQLTypeModelProvider,
    GraphQLTypeMockInterviewPhase,
    ModelProvider,
    MockInterviewPhase,
} from "@modules/databases"

/**
 * One recorded turn of a completed mock-interview transcript. The candidate
 * answered across all 5 phases in a single conversation — the server grades
 * the WHOLE ordered list of turns at once, not one question at a time.
 */
@InputType({
    description: "One turn of a recorded mock-interview transcript.",
})
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
            description: "Which of the 5 canonical interview phases this turn belongs to.",
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
}

/**
 * Request for grading a WHOLE completed mock-interview session against the
 * 5-phase rubric, grounded in what the course actually taught. The server
 * RAG-retrieves course material scoped to `courseId` — the client never
 * sends grading criteria. `locale` is taken from the request context
 * decorator, not this input.
 */
@InputType({
    description: "Grade a whole mock-interview session against the 5-phase rubric.",
})
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
