/** Params for running a shell command. */
export interface ExecParams {
    command: string
    args?: Array<string>
    /** When set and positive, passed to execa as `timeout` (milliseconds). */
    timeoutMs?: number
    env?: Record<string, string>
}

/** Params for running a command and streaming stdout to a file (no buffering). */
export interface ExecToFileParams extends ExecParams {
    /** Destination path for stdout stream. */
    stdoutPath: string
}

/** Params for validating exec input before spawn. */
export interface AssertValidExecParams {
    command: string
    args: Array<string>
    timeoutMs?: number
}

/** Coerced shape of unknown subprocess errors for fallback handling. */
export interface ExecaUnknownProcessError {
    exitCode?: number
    stdout?: string
    stderr?: string
}

/** Command identity carried through error classification (shared by `exec` and `execToFile`). */
export interface ExecErrorContext {
    command: string
    args: Array<string>
    /** When set and positive, the timeout that was passed to execa. */
    timeoutMs?: number
}
