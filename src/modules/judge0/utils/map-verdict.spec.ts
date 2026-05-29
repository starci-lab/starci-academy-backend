import {
    CodingVerdict,
} from "@modules/databases"
import {
    Judge0StatusId,
} from "../enums"
import {
    isJudge0Terminal,
    mapJudge0StatusToVerdict,
} from "./map-verdict"

describe("mapJudge0StatusToVerdict",
    () => {
        it("maps queue/processing to Judging (non-terminal)",
            () => {
                // in-flight statuses surface as Judging
                expect(mapJudge0StatusToVerdict(Judge0StatusId.InQueue)).toBe(CodingVerdict.Judging)
                expect(mapJudge0StatusToVerdict(Judge0StatusId.Processing)).toBe(CodingVerdict.Judging)
            })

        it("maps the canonical terminal statuses",
            () => {
                // direct one-to-one mappings
                expect(mapJudge0StatusToVerdict(Judge0StatusId.Accepted)).toBe(CodingVerdict.Accepted)
                expect(mapJudge0StatusToVerdict(Judge0StatusId.WrongAnswer)).toBe(CodingVerdict.WrongAnswer)
                expect(mapJudge0StatusToVerdict(Judge0StatusId.TimeLimitExceeded)).toBe(CodingVerdict.TimeLimitExceeded)
                expect(mapJudge0StatusToVerdict(Judge0StatusId.CompilationError)).toBe(CodingVerdict.CompileError)
            })

        it("collapses every runtime-error sub-status into RuntimeError",
            () => {
                // all SIG*/NZEC/other runtime crashes share one verdict
                const runtimeStatuses = [
                    Judge0StatusId.RuntimeErrorSigsegv,
                    Judge0StatusId.RuntimeErrorSigxfsz,
                    Judge0StatusId.RuntimeErrorSigfpe,
                    Judge0StatusId.RuntimeErrorSigabrt,
                    Judge0StatusId.RuntimeErrorNzec,
                    Judge0StatusId.RuntimeErrorOther,
                ]
                runtimeStatuses.forEach((statusId) => {
                    expect(mapJudge0StatusToVerdict(statusId)).toBe(CodingVerdict.RuntimeError)
                })
            })

        it("maps infra failures to InternalError",
            () => {
                // judge-side failures are not the user's fault
                expect(mapJudge0StatusToVerdict(Judge0StatusId.InternalError)).toBe(CodingVerdict.InternalError)
                expect(mapJudge0StatusToVerdict(Judge0StatusId.ExecFormatError)).toBe(CodingVerdict.InternalError)
            })
    })

describe("isJudge0Terminal",
    () => {
        it("treats queue/processing as non-terminal",
            () => {
                // poller must keep waiting on these
                expect(isJudge0Terminal(Judge0StatusId.InQueue)).toBe(false)
                expect(isJudge0Terminal(Judge0StatusId.Processing)).toBe(false)
            })

        it("treats Accepted and beyond as terminal",
            () => {
                // any status id > Processing is a final outcome
                expect(isJudge0Terminal(Judge0StatusId.Accepted)).toBe(true)
                expect(isJudge0Terminal(Judge0StatusId.WrongAnswer)).toBe(true)
                expect(isJudge0Terminal(Judge0StatusId.InternalError)).toBe(true)
            })
    })
