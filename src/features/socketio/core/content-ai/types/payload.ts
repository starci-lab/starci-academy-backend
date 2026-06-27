import {
    SocketIoPayload,
} from "@modules/socketio"

/** One prior turn replayed to the model for short-term chat memory. */
export interface ContentAiHistoryTurn {
    /** Author: `"user"` or `"assistant"`. */
    role: string
    /** The message text. */
    content: string
}

/** Client → server payload to ask a content-AI question and stream the answer. */
export type AskContentAiSocketIoPayload = SocketIoPayload<{
    /** Client-generated id correlating this question's streamed chunks. */
    streamId: string
    /** Content the question is about. */
    contentId: string
    /** The learner's question about this content. */
    question: string
    /** Recent prior turns (oldest first) for short-term memory; capped server-side. */
    history?: Array<ContentAiHistoryTurn>
}>

/** Client → server payload to abort an in-flight content-AI answer stream. */
export type AbortContentAiSocketIoPayload = SocketIoPayload<{
    /** Stream whose in-flight answer should be aborted. */
    streamId: string
}>
