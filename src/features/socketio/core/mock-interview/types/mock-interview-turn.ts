import type {
    BaseMessage,
} from "@langchain/core/messages"
import type {
    Locale,
    MockInterviewKind,
    MockInterviewMode,
    MockInterviewPhase,
} from "@modules/databases"

/**
 * One prior turn of the mock-interview transcript, replayed back to the model
 * so it can reference what the candidate already said (the interviewer has no
 * server-side memory between turns -- the client resends the running history
 * on every ask, mirroring the `/content_ai` short-term-memory idiom).
 */
export interface MockInterviewTurnHistoryEntry {
    /** Who spoke this turn -- the AI interviewer, or the candidate. */
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
    /**
     * The TOP-LEVEL flow this session runs -- branches the whole prompt
     * between the EXISTING 5-phase design flow and the N-question qna flow.
     * "Mode split" (2026-07-06) -- this is the PRIMARY branch discriminator,
     * replacing the earlier per-session `kind`.
     */
    mode: MockInterviewMode
    /**
     * THIS QUESTION's cognitive frame -- meaningful ONLY when {@link mode} is
     * {@link MockInterviewMode.Qna}, where it is the kind RANDOMLY assigned to
     * the CURRENT seed (not a session-wide value -- a qna session mixes kinds
     * across its questions). Ignored when {@link mode} is
     * {@link MockInterviewMode.Design}.
     */
    kind?: MockInterviewKind | null
    /**
     * Current canonical phase of the 5-phase interview the next question must
     * probe -- meaningful ONLY when {@link mode} is
     * {@link MockInterviewMode.Design}.
     */
    phase: MockInterviewPhase
    /**
     * The CURRENT question's seed topic text (a flashcard question, or its
     * short title) -- meaningful ONLY when {@link mode} is
     * {@link MockInterviewMode.Qna}. The interviewer frames its question
     * around this seed, reading it through the {@link kind}'s cognitive frame
     * (theory asks it definitionally; reasoning asks a when/why/tradeoff
     * question about it; scenario asks an incident/apply question about it).
     */
    currentSeed?: string | null
    /**
     * 0-based index of the current question within the session's seed list --
     * used only for phrasing (question-index badge, e.g. 2/5) when {@link mode} is
     * {@link MockInterviewMode.Qna}.
     */
    questionIndex?: number | null
    /** Full transcript so far (oldest first), replayed for continuity. */
    history: Array<MockInterviewTurnHistoryEntry>
    /**
     * The candidate's most recent answer. Empty on the opening turn (no answer
     * yet to react to) -- the interviewer opens with a phase-appropriate probe
     * (design) or the seed's first question (qna).
     */
    latestAnswer: string
    /** Language the interviewer's next question must be written in. */
    locale: Locale
    /**
     * Seniority level the session was set up at, scaling how hard/deep the
     * interviewer's questions probe; null/unrecognized -> no seniority steer.
     */
    level?: string | null
}

/** Result of {@link MockInterviewTurnService.prepareTurn}. */
export interface PrepareMockInterviewTurnResult {
    /** The ordered system + human chat messages ready for {@link AiInvokeService.run}. */
    messages: Array<BaseMessage>
}
