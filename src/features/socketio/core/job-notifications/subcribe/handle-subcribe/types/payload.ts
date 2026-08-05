import {
    SocketIoPayload,
} from "@modules/platform/socketio/types/ws-payload"

/** Track-by-job params from client. */
export type SubcribeJobNotificationSocketIoPayload = SocketIoPayload<{
    /** The job ID. */
    jobId: string
}>

