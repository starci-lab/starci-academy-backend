import {
    SocketIoPayload,
} from "@modules/socketio"

/** Client → server payload to subscribe to (and start streaming) a RAG Playground run. */
export type SubscribeRagPlaygroundRunSocketIoPayload = SocketIoPayload<{
    /** Run whose token stream the client wants to join. */
    runId: string
}>

/** Client → server payload to abort an in-flight RAG Playground run stream. */
export type AbortRagPlaygroundRunSocketIoPayload = SocketIoPayload<{
    /** Run whose in-flight stream should be aborted. */
    runId: string
}>
