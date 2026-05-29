import type {
    Namespace,
} from "socket.io"
import type {
    TypedSocket
} from "./socket"

/** Params for sending a success WS message. */
export interface SuccessParams<T = unknown> {
    /** Human-readable success message included in the emitted payload. */
    message: string
    /** Optional payload data delivered alongside the success message. */
    data?: T
    /** The target socket the success message is emitted to. */
    client: TypedSocket
    /** The event name to emit the success message under. */
    eventName: string
}

/** Params for sending a success WS message to a room. */
export interface SuccessToRoomParams<T = unknown> {
    /** Human-readable success message included in the emitted payload. */
    message: string
    /** Optional payload data delivered alongside the success message. */
    data?: T
    /** The event name to emit the success message under. */
    eventName: string
    /** The room id all members of which receive the message. */
    room: string
    /** The Socket.IO namespace used to emit to the room. */
    namespace: Namespace
}

/** Params for sending a error WS message. */
export interface ErrorParams {
    /** The error whose message is sent to the client. */
    error: Error
    /** The target socket the error message is emitted to. */
    client: TypedSocket
    /** The event name to emit the error message under. */
    eventName: string
}
