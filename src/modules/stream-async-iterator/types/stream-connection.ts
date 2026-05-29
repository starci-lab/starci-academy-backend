/** Transport-agnostic streaming connection wrapped by the async-iterator helper. */
export interface StreamConnection<TData> {
    /** Opens the connection (may do async work like connect/subscribe); resolves once open. */
    onOpen(handler: () => void | Promise<void>): Promise<void>
    /** Registers the handler invoked for each incoming data chunk. */
    onData(handler: (data: TData) => void | Promise<void>): void
    /** Registers the handler invoked when the connection emits an error. */
    onError(handler: (error: Error) => void | Promise<void>): void
    /** Registers the handler invoked once when the connection closes. */
    onClose(handler: () => void | Promise<void>): void
    /** Closes the connection and releases its resources. */
    close(): Promise<void>
}