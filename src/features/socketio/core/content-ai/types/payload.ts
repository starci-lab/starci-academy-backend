import {
    SocketIoPayload,
} from "@modules/platform/socketio/types/ws-payload"

/** One prior turn replayed to the model for short-term chat memory. */
export interface ContentAiHistoryTurn {
    /** Author: `"user"` or `"assistant"`. */
    role: string
    /** The message text. */
    content: string
}

/** Client -> server payload to ask a content-AI question and stream the answer. */
export type AskContentAiSocketIoPayload = SocketIoPayload<{
    /** Client-generated id correlating this question's streamed chunks. */
    streamId: string
    /** Conversation (session) this turn belongs to -- the completed turn is saved under it. */
    sessionId: string
    /** Lesson content the question is grounded on (lesson scope; recorded per turn -- a session can span lessons). Omitted on a task/foundation page. */
    contentId?: string | null
    /** Capstone / personal-project task the question is grounded on (task scope). */
    taskId?: string | null
    /** Hands-on challenge the question is grounded on (challenge scope, enrolled-only). */
    challengeId?: string | null
    /** Flashcard-quiz deck the question is grounded on (quiz scope, enrolled-only; hidden during a live attempt). */
    quizId?: string | null
    /** Global foundation-library doc the question is grounded on (foundation scope). */
    foundationId?: string | null
    /** Course the question is grounded on when no lesson/task/foundation is open (course scope, enrolled-only). */
    courseId?: string | null
    /** The learner's question about this content. */
    question: string
    /** Recent prior turns (oldest first) for short-term memory; capped server-side. */
    history?: Array<ContentAiHistoryTurn>
    /** Pinned model name (absent -> balancer picks from the free chain). */
    model?: string | null
    /** Provider of the pinned model (required together with `model`). */
    provider?: string | null
}>

/** Client -> server payload to abort an in-flight content-AI answer stream. */
export type AbortContentAiSocketIoPayload = SocketIoPayload<{
    /** Stream whose in-flight answer should be aborted. */
    streamId: string
}>
