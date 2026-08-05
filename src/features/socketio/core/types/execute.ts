import type {
    TypedSocket,
} from "@modules/platform/socketio/types/socket"

/** Params for executing a GraphQL query. */
export interface ExecuteParams<T> {
    /** The request object. */
    payload: T
    /** The socket client. */
    client: TypedSocket
}