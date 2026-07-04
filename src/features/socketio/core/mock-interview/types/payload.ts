import {
    SocketIoPayload,
} from "@modules/socketio"

/** One prior turn of the transcript, as sent by the client over the wire. */
export interface AskMockInterviewTurnHistoryEntry {
    /** Who spoke this turn — `"interviewer"` or `"candidate"`. */
    role: string
    /** The turn's text. */
    content: string
}

/**
 * Client → server payload to ask the mock interviewer for its next turn
 * (opening question, or a follow-up reacting to the candidate's latest answer).
 */
export type AskMockInterviewTurnSocketIoPayload = SocketIoPayload<{
    /** Client-generated id correlating this turn's streamed chunks. */
    streamId: string
    /** Course the interview is grounded in (RAG scope + on-rails course content). */
    courseId: string
    /** Id of the interview prompt this session is running. */
    promptId: string
    /** Human-readable title of what the candidate is working through this session. */
    promptTitle: string
    /** Current canonical phase (an {@link MockInterviewPhase} value) to probe next. */
    phase: string
    /** Full transcript so far (oldest first); omitted/empty on the opening turn. */
    history?: Array<AskMockInterviewTurnHistoryEntry>
    /** The candidate's most recent answer; empty string on the opening turn. */
    latestAnswer: string
    /** Lane: "auto" (free/economy chain) or "premium" (pin the chosen model). */
    mode?: string
    /** Pinned model name (only with mode "premium"). */
    model?: string | null
    /** Provider of the pinned model. */
    provider?: string | null
}>

/** Client → server payload to abort an in-flight interviewer turn stream. */
export type AbortMockInterviewTurnSocketIoPayload = SocketIoPayload<{
    /** Stream whose in-flight turn should be aborted. */
    streamId: string
}>
