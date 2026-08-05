import {
    registerEnumType,
} from "@nestjs/graphql"
import {
    createEnumType,
} from "@modules/lib/common/utils/enum"

/**
 * Final (or in-flight) judging verdict of a coding submission.
 * Mirrors the canonical online-judge verdict set; values are stable wire/DB
 * strings. Judge0 per-testcase status descriptions are normalized into these.
 */
export enum CodingVerdict {
    /** Submission row created, judging job not yet started. */
    Pending = "pending",
    /** Judging in progress -- Judge0 batch submitted, awaiting results. */
    Judging = "judging",
    /** All testcases passed. */
    Accepted = "accepted",
    /** At least one testcase produced output that did not match the expected output. */
    WrongAnswer = "wrongAnswer",
    /** A testcase exceeded the per-run CPU time limit. */
    TimeLimitExceeded = "timeLimitExceeded",
    /** A testcase exceeded the per-run memory limit. */
    MemoryLimitExceeded = "memoryLimitExceeded",
    /** The program crashed at runtime (non-zero exit / signal) on a testcase. */
    RuntimeError = "runtimeError",
    /** The source failed to compile (compiled languages only). */
    CompileError = "compileError",
    /** Judge0 / pipeline error unrelated to the user's code (infra failure). */
    InternalError = "internalError",
}

/** GraphQL enum wrapper for {@link CodingVerdict}. */
export const GraphQLTypeCodingVerdict = createEnumType(CodingVerdict)

registerEnumType(
    GraphQLTypeCodingVerdict,
    {
        name: "CodingVerdict",
        description: "Judging verdict of a coding submission.",
        valuesMap: {
            [CodingVerdict.Pending]: {
                description: "Submission created, not yet judged.",
            },
            [CodingVerdict.Judging]: {
                description: "Judging in progress.",
            },
            [CodingVerdict.Accepted]: {
                description: "All testcases passed.",
            },
            [CodingVerdict.WrongAnswer]: {
                description: "Output did not match on at least one testcase.",
            },
            [CodingVerdict.TimeLimitExceeded]: {
                description: "Exceeded the time limit on a testcase.",
            },
            [CodingVerdict.MemoryLimitExceeded]: {
                description: "Exceeded the memory limit on a testcase.",
            },
            [CodingVerdict.RuntimeError]: {
                description: "Program crashed at runtime on a testcase.",
            },
            [CodingVerdict.CompileError]: {
                description: "Source failed to compile.",
            },
            [CodingVerdict.InternalError]: {
                description: "Infrastructure/judge error unrelated to user code.",
            },
        },
    },
)
