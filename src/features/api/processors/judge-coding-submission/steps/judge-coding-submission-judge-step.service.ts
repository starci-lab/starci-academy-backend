import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    AbstractStepService,
    CodingProgressService,
    JobActionService,
    JobExtendedContext,
    writeActivity,
} from "@modules/bussiness"
import type {
    JudgeCodingSubmissionPayload,
} from "@modules/bullmq"
import {
    ActivityType,
    CodingSolutionRevealEntity,
    CodingSubmissionEntity,
    CodingVerdict,
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    Judge0Service,
    mapJudge0StatusToVerdict,
} from "@modules/judge0"
import type {
    Judge0SubmissionInput,
    Judge0SubmissionResult,
} from "@modules/judge0"
import {
    CodingLanguageNotSupportedException,
} from "@modules/exceptions"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    CodingProblemEntity,
} from "@modules/databases"
import type {
    CodingProblemTestcaseEntity,
} from "@modules/databases"
import type {
    ExtendedJudgeCodingSubmissionContext,
    CodingPerCaseResult,
    JudgeCodingSubmissionJudgeStepExecuteResult,
} from "../types"

/**
 * Step 0: build one Judge0 run per testcase, submit the batch, wait for terminal
 * results, aggregate them into a verdict + timing, and persist everything to the
 * `coding_submissions` row. Hidden-testcase IO is never written into the
 * client-facing per-case results.
 */
@Injectable()
export class JudgeCodingSubmissionJudgeStepService extends AbstractStepService<
    JudgeCodingSubmissionPayload,
    ExtendedJudgeCodingSubmissionContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly judge0Service: Judge0Service,
        private readonly winstonService: WinstonService,
        private readonly codingProgressService: CodingProgressService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "judge"

    /**
     * Process the judging step.
     * @param context - extended job context (submission + problem + testcases)
     */
    async process(
        context: JobExtendedContext<
            JudgeCodingSubmissionPayload,
            ExtendedJudgeCodingSubmissionContext
        >,
    ): Promise<void> {
        // run the submission against every testcase and aggregate the outcome
        const executionResult = await this.execute(context)
        // persist the step result + advance the job step counter
        await this.finalize(executionResult,
            context)
    }

    /**
     * Build + run the Judge0 batch and persist the verdict to the submission.
     * @param context - extended job context
     * @returns the aggregated step summary
     */
    private async execute(
        context: JobExtendedContext<
            JudgeCodingSubmissionPayload,
            ExtendedJudgeCodingSubmissionContext
        >,
    ): Promise<JudgeCodingSubmissionJudgeStepExecuteResult> {
        // pull the loaded entities out of the extended context
        const { submission, problem, testcases } = context.extended
        // resolve the Judge0 numeric language id for the submission's language
        const languageId = envConfig().judge0.languageIds[submission.language]
        // a missing mapping is a configuration error — fail fast with a typed exception
        if (languageId === undefined) {
            throw new CodingLanguageNotSupportedException({
                language: submission.language,
            })
        }
        // one Judge0 run per testcase, reusing the same source + per-problem limits
        const judge0Submissions: Array<Judge0SubmissionInput> = testcases.map((testcase) => ({
            sourceCode: submission.sourceCode,
            languageId,
            stdin: testcase.input,
            expectedOutput: testcase.expectedOutput,
            // Judge0 cpu_time_limit is in seconds; problem limit is stored in ms
            cpuTimeLimitSeconds: problem.timeLimitMs / 1000,
            memoryLimitKb: problem.memoryLimitKb,
        }))
        // submit the batch and block until every run is terminal (or timeout throws)
        const { results } = await this.judge0Service.judgeBatch({
            submissions: judge0Submissions,
        })
        // pair each testcase with its result (Judge0 preserves input order) and map verdicts
        const perCaseResults = this.buildPerCaseResults(testcases,
            results)
        // derive the aggregate verdict + counters + peak timing from the per-case data
        const verdict = this.aggregateVerdict(perCaseResults)
        const passedCount = perCaseResults.filter(
            (perCase) => perCase.verdict === CodingVerdict.Accepted,
        ).length
        const runtimeMs = this.maxOf(results.map((result) => result.timeMs))
        const memoryKb = this.maxOf(results.map((result) => result.memoryKb))
        // surface the compiler message only when the source failed to compile
        const compileOutput = verdict === CodingVerdict.CompileError
            ? results.find((result) => result.compileOutput !== null)?.compileOutput ?? null
            : null
        // write the terminal outcome back onto the submission row
        submission.verdict = verdict
        submission.passedCount = passedCount
        submission.totalCount = perCaseResults.length
        submission.runtimeMs = runtimeMs
        submission.memoryKb = memoryKb
        submission.compileOutput = compileOutput
        // store per-case detail as serialized JSON (sample IO only)
        submission.perCaseResults = JSON.stringify(perCaseResults)
        // persist the updated submission
        await this.entityManager.save(CodingSubmissionEntity,
            submission)
        // award coding points on a first clean Accepted solve
        if (verdict === CodingVerdict.Accepted) {
            await this.awardPointsIfEligible(submission.userId,
                problem)
        }
        // solved/attempted/points may have changed → drop the user's progress cache
        await this.codingProgressService.invalidate({
            userId: submission.userId,
        })
        // return the summary for the step execution-result store
        return {
            verdict,
            passedCount,
            totalCount: perCaseResults.length,
            runtimeMs,
            memoryKb,
        }
    }

    /**
     * Pair testcases with Judge0 results into client-safe per-case rows.
     * Sample testcases include their IO; hidden testcases expose verdict + timing only.
     */
    private buildPerCaseResults(
        testcases: Array<CodingProblemTestcaseEntity>,
        results: Array<Judge0SubmissionResult>,
    ): Array<CodingPerCaseResult> {
        // map index-aligned testcase/result pairs into the per-case shape
        return testcases.map((testcase, index) => {
            // the result at the same position (Judge0 keeps batch order)
            const result = results[index]
            // map this run's Judge0 status into our canonical verdict
            const verdict = mapJudge0StatusToVerdict(result.statusId)
            // base row exposed for every testcase (no IO)
            const perCase: CodingPerCaseResult = {
                orderIndex: testcase.orderIndex,
                isSample: testcase.isSample,
                verdict,
                timeMs: result.timeMs,
                memoryKb: result.memoryKb,
            }
            // only attach IO for sample testcases so hidden cases stay secret
            if (testcase.isSample) {
                perCase.input = testcase.input
                perCase.expectedOutput = testcase.expectedOutput
                perCase.stdout = result.stdout
            }
            return perCase
        })
    }

    /**
     * Aggregate per-case verdicts into one submission verdict: Accepted only if
     * every case passed; otherwise the verdict of the first failing case (which
     * naturally yields CompileError when the shared source failed to compile).
     */
    private aggregateVerdict(perCaseResults: Array<CodingPerCaseResult>): CodingVerdict {
        // all passed → Accepted
        const allAccepted = perCaseResults.every(
            (perCase) => perCase.verdict === CodingVerdict.Accepted,
        )
        if (allAccepted) {
            return CodingVerdict.Accepted
        }
        // otherwise report the first non-accepted case's verdict (in evaluation order)
        const firstFailing = perCaseResults.find(
            (perCase) => perCase.verdict !== CodingVerdict.Accepted,
        )
        // there must be a failing case here since not all were accepted
        return firstFailing?.verdict ?? CodingVerdict.InternalError
    }

    /** Max of a list of nullable numbers, or null when none are present. */
    private maxOf(values: Array<number | null>): number | null {
        // keep only the reported (non-null) values
        const present = values.filter((value): value is number => value !== null)
        // null when nothing was reported, else the largest
        return present.length === 0 ? null : Math.max(...present)
    }

    /**
     * Credit the problem's points to the user's cumulative coding score on a
     * FIRST clean solve: only when no earlier Accepted submission exists for the
     * problem (so each problem awards once) and the user did NOT reveal its
     * reference solution before solving (a reveal row forfeits the points).
     *
     * @param userId - the solver's user id
     * @param problem - the solved problem (carries its point value)
     */
    private async awardPointsIfEligible(
        userId: string,
        problem: CodingProblemEntity,
    ): Promise<void> {
        // the just-saved Accepted submission is included here, so exactly 1 means
        // this is the first solve; >1 means a prior solve already awarded points
        const acceptedCount = await this.entityManager.count(CodingSubmissionEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                    problem: {
                        id: problem.id,
                    },
                    verdict: CodingVerdict.Accepted,
                },
            })
        if (acceptedCount > 1) {
            return
        }
        // revealing the reference solution before solving forfeits the points
        const revealedCount = await this.entityManager.count(CodingSolutionRevealEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                    problem: {
                        id: problem.id,
                    },
                },
            })
        if (revealedCount > 0) {
            return
        }
        // first clean solve → add the problem's points to the user's coding score
        await this.entityManager.increment(
            UserEntity,
            {
                id: userId,
            },
            "codingPoints",
            problem.points,
        )
        // home-feed activity for the first solve (idempotent on user+problem)
        await writeActivity({
            entityManager: this.entityManager,
            userId,
            type: ActivityType.CodingSolved,
            idempotencyKey: `codingSolved:${userId}:${problem.id}`,
            metadata: {
                target: {
                    entityName: CodingProblemEntity.name,
                    id: problem.id,
                    label: problem.title,
                },
            },
        })
    }

    /**
     * Advance the job step counter and persist the step's execution result.
     * @param executionResult - the aggregated judge summary
     * @param context - extended job context
     */
    private async finalize(
        executionResult: JudgeCodingSubmissionJudgeStepExecuteResult,
        context: JobExtendedContext<
            JudgeCodingSubmissionPayload,
            ExtendedJudgeCodingSubmissionContext
        >,
    ): Promise<void> {
        // destructure the bits we need for persistence + logging
        const { job, payload, queueName } = context
        // do the step bump + result save in one transaction
        await this.entityManager.transaction(async (entityManager) => {
            // advance currentStep so the worker loop exits and completes the job
            await this.jobActionService.increaseJob({
                job,
                entityManager,
            })
            // store the summary under the step name for observability
            await this.jobActionService.saveExecutionResult({
                job,
                key: this.stepName,
                executionResult,
                entityManager,
            })
        })
        // structured log of the step outcome
        this.winstonService.log(
            WinstonLog.JobExecutedSuccessfully,
            {
                jobId: job.id ?? "",
                queueName,
                payload,
            },
        )
    }
}
