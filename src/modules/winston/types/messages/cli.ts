/** Generic CLI command outcome (Nest Commander, scripts, etc.). */
export interface CommandLogMessage {
    /** Human-readable status text. */
    message?: string
    /** Error detail when the command failed. */
    error?: string
    /** Machine-readable error code when available (e.g. custom exceptions). */
    code?: string
}
