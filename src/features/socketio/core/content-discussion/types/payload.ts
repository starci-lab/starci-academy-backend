import {
    SocketIoPayload,
} from "@modules/platform/socketio/types/ws-payload"

/** Client -> server payload to join a content's discussion room. */
export type SubscribeContentDiscussionSocketIoPayload = SocketIoPayload<{
    /** Content whose discussion room the client wants to join. */
    contentId: string
}>
