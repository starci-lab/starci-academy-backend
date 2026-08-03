/** Params for getting a logger. */
export interface GetLoggerParams {
    /** Whether to use the console transport. */
    console?: boolean
    /** Whether to use the Loki transport. */
    loki?: boolean
}