/**
 * Judge0 submission status ids (Judge0 CE `statuses` table). A submission is
 * terminal once its `status_id` is greater than {@link Judge0StatusId.Processing};
 * everything from {@link Judge0StatusId.Accepted} onward is a final outcome.
 */
export enum Judge0StatusId {
    /** Queued, not yet picked up by a worker. */
    InQueue = 1,
    /** Currently executing. */
    Processing = 2,
    /** Program ran and stdout matched expected_output. */
    Accepted = 3,
    /** Program ran but stdout did not match expected_output. */
    WrongAnswer = 4,
    /** Exceeded the cpu_time_limit. */
    TimeLimitExceeded = 5,
    /** Source failed to compile. */
    CompilationError = 6,
    /** Runtime crash -- segmentation fault (SIGSEGV). */
    RuntimeErrorSigsegv = 7,
    /** Runtime crash -- output file size limit (SIGXFSZ). */
    RuntimeErrorSigxfsz = 8,
    /** Runtime crash -- floating point exception (SIGFPE). */
    RuntimeErrorSigfpe = 9,
    /** Runtime crash -- aborted (SIGABRT). */
    RuntimeErrorSigabrt = 10,
    /** Runtime crash -- non-zero exit code (NZEC). */
    RuntimeErrorNzec = 11,
    /** Runtime crash -- other cause. */
    RuntimeErrorOther = 12,
    /** Judge0 internal error (infrastructure, not user code). */
    InternalError = 13,
    /** Sandbox could not execute the compiled artifact (exec format error). */
    ExecFormatError = 14,
}
