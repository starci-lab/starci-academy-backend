import {
    SocketIoPayload,
} from "@modules/socketio"

/**
 * Client -> server payload to subscribe to the caller's own notification stream.
 * No fields are needed -- the recipient is derived from the authenticated socket,
 * so a client can never subscribe to someone else's notifications.
 */
export type SubscribeNotificationsSocketIoPayload = SocketIoPayload<Record<string, never>>
