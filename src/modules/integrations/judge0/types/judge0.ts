import type {
    Judge0StatusId,
} from "../enums/judge0-status"

/**
 * A single program-run request for Judge0: the user's source, the language,
 * the stdin to feed, and the expected stdout Judge0 compares against. Limits
 * are per-run. All fields are plain values; the service base64-encodes the
 * text fields before sending.
 */
export interface Judge0SubmissionInput {
    /** Source code to compile/run. */
    sourceCode: string
    /** Judge0 numeric language id (resolved from {@link CodingLanguage}). */
    languageId: number
    /** Standard input fed to the program. */
    stdin: string
    /** Expected standard output Judge0 compares stdout against. */
    expectedOutput: string
    /** CPU time limit for this run, in seconds (Judge0 `cpu_time_limit`). */
    cpuTimeLimitSeconds: number
    /** Memory limit for this run, in kilobytes (Judge0 `memory_limit`). */
    memoryLimitKb: number
}

/** A Judge0 batch-submission token used to fetch results later. */
export interface Judge0Token {
    /** Opaque token identifying one submission in the batch. */
    token: string
}

/**
 * Normalized result of one Judge0 submission. Text fields are already decoded
 * from base64 by the service. `timeMs`/`memoryKb` are null until the run is
 * terminal.
 */
export interface Judge0SubmissionResult {
    /** Token this result belongs to. */
    token: string
    /** Final/in-flight Judge0 status id. */
    statusId: Judge0StatusId
    /** Human-readable status description from Judge0 (e.g. "Accepted"). */
    statusDescription: string
    /** Decoded stdout, or null when absent. */
    stdout: string | null
    /** Decoded stderr, or null when absent. */
    stderr: string | null
    /** Decoded compiler output, or null when absent. */
    compileOutput: string | null
    /** Wall/CPU time of the run in milliseconds, or null when not reported. */
    timeMs: number | null
    /** Peak memory of the run in kilobytes, or null when not reported. */
    memoryKb: number | null
}

/** Params for {@link Judge0Service.submitBatch}. */
export interface SubmitBatchParams {
    /** The submissions to enqueue in a single Judge0 batch. */
    submissions: Array<Judge0SubmissionInput>
}

/** Params for {@link Judge0Service.judgeBatch} (submit + poll to completion). */
export interface JudgeBatchParams {
    /** The submissions to run and wait for terminal results. */
    submissions: Array<Judge0SubmissionInput>
}

/** Result of {@link Judge0Service.judgeBatch}. */
export interface JudgeBatchResult {
    /** Terminal results, in the same order as the input submissions. */
    results: Array<Judge0SubmissionResult>
}

/** Params for the internal single Judge0 HTTP request helper. */
export interface Judge0RequestParams {
    /** HTTP method (GET/POST). */
    method: string
    /** Path appended to the configured Judge0 base url (may include query string). */
    path: string
    /** Optional JSON body; serialized when present. */
    body?: unknown
}

/** Raw nested `status` object as returned by Judge0. */
export interface Judge0RawStatus {
    /** Numeric status id. */
    id?: number
    /** Human-readable status description. */
    description?: string
}

/** Raw single submission entry from a Judge0 batch-results response. */
export type Judge0RawSubmission = Record<string, unknown>

/** Raw shape of the Judge0 GET `/submissions/batch` response. */
export interface Judge0GetBatchResponse {
    /** One raw submission per requested token. */
    submissions: Array<Judge0RawSubmission>
}
