import {
    SocketIoPayload,
} from "@modules/socketio"

/** Client → server payload to join a content's discussion room. */
export type SubscribeContentDiscussionSocketIoPayload = SocketIoPayload<{
    /** Content whose discussion room the client wants to join. */
    contentId: string
}>
