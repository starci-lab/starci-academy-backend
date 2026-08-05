import {
    Injectable,
} from "@nestjs/common"
import {
    envConfig,
} from "@modules/env"
import {
    getJudge0AuthToken,
} from "@modules/filesystem"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    Judge0RequestFailedException,
    Judge0TimedOutException,
} from "@modules/exceptions"
import {
    Judge0StatusId,
} from "./enums"
import {
    isJudge0Terminal,
} from "./utils"
import type {
    Judge0Token,
    Judge0SubmissionResult,
    SubmitBatchParams,
    JudgeBatchParams,
    JudgeBatchResult,
    Judge0RequestParams,
    Judge0RawStatus,
    Judge0RawSubmission,
    Judge0GetBatchResponse,
} from "./types"

@Injectable()
/**
 * Thin client over the self-hosted Judge0 REST API. Responsible for encoding
 * submissions, submitting them as a batch, polling until every run is terminal,
 * and decoding the results into {@link Judge0SubmissionResult}. It knows nothing
 * about coding problems or verdicts -- that mapping lives in the judging worker.
 *
 * @example
 * const { results } = await judge0Service.judgeBatch({ submissions })
 */
export class Judge0Service {
    /** Cached `X-Auth-Token`; read lazily once from the mount file. */
    private cachedAuthToken: string | null = null

    constructor(
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Submit a batch of runs to Judge0 and return their tokens (no waiting).
     *
     * @param params - the submissions to enqueue
     * @returns one token per submission, in input order
     */
    async submitBatch({ submissions }: SubmitBatchParams): Promise<Array<Judge0Token>> {
        // map each domain input to the base64-encoded Judge0 wire shape
        const body = {
            submissions: submissions.map((submission) => ({
                // numeric language id Judge0 understands
                language_id: submission.languageId,
                // text fields are base64 to survive arbitrary bytes / newlines
                source_code: this.encode(submission.sourceCode),
                stdin: this.encode(submission.stdin),
                expected_output: this.encode(submission.expectedOutput),
                // Judge0 expects cpu_time_limit in seconds
                cpu_time_limit: submission.cpuTimeLimitSeconds,
                // and memory_limit in kilobytes
                memory_limit: submission.memoryLimitKb,
            })),
        }
        // POST the batch; base64_encoded=true tells Judge0 our text is encoded
        const tokens = await this.request<Array<Judge0Token>>({
            method: "POST",
            path: "/submissions/batch?base64_encoded=true",
            body,
        })
        // hand back the tokens for later polling
        return tokens
    }

    /**
     * Fetch the current state of a set of tokens from Judge0 (one poll).
     *
     * @param tokens - tokens returned by {@link submitBatch}
     * @returns normalized, base64-decoded results in token order
     */
    async getBatch(tokens: Array<string>): Promise<Array<Judge0SubmissionResult>> {
        // request only the fields we consume to keep payloads small
        const fields = "token,status,stdout,stderr,compile_output,time,memory"
        // join tokens for the query string
        const joined = tokens.join(",")
        // GET the batch state
        const response = await this.request<Judge0GetBatchResponse>({
            method: "GET",
            path: `/submissions/batch?base64_encoded=true&fields=${fields}&tokens=${joined}`,
        })
        // normalize each raw submission into our typed shape
        return response.submissions.map((submission) => this.normalize(submission))
    }

    /**
     * Submit a batch and poll until every run reaches a terminal state, under a
     * HARD wall-clock cap ({@link envConfig().judge0.overallTimeoutMs}, default
     * 10s). Whichever settles first wins: terminal results, or the timeout. This
     * is the entrypoint the judging worker uses.
     *
     * @param params - the submissions to run
     * @returns terminal results in input order
     * @throws Judge0TimedOutException when judging exceeds the wall-clock budget
     */
    async judgeBatch({ submissions }: JudgeBatchParams): Promise<JudgeBatchResult> {
        // hard end-to-end budget for the whole judging call
        const { overallTimeoutMs } = envConfig().judge0
        // hold the timer handle so the race can cancel it once it settles
        let timeoutHandle: NodeJS.Timeout | undefined
        // wall-clock cap -- rejects if judging outruns the hard budget no matter
        // how Judge0 (or a hung HTTP request) behaves
        const timeout = new Promise<never>((_resolve, reject) => {
            timeoutHandle = setTimeout(
                () => {
                    reject(new Judge0TimedOutException({
                        attempts: 0,
                        pendingCount: 0,
                    }))
                },
                overallTimeoutMs,
            )
        })
        try {
            // race the poll loop against the wall-clock cap -- first to settle wins
            return await Promise.race([
                this.pollUntilTerminal(submissions),
                timeout,
            ])
        } finally {
            // clear the timer so a fast success never leaves a dangling timeout
            // keeping the event loop alive (also fixes jest open-handle warnings)
            if (timeoutHandle) {
                clearTimeout(timeoutHandle)
            }
        }
    }

    /**
     * Submit the batch then poll until every run is terminal or the poll-attempt
     * budget is exhausted. The hard wall-clock cap is enforced separately by the
     * wall-clock timer in {@link judgeBatch}.
     */
    private async pollUntilTerminal(
        submissions: JudgeBatchParams["submissions"],
    ): Promise<JudgeBatchResult> {
        // read polling tunables from env
        const { pollIntervalMs, maxPollAttempts } = envConfig().judge0
        // enqueue the batch and capture tokens in order
        const tokens = (await this.submitBatch({
            submissions
        })).map((entry) => entry.token)
        // poll up to the configured number of attempts
        for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
            // wait between polls (also delays the very first read so Judge0 can start)
            await this.sleep(pollIntervalMs)
            // fetch the latest state for all tokens
            const results = await this.getBatch(tokens)
            // stop as soon as every run is terminal (status_id > Processing)
            const allTerminal = results.every((result) => isJudge0Terminal(result.statusId))
            if (allTerminal) {
                return {
                    results
                }
            }
        }
        // budget exhausted -- surface a typed timeout with how many are still pending
        const finalResults = await this.getBatch(tokens)
        const pendingCount = finalResults.filter(
            (result) => !isJudge0Terminal(result.statusId),
        ).length
        throw new Judge0TimedOutException({
            attempts: maxPollAttempts,
            pendingCount,
        })
    }

    /**
     * Perform a single Judge0 HTTP request with auth header + timeout, parsing
     * the JSON body. Any non-2xx response or transport error is normalized into
     * {@link Judge0RequestFailedException}.
     */
    private async request<TResponse>({
        method,
        path,
        body,
    }: Judge0RequestParams): Promise<TResponse> {
        // resolve base url + per-request timeout
        const { baseUrl, requestTimeoutMs } = envConfig().judge0
        // full url for the call
        const url = `${baseUrl}${path}`
        try {
            // issue the request; AbortSignal.timeout enforces the per-call budget
            const response = await fetch(url,
                {
                    method,
                    headers: this.buildHeaders(),
                    body: body === undefined ? undefined : JSON.stringify(body),
                    signal: AbortSignal.timeout(requestTimeoutMs),
                })
            // treat any non-2xx as a hard failure with a truncated body for debugging
            if (!response.ok) {
                const text = await response.text().catch(() => "")
                throw new Judge0RequestFailedException({
                    endpoint: path,
                    statusCode: response.status,
                    responseBody: text.slice(0,
                        500),
                })
            }
            // parse and return the typed JSON payload
            return (await response.json()) as TResponse
        } catch (error) {
            // re-throw our own typed exception untouched
            if (error instanceof Judge0RequestFailedException) {
                throw error
            }
            // normalize transport/timeout/parse errors at this boundary
            const normalized = error instanceof Error ? error : new Error(String(error))
            this.winstonService.log(WinstonLog.IntegrationCallFailed,
                {
                    op: "integration.judge0.request-failed",
                    error: normalized.message,
                    meta: {
                        path,
                    },
                })
            throw new Judge0RequestFailedException({
                endpoint: path,
                originalError: normalized,
            })
        }
    }

    /** Build request headers, attaching the auth token only when one exists. */
    private buildHeaders(): Record<string, string> {
        // base headers -- we always send/receive JSON
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        }
        // attach the Judge0 auth header only if a token is configured
        const token = this.authToken()
        if (token) {
            headers["X-Auth-Token"] = token
        }
        return headers
    }

    /** Lazily read and cache the auth token from the mount file. */
    private authToken(): string {
        // read once; subsequent calls reuse the cached value
        if (this.cachedAuthToken === null) {
            this.cachedAuthToken = getJudge0AuthToken()
        }
        return this.cachedAuthToken
    }

    /** Base64-encode a UTF-8 string for the Judge0 wire format. */
    private encode(value: string): string {
        // Judge0 expects base64 when base64_encoded=true
        return Buffer.from(value,
            "utf8").toString("base64")
    }

    /** Base64-decode a Judge0 field back to a UTF-8 string, or null when empty. */
    private decode(value: unknown): string | null {
        // Judge0 omits/empties absent fields -- treat those as null
        if (typeof value !== "string" || value.length === 0) {
            return null
        }
        return Buffer.from(value,
            "base64").toString("utf8")
    }

    /** Normalize one raw Judge0 batch submission into {@link Judge0SubmissionResult}. */
    private normalize(submission: Judge0RawSubmission): Judge0SubmissionResult {
        // status is a nested object { id, description }
        const status = (submission.status ?? {
        }) as Judge0RawStatus
        // time is reported in seconds as a string (e.g. "0.012"); convert to ms
        const rawTime = submission.time
        const timeMs = typeof rawTime === "string" && rawTime.length > 0
            ? Math.round(Number.parseFloat(rawTime) * 1000)
            : null
        // memory is reported in KB as a number
        const rawMemory = submission.memory
        const memoryKb = typeof rawMemory === "number" ? rawMemory : null
        return {
            // token is plain text (not base64)
            token: typeof submission.token === "string" ? submission.token : "",
            // fall back to InternalError if Judge0 omitted a status id
            statusId: (status.id ?? Judge0StatusId.InternalError) as Judge0StatusId,
            statusDescription: status.description ?? "",
            // decode the base64 text fields
            stdout: this.decode(submission.stdout),
            stderr: this.decode(submission.stderr),
            compileOutput: this.decode(submission.compile_output),
            timeMs,
            memoryKb,
        }
    }

    /** Promise-based delay used between polls. */
    private sleep(ms: number): Promise<void> {
        // resolve after the given delay
        return new Promise((resolve) => setTimeout(resolve,
            ms))
    }
}
