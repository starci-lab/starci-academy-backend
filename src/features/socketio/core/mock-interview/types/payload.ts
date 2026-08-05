import {
    SocketIoPayload,
} from "@modules/socketio"

/** One prior turn of the transcript, as sent by the client over the wire. */
export interface AskMockInterviewTurnHistoryEntry {
    /** Who spoke this turn -- `"interviewer"` or `"candidate"`. */
    role: string
    /** The turn's text. */
    content: string
}

/**
 * Client -> server payload to ask the mock interviewer for its next turn
 * (opening question, or a follow-up reacting to the candidate's latest answer).
 */
export type AskMockInterviewTurnSocketIoPayload = SocketIoPayload<{
    /** Client-generated id correlating this turn's streamed chunks. */
    streamId: string
    /**
     * Id of the persisted `mock_interview_sessions` row this ask belongs to --
     * "session time limit" (2026-07-08): lets the gateway look up the
     * session's OWN `createdAt` and enforce the 1-hour ask-loop deadline
     * server-side before spending an AI call, never trusting a client-side
     * clock. Required (a turn ask with no session to enforce against is
     * rejected).
     */
    sessionId: string
    /** Course the interview is grounded in (RAG scope + on-rails course content). */
    courseId: string
    /** Id of the interview prompt this session is running. */
    promptId: string
    /** Human-readable title of what the candidate is working through this session. */
    promptTitle: string
    /**
     * Current canonical phase (an {@link MockInterviewPhase} value) to probe
     * next -- meaningful ONLY for `mode="design"` (the 5-phase flow). Ignored
     * for `mode="qna"`, which uses `questionIndex`/`currentSeed`/`kind`
     * instead; the client may send any placeholder value for `phase` on a
     * qna-mode ask.
     */
    phase: string
    /** Full transcript so far (oldest first); omitted/empty on the opening turn. */
    history?: Array<AskMockInterviewTurnHistoryEntry>
    /** The candidate's most recent answer; empty string on the opening turn. */
    latestAnswer: string
    /**
     * Seniority level the session was set up at ("junior" | "middle" | "senior" | ...),
     * scaling how hard/deep the interviewer's questions should probe; absent/unrecognized
     * -> no seniority steer (mirrors the grading-time level fallback).
     */
    level?: string | null
    /** Pinned model name (absent -> balancer picks from the chain). */
    model?: string | null
    /** Provider of the pinned model (required together with `model`). */
    provider?: string | null
    /**
     * The TOP-LEVEL flow this session runs ("qna" | "design"), echoing what
     * `startMockInterviewSession` returned; absent/unrecognized -> treated as
     * "design" (the pre-existing 5-phase flow) so an old FE build never breaks.
     */
    mode?: string | null
    /**
     * THIS QUESTION's cognitive frame ("theory" | "reasoning" | "scenario") --
     * the kind `startMockInterviewSession` randomly assigned to the CURRENT
     * seed (see `seedTopics[].kind`), NOT a session-wide value: a `mode="qna"`
     * session mixes kinds across its questions, so the client resends the
     * CURRENT question's own kind on every ask for it. Required for
     * `mode="qna"`; ignored for `mode="design"`.
     */
    kind?: string | null
    /**
     * The CURRENT question's seed topic text (a flashcard's question, or the
     * short title `startMockInterviewSession` returned in `seedTopics`) -- the
     * FE owns progression through the seed list (mirrors how it already owns
     * `phase` progression for mode="design") and resends the seed for every
     * ask of the SAME question (opening ask + each follow-up probe). Required
     * for `mode="qna"`; ignored for `mode="design"`.
     */
    currentSeed?: string | null
    /**
     * 0-based index of the current question within the session's seed list
     * (`seedTopics`) -- used only for phrasing (question-index badge, e.g. 2/5) and to detect the
     * FIRST ask of a question (no `history` for this seed yet) vs a
     * follow-up probe. Required for `mode="qna"`; ignored for `mode="design"`.
     */
    questionIndex?: number | null
}>

/** Client -> server payload to abort an in-flight interviewer turn stream. */
export type AbortMockInterviewTurnSocketIoPayload = SocketIoPayload<{
    /** Stream whose in-flight turn should be aborted. */
    streamId: string
}>
