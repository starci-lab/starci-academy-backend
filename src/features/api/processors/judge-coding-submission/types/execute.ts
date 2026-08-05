import {
    CodingVerdict,
} from "@modules/databases"

/**
 * Per-testcase judging detail. Input/expected/stdout are populated ONLY for
 * sample testcases -- hidden testcases expose just the verdict + timing so the
 * judging IO never leaks to the client.
 */
export interface CodingPerCaseResult {
    /** Evaluation order of the testcase (matches `coding_problem_testcases.order_index`). */
    orderIndex: number
    /** Whether this testcase is a public sample. */
    isSample: boolean
    /** Verdict for this single testcase run. */
    verdict: CodingVerdict
    /** Run time in milliseconds, or null when not reported. */
    timeMs: number | null
    /** Peak memory in kilobytes, or null when not reported. */
    memoryKb: number | null
    /** Sample-only: the stdin fed to the program. */
    input?: string | null
    /** Sample-only: the expected stdout. */
    expectedOutput?: string | null
    /** Sample-only: the program's actual stdout. */
    stdout?: string | null
}

/**
 * Summary outcome of the judge step. Persisted to the submission row AND stored
 * as the step's execution result for observability.
 */
export interface JudgeCodingSubmissionJudgeStepExecuteResult {
    /** Aggregate verdict across all testcases. */
    verdict: CodingVerdict
    /** Number of testcases that passed. */
    passedCount: number
    /** Total testcases evaluated. */
    totalCount: number
    /** Max run time across testcases in milliseconds, or null. */
    runtimeMs: number | null
    /** Max memory across testcases in kilobytes, or null. */
    memoryKb: number | null
}
