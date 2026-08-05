/** Socket.IO event names. */
export enum SocketIoEvent {
    /** Server greeting after handshake — client knows the socket is live. */
    HelloWorldFromBE = "hello_world_from_be",
    // Autocomplete (client -> server)
    /** Client asks for typeahead suggestions; server replies on AutocompleteResult. */
    Autocomplete = "search.autocomplete",
    /** Global fuzzy search (client -> server). */
    GlobalSearch = "search.global_search",
    // Autocomplete (server -> client)
    /** Server returns typeahead hits for the preceding Autocomplete request. */
    AutocompleteResult = "search.autocomplete.result",
    // Job pipeline (server -> client)
    /** Server signals the subscribed job entered processing so the client spinner starts. */
    JobProcessing = "job.processing",
    /** Server signals the subscribed job finished so the client can show the result. */
    JobCompleted = "job.completed",
    /** Server signals the subscribed job failed so the client can surface the error. */
    JobFailed = "job.failed",
    // Job pipeline (client -> server)
    /** Client joins a job room; later JobProcessing/Completed/Failed events are delivered. */
    JobSubscribe = "job.subscribe",
    /** Client leaves a job room so it stops receiving that job's lifecycle events. */
    JobUnsubscribe = "job.unsubscribe",
}
