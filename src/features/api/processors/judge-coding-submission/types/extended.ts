import {
    CodingProblemTestcaseEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem-testcase.entity"
import {
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"
import {
    CodingSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/coding-submission.entity"

/** Extended context for the judge-coding-submission pipeline, loaded by the worker. */
export interface ExtendedJudgeCodingSubmissionContext {
    /** The submission row being judged (carries language + source + problem id). */
    submission: CodingSubmissionEntity
    /** The target problem (limits, slug). */
    problem: CodingProblemEntity
    /** All testcases for the problem, in evaluation order (samples + hidden). */
    testcases: Array<CodingProblemTestcaseEntity>
}
