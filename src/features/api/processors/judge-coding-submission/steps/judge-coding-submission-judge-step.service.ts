import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    writeActivity,
} from "@modules/bussiness/activity/write-activity"
import {
    CodingProgressService,
} from "@modules/bussiness/coding/coding-progress.service"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    FLAT_POINTS,
} from "../../ai/shared/xp/points-config"
import {
    writeXpHistory,
} from "../../ai/shared/xp/write-xp-history"
import {
    enqueueLearnerEmail,
} from "@modules/integrations/transactional-email/enqueue-learner-email"
import type {
    JudgeCodingSubmissionPayload,
} from "@modules/integrations/bullmq/types/payloads/judge-coding-submission"
import {
    CodingSolutionRevealEntity,
} from "@modules/databases/postgresql/primary/entities/coding-solution-reveal.entity"
import {
    CodingSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/coding-submission.entity"
import {
    ActivityType,
} from "@modules/databases/postgresql/primary/enums/activity-type"
import {
    CodingVerdict,
} from "@modules/databases/postgresql/primary/enums/coding-verdict"
import {
    NotificationType,
} from "@modules/databases/postgresql/primary/enums/notification-type"
import {
    XpSource,
} from "@modules/databases/postgresql/primary/enums/xp-source"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    Judge0Service,
} from "@modules/integrations/judge0/judge0.service"
import {
    mapJudge0StatusToVerdict,
} from "@modules/integrations/judge0/utils/map-verdict"
import type {
    Judge0SubmissionInput,
    Judge0SubmissionResult,
} from "@modules/integrations/judge0/types/judge0"
import {
    CodingLanguageNotSupportedException,
} from "@modules/platform/exceptions/errors/coding/coding-language-not-supported"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"
import type {
    CodingProblemTestcaseEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem-testcase.entity"
import type {
    CodingPerCaseResult,
    JudgeCodingSubmissionJudgeStepExecuteResult,
} from "../types/execute"
import type {
    ExtendedJudgeCodingSubmissionContext,
} from "../types/extended"

@Injectable()
/**
 * Step 0: build one Judge0 run per testcase, submit the batch, wait for terminal
 * results, aggregate them into a verdict + timing, and persist everything to the
 * `coding_submissions` row. Hidden-testcase IO is never written into the
 * client-facing per-case results.
 */
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
        private readonly enqueueSendMailJobService: EnqueueSendMailJobService,
        private readonly notificationService: NotificationService,
    ) {
        super()
    }

    /** Human-readable verdict labels for the result email (English source copy). */
    private static readonly VERDICT_LABELS: Record<string, string> = {
        accepted: "Accepted",
        wrongAnswer: "Wrong answer",
        timeLimitExceeded: "Time limit exceeded",
        memoryLimitExceeded: "Memory limit exceeded",
        runtimeError: "Runtime error",
        compileError: "Compile error",
        internalError: "Internal error",
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
        // a missing mapping is a configuration error -- fail fast with a typed exception
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
        // capture the prior verdict so we only email on the FIRST terminal result
        // (a re-judge of an already-judged submission must not re-notify)
        const priorVerdict = submission.verdict
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
                problem,
                submission.id)
        }
        // solved/attempted/points may have changed -> drop the user's progress cache
        await this.codingProgressService.invalidate({
            userId: submission.userId,
        })
        // notify the solver on the FIRST terminal verdict (skip re-judge re-notification)
        const wasPending = priorVerdict === CodingVerdict.Pending
            || priorVerdict === CodingVerdict.Judging
        if (wasPending) {
            await enqueueLearnerEmail({
                entityManager: this.entityManager,
                enqueueSendMailJobService: this.enqueueSendMailJobService,
                userId: submission.userId,
                template: "coding-result",
                webBaseUrl: envConfig().web.baseUrl,
                subject: {
                    vi: "Bài coding của bạn đã có kết quả", // vn-ok: vi-locale string emitted to clients
                    en: "Your coding submission has a verdict",
                },
                extraContext: {
                    verdict,
                    verdictLabel:
                        JudgeCodingSubmissionJudgeStepService.VERDICT_LABELS[verdict] ?? verdict,
                    passedCount,
                    totalCount: perCaseResults.length,
                },
            })
            // best-effort in-app notification (bell) for the same first-terminal-verdict
            // moment; must never fail the already-persisted judge result
            try {
                await this.notificationService.createNotification({
                    userId: submission.userId,
                    type: NotificationType.CodingGraded,
                    title: {
                        key: "notification.codingGraded.title",
                        params: {
                            title: problem.title,
                            verdictLabel:
                                JudgeCodingSubmissionJudgeStepService.VERDICT_LABELS[verdict]
                                    ?? verdict,
                        },
                    },
                    target: {
                        entityName: CodingSubmissionEntity.name,
                        id: submission.id,
                        label: problem.title,
                    },
                })
            } catch (error) {
                this.winstonService.log(
                    WinstonLog.NotificationCreateFailed,
                    {
                        jobId: context.job.id ?? "",
                        queueName: context.queueName,
                        step: this.stepName,
                        error: error instanceof Error ? error.message : String(error),
                    },
                )
            }
        }
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
        // all passed -> Accepted
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
     * Credit the problem's points to the user on a FIRST clean solve: only when no
     * earlier Accepted submission exists for the problem (so each problem awards
     * once) and the user did NOT reveal its reference solution before solving (a
     * reveal row forfeits the points). The award is routed through the XP ledger
     * (`writeXpHistory` with `source = coding`), which writes the `xp_histories`
     * row (feeding the global "Points" figure, derived live from the ledger) AND
     * credits `users.coin_balance` (by the flat coding reward) in one idempotent call.
     *
     * @param userId - the solver's user id
     * @param problem - the solved problem (carries its point value)
     * @param submissionId - the just-saved Accepted submission id (stable ledger refId)
     */
    private async awardPointsIfEligible(
        userId: string,
        problem: CodingProblemEntity,
        submissionId: string,
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
        // first clean solve -> record a coding XP ledger row (feeds the global
        // "Points" figure, derived live from xp_histories) and credit
        // users.coin_balance (flat coding reward). Coding is course-agnostic (no course id).
        // refId = the submission id (unique + stable): the (source, refId) unique
        // key keeps the credit idempotent even if this step is re-run.
        await writeXpHistory({
            entityManager: this.entityManager,
            userId,
            courseId: null,
            source: XpSource.Coding,
            amount: problem.points,
            points: FLAT_POINTS.codingSolved,
            refId: submissionId,
        })
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
