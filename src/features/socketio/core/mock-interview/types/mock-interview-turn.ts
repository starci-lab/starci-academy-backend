import type {
    BaseMessage,
} from "@langchain/core/messages"
import type {
    Locale,
    MockInterviewPhase,
} from "@modules/databases"

/**
 * One prior turn of the mock-interview transcript, replayed back to the model
 * so it can reference what the candidate already said (the interviewer has no
 * server-side memory between turns — the client resends the running history
 * on every ask, mirroring the `/content_ai` short-term-memory idiom).
 */
export interface MockInterviewTurnHistoryEntry {
    /** Who spoke this turn — the AI interviewer, or the candidate. */
    role: "interviewer" | "candidate"
    /** The turn's text (interviewer question, or candidate's transcribed answer). */
    content: string
}

/** Params for {@link MockInterviewTurnService.prepareTurn}. */
export interface PrepareMockInterviewTurnParams {
    /** Course the interview is grounded in (RAG retrieval + on-rails scope). */
    courseId: string
    /** Human-readable title of what the candidate is working through this session. */
    promptTitle: string
    /** Current canonical phase of the 5-phase interview the next question must probe. */
    phase: MockInterviewPhase
    /** Full transcript so far (oldest first), replayed for continuity. */
    history: Array<MockInterviewTurnHistoryEntry>
    /**
     * The candidate's most recent answer. Empty on the opening turn (no answer
     * yet to react to) — the interviewer opens with a phase-appropriate probe.
     */
    latestAnswer: string
    /** Language the interviewer's next question must be written in. */
    locale: Locale
}

/** Result of {@link MockInterviewTurnService.prepareTurn}. */
export interface PrepareMockInterviewTurnResult {
    /** The ordered system + human chat messages ready for {@link AiInvokeService.run}. */
    messages: Array<BaseMessage>
}
