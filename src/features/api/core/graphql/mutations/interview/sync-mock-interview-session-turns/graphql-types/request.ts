import {
    Field,
    ID,
    Int,
    InputType,
} from "@nestjs/graphql"
import {
    MockInterviewTurnInput,
} from "../../grade-mock-interview-session/graphql-types/request"

@InputType({
    description: "Sync an in-flight mock-interview session's transcript + position for later resume.",
})
/**
 * Periodically syncs an IN-FLIGHT mock-interview session's transcript +
 * position to the server -- "resume mock interview session" (2026-07-08), so
 * a learner who navigates away mid-session (tab close, refresh, network
 * drop) can pick their draw back up via `myInProgressMockInterviewSession`
 * instead of losing the conversation and being forced into a fresh draw.
 * Reuses {@link MockInterviewTurnInput} (the exact shape
 * `gradeMockInterviewSession` already accepts for the final transcript)
 * rather than a parallel duplicate type -- the eventual grade call re-sends
 * this same shape.
 */
export class SyncMockInterviewSessionTurnsRequest {
    @Field(
        () => ID,
        {
            description: "Id of the session draw to sync (from startMockInterviewSession's sessionId).",
        },
    )
        sessionId: string

    @Field(
        () => [MockInterviewTurnInput],
        {
            description: "The full transcript recorded so far, one entry per conversational turn, in order.",
        },
    )
        turns: Array<MockInterviewTurnInput>

    @Field(
        () => Int,
        {
            description: "0-based index of the \"qna\"-mode question the learner is currently on.",
        },
    )
        questionIndex: number

    @Field(
        () => Int,
        {
            description: "0-based index of the \"design\"-mode phase the learner is currently on.",
        },
    )
        phaseIndex: number
}
