import type {
    StreamConnection
} from "./stream-connection"

/** Params for creating an async iterable stream from a connection. */
export interface CreateStreamParams<TData> {
    /** The live connection to wrap as an async iterable; its handlers drive the stream. */
    connection: StreamConnection<TData>
    /** Optional abort signal; aborting cancels the stream and closes the connection. */
    signal?: AbortSignal
    /** Called once the connection opens, before the first chunk is yielded. */
    onOpen?: (connection: StreamConnection<TData>) => Promise<void> | void
    /** Called when the stream errors; receives the normalized {@link Error}. */
    onError?: (error: Error) => Promise<void> | void
    /** Called exactly once when the stream closes (normal completion or abort). */
    onClose?: () => Promise<void> | void
}
