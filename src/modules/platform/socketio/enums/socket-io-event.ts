/** Socket.IO event names. */
export enum SocketIoEvent {
    HelloWorldFromBE = "hello_world_from_be",
    // Autocomplete (client -> server)
    Autocomplete = "search.autocomplete",
    /** Global fuzzy search (client -> server). */
    GlobalSearch = "search.global_search",
    // Autocomplete (server -> client)
    AutocompleteResult = "search.autocomplete.result",
    // Job pipeline (server -> client)
    JobProcessing = "job.processing",
    JobCompleted = "job.completed",
    JobFailed = "job.failed",
    // Job pipeline (client -> server)
    JobSubscribe = "job.subscribe",
    JobUnsubscribe = "job.unsubscribe",
}
