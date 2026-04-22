import {
    SocketIoPayload,
} from "@modules/socketio"

/** Track-by-job params from client. */
export type SubcribeJobNotificationSocketIoPayload = SocketIoPayload<{
    /** The job ID. */
    jobId: string
}>

