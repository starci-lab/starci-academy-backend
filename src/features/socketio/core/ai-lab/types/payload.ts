import {
    SocketIoPayload,
} from "@modules/socketio"

/** Client → server payload to subscribe to (and start streaming) an AI Lab run. */
export type SubscribeAiLabRunSocketIoPayload = SocketIoPayload<{
    /** Run whose token stream the client wants to join. */
    runId: string
}>

/** Client → server payload to abort an in-flight AI Lab run stream. */
export type AbortAiLabRunSocketIoPayload = SocketIoPayload<{
    /** Run whose in-flight stream should be aborted. */
    runId: string
}>
