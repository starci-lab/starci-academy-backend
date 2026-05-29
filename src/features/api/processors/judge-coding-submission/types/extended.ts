import {
    CodingProblemEntity,
    CodingProblemTestcaseEntity,
    CodingSubmissionEntity,
} from "@modules/databases"

/** Extended context for the judge-coding-submission pipeline, loaded by the worker. */
export interface ExtendedJudgeCodingSubmissionContext {
    /** The submission row being judged (carries language + source + problem id). */
    submission: CodingSubmissionEntity
    /** The target problem (limits, slug). */
    problem: CodingProblemEntity
    /** All testcases for the problem, in evaluation order (samples + hidden). */
    testcases: Array<CodingProblemTestcaseEntity>
}
