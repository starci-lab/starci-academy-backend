import {
    CodingVerdict,
} from "@modules/databases/postgresql/primary/enums/coding-verdict"
import {
    Judge0StatusId,
} from "../enums/judge0-status"

/**
 * Map a single Judge0 status id to the canonical {@link CodingVerdict}.
 *
 * All runtime-error sub-statuses (SIGSEGV/SIGFPE/NZEC/...) collapse to
 * {@link CodingVerdict.RuntimeError}; queue/processing statuses are treated as
 * {@link CodingVerdict.Judging} (non-terminal); unknown ids fall back to
 * {@link CodingVerdict.InternalError}.
 *
 * @param statusId - Judge0 `status_id` for one submission
 * @returns The mapped verdict for that single testcase run
 */
export const mapJudge0StatusToVerdict = (statusId: Judge0StatusId): CodingVerdict => {
    // branch on the terminal status id Judge0 reported for the run
    switch (statusId) {
    // queued/executing are non-terminal -- report as still judging
    case Judge0StatusId.InQueue:
    case Judge0StatusId.Processing:
        return CodingVerdict.Judging
    // stdout matched expected_output exactly
    case Judge0StatusId.Accepted:
        return CodingVerdict.Accepted
    // ran but produced the wrong output
    case Judge0StatusId.WrongAnswer:
        return CodingVerdict.WrongAnswer
    // exceeded the per-run cpu time budget
    case Judge0StatusId.TimeLimitExceeded:
        return CodingVerdict.TimeLimitExceeded
    // source failed to compile (compiled languages)
    case Judge0StatusId.CompilationError:
        return CodingVerdict.CompileError
    // every runtime-crash sub-status collapses into a single RuntimeError verdict
    case Judge0StatusId.RuntimeErrorSigsegv:
    case Judge0StatusId.RuntimeErrorSigxfsz:
    case Judge0StatusId.RuntimeErrorSigfpe:
    case Judge0StatusId.RuntimeErrorSigabrt:
    case Judge0StatusId.RuntimeErrorNzec:
    case Judge0StatusId.RuntimeErrorOther:
        return CodingVerdict.RuntimeError
    // infra-level failures unrelated to the user's code
    case Judge0StatusId.InternalError:
    case Judge0StatusId.ExecFormatError:
        return CodingVerdict.InternalError
    // any future/unknown id is safest treated as an internal error
    default:
        return CodingVerdict.InternalError
    }
}

/**
 * True when a Judge0 status id represents a terminal (finished) run -- i.e. the
 * batch poller can stop waiting on this submission.
 *
 * @param statusId - Judge0 `status_id` for one submission
 * @returns Whether the run has reached a final state
 */
export const isJudge0Terminal = (statusId: Judge0StatusId): boolean => {
    // ids greater than Processing (2) are all final outcomes in Judge0
    return statusId > Judge0StatusId.Processing
}
