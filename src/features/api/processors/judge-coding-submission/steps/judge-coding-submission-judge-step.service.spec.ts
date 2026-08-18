import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
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
    Judge0StatusId,
} from "@modules/integrations/judge0/enums/judge0-status"
import {
    CodingLanguageNotSupportedException,
} from "@modules/platform/exceptions/errors/coding/coding-language-not-supported"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    writeActivity,
} from "@modules/bussiness/activity/write-activity"
import {
    enqueueLearnerEmail,
} from "@modules/integrations/transactional-email/enqueue-learner-email"
import {
    writeXpHistory,
} from "../../ai/shared/xp/write-xp-history"
import {
    JudgeCodingSubmissionJudgeStepService,
} from "./judge-coding-submission-judge-step.service"
import type {
    Judge0SubmissionResult,
} from "@modules/integrations/judge0/types/judge0"

jest.mock("../../ai/shared/xp/write-xp-history",
    () => ({
        writeXpHistory: jest.fn(),
    }))

jest.mock("@modules/bussiness/activity/write-activity",
    () => ({
        writeActivity: jest.fn(),
    }))

jest.mock("@modules/integrations/transactional-email/enqueue-learner-email",
    () => ({
        enqueueLearnerEmail: jest.fn(),
    }))

/** One testcase row as the worker loads it into the extended context. */
interface TestcaseSeed {
    /** Evaluation order of the case. */
    orderIndex: number
    /** Whether the case is a public sample (drives IO exposure). */
    isSample: boolean
    /** stdin fed to the program. */
    input: string
    /** Expected stdout. */
    expectedOutput: string
}

/** Build one normalized Judge0 result row. */
const judge0Result = (
    statusId: Judge0StatusId,
    overrides: Partial<Judge0SubmissionResult> = {
    },
): Judge0SubmissionResult => ({
    token: `token-${statusId}`,
    statusId,
    statusDescription: "desc",
    stdout: "actual",
    stderr: null,
    compileOutput: null,
    timeMs: 10,
    memoryKb: 2048,
    ...overrides,
})

describe("JudgeCodingSubmissionJudgeStepService",
    () => {
        let entityManager: EntityManagerMock
        let jobActionService: {
            increaseJob: jest.Mock
            saveExecutionResult: jest.Mock
        }
        let judge0Service: { judgeBatch: jest.Mock }
        let winstonService: { log: jest.Mock }
        let codingProgressService: { invalidate: jest.Mock }
        let enqueueSendMailJobService: { enqueue: jest.Mock }
        let notificationService: { createNotification: jest.Mock }
        let service: JudgeCodingSubmissionJudgeStepService

        /** Build the extended job context the step reads. */
        const makeContext = (
            overrides: {
                language?: string
                priorVerdict?: CodingVerdict
                testcases?: Array<TestcaseSeed>
                /** `null` models a job row that never got an id. */
                jobId?: string | null
            } = {
            },
        ) => {
            const submission = {
                id: "submission-1",
                userId: "user-1",
                language: overrides.language ?? "python",
                sourceCode: "print(1)",
                verdict: overrides.priorVerdict ?? CodingVerdict.Pending,
            }
            const problem = {
                id: "problem-1",
                title: "Two Sum",
                timeLimitMs: 2000,
                memoryLimitKb: 65536,
                points: 30,
            }
            const testcases = overrides.testcases ?? [
                {
                    orderIndex: 0,
                    isSample: true,
                    input: "1 2",
                    expectedOutput: "3",
                },
                {
                    orderIndex: 1,
                    isSample: false,
                    input: "secret-in",
                    expectedOutput: "secret-out",
                },
            ]
            return {
                job: {
                    id: overrides.jobId === null ? undefined : overrides.jobId ?? "job-1",
                    fencingToken: 1,
                },
                queueName: "judge-coding-submission",
                payload: {
                    codingSubmissionId: "submission-1",
                },
                extended: {
                    submission,
                    problem,
                    testcases,
                },
            }
        }

        /** Read the per-case rows the step serialized onto the submission. */
        const persistedPerCase = (
            context: ReturnType<typeof makeContext>,
        ): Array<Record<string, unknown>> =>
            JSON.parse(
                String((context.extended.submission as unknown as {
                    perCaseResults: string
                }).perCaseResults),
            ) as Array<Record<string, unknown>>

        beforeEach(() => {
            jest.clearAllMocks()
            entityManager = makeEntityManagerMock()
            // first solve by default: only the just-saved Accepted row exists, no reveal
            entityManager.count.mockResolvedValue(0)
            jobActionService = {
                increaseJob: jest.fn(),
                saveExecutionResult: jest.fn(),
            }
            judge0Service = {
                judgeBatch: jest.fn().mockResolvedValue({
                    results: [
                        judge0Result(Judge0StatusId.Accepted),
                        judge0Result(Judge0StatusId.Accepted),
                    ],
                }),
            }
            winstonService = {
                log: jest.fn(),
            }
            codingProgressService = {
                invalidate: jest.fn(),
            }
            enqueueSendMailJobService = {
                enqueue: jest.fn(),
            }
            notificationService = {
                createNotification: jest.fn(),
            }
            service = new JudgeCodingSubmissionJudgeStepService(
                entityManager as never,
                jobActionService as never,
                judge0Service as never,
                winstonService as never,
                codingProgressService as never,
                enqueueSendMailJobService as never,
                notificationService as never,
            )
        })

        describe("building the Judge0 batch",
            () => {
                it("submits one run per testcase with the resolved language id and per-problem limits",
                    async () => {
                        const context = makeContext()

                        await service.process(context as never)

                        expect(judge0Service.judgeBatch).toHaveBeenCalledWith({
                            submissions: [
                                {
                                    sourceCode: "print(1)",
                                    // python resolves to Judge0 language id 71
                                    languageId: 71,
                                    stdin: "1 2",
                                    expectedOutput: "3",
                                    // 2000ms problem limit becomes 2s for Judge0
                                    cpuTimeLimitSeconds: 2,
                                    memoryLimitKb: 65536,
                                },
                                {
                                    sourceCode: "print(1)",
                                    languageId: 71,
                                    stdin: "secret-in",
                                    expectedOutput: "secret-out",
                                    cpuTimeLimitSeconds: 2,
                                    memoryLimitKb: 65536,
                                },
                            ],
                        })
                    })

                it("throws a typed exception when the submission language has no Judge0 mapping",
                    async () => {
                        const context = makeContext({
                            language: "brainfuck",
                        })

                        await expect(service.process(context as never)).rejects.toBeInstanceOf(
                            CodingLanguageNotSupportedException,
                        )
                        expect(judge0Service.judgeBatch).not.toHaveBeenCalled()
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })
            })

        describe("per-case results",
            () => {
                it("exposes IO for sample testcases only, keeping hidden testcase IO secret",
                    async () => {
                        const context = makeContext()

                        await service.process(context as never)

                        const perCase = persistedPerCase(context)
                        expect(perCase[0]).toEqual({
                            orderIndex: 0,
                            isSample: true,
                            verdict: CodingVerdict.Accepted,
                            timeMs: 10,
                            memoryKb: 2048,
                            input: "1 2",
                            expectedOutput: "3",
                            stdout: "actual",
                        })
                        // the hidden case carries verdict + timing and nothing else
                        expect(perCase[1]).toEqual({
                            orderIndex: 1,
                            isSample: false,
                            verdict: CodingVerdict.Accepted,
                            timeMs: 10,
                            memoryKb: 2048,
                        })
                    })
            })

        describe("verdict aggregation",
            () => {
                it("persists Accepted with peak timing when every testcase passes",
                    async () => {
                        judge0Service.judgeBatch.mockResolvedValue({
                            results: [
                                judge0Result(Judge0StatusId.Accepted,
                                    {
                                        timeMs: 12,
                                        memoryKb: 1000,
                                    }),
                                judge0Result(Judge0StatusId.Accepted,
                                    {
                                        timeMs: 40,
                                        memoryKb: 3000,
                                    }),
                            ],
                        })
                        const context = makeContext()

                        await service.process(context as never)

                        expect(context.extended.submission).toMatchObject({
                            verdict: CodingVerdict.Accepted,
                            passedCount: 2,
                            totalCount: 2,
                            // the peak across runs, not the last one
                            runtimeMs: 40,
                            memoryKb: 3000,
                            compileOutput: null,
                        })
                        expect(entityManager.save).toHaveBeenCalledWith(
                            CodingSubmissionEntity,
                            context.extended.submission,
                        )
                    })

                it("reports the first failing case's verdict when only some testcases pass",
                    async () => {
                        judge0Service.judgeBatch.mockResolvedValue({
                            results: [
                                judge0Result(Judge0StatusId.Accepted),
                                judge0Result(Judge0StatusId.WrongAnswer),
                                judge0Result(Judge0StatusId.TimeLimitExceeded),
                            ],
                        })
                        const context = makeContext({
                            testcases: [
                                {
                                    orderIndex: 0,
                                    isSample: true,
                                    input: "a",
                                    expectedOutput: "a",
                                },
                                {
                                    orderIndex: 1,
                                    isSample: false,
                                    input: "b",
                                    expectedOutput: "b",
                                },
                                {
                                    orderIndex: 2,
                                    isSample: false,
                                    input: "c",
                                    expectedOutput: "c",
                                },
                            ],
                        })

                        await service.process(context as never)

                        expect(context.extended.submission).toMatchObject({
                            verdict: CodingVerdict.WrongAnswer,
                            passedCount: 1,
                            totalCount: 3,
                        })
                    })

                it("surfaces the compiler message only on a compile error",
                    async () => {
                        judge0Service.judgeBatch.mockResolvedValue({
                            results: [
                                judge0Result(Judge0StatusId.CompilationError,
                                    {
                                        compileOutput: null,
                                    }),
                                judge0Result(Judge0StatusId.CompilationError,
                                    {
                                        compileOutput: "line 3: syntax error",
                                    }),
                            ],
                        })
                        const context = makeContext()

                        await service.process(context as never)

                        expect(context.extended.submission).toMatchObject({
                            verdict: CodingVerdict.CompileError,
                            // the first run that actually reported a message wins
                            compileOutput: "line 3: syntax error",
                        })
                    })

                it("leaves the compiler message null when a compile error reported none",
                    async () => {
                        judge0Service.judgeBatch.mockResolvedValue({
                            results: [
                                judge0Result(Judge0StatusId.CompilationError,
                                    {
                                        compileOutput: null,
                                    }),
                                judge0Result(Judge0StatusId.CompilationError,
                                    {
                                        compileOutput: null,
                                    }),
                            ],
                        })
                        const context = makeContext()

                        await service.process(context as never)

                        expect(context.extended.submission).toMatchObject({
                            verdict: CodingVerdict.CompileError,
                            compileOutput: null,
                        })
                    })

                it("collapses every runtime-crash sub-status onto the runtime-error verdict",
                    async () => {
                        judge0Service.judgeBatch.mockResolvedValue({
                            results: [
                                judge0Result(Judge0StatusId.RuntimeErrorSigsegv),
                                judge0Result(Judge0StatusId.Accepted),
                            ],
                        })
                        const context = makeContext()

                        await service.process(context as never)

                        expect(context.extended.submission).toMatchObject({
                            verdict: CodingVerdict.RuntimeError,
                            passedCount: 1,
                        })
                    })

                it("reports null timing when no run reported a time or memory figure",
                    async () => {
                        judge0Service.judgeBatch.mockResolvedValue({
                            results: [
                                judge0Result(Judge0StatusId.Accepted,
                                    {
                                        timeMs: null,
                                        memoryKb: null,
                                    }),
                                judge0Result(Judge0StatusId.Accepted,
                                    {
                                        timeMs: null,
                                        memoryKb: null,
                                    }),
                            ],
                        })
                        const context = makeContext()

                        await service.process(context as never)

                        expect(context.extended.submission).toMatchObject({
                            runtimeMs: null,
                            memoryKb: null,
                        })
                    })
            })

        describe("first-solve reward",
            () => {
                it("awards XP and writes a home-feed activity on a first clean Accepted solve",
                    async () => {
                        const context = makeContext()

                        await service.process(context as never)

                        expect(writeXpHistory).toHaveBeenCalledWith({
                            entityManager,
                            userId: "user-1",
                            // coding is course-agnostic
                            courseId: null,
                            source: XpSource.Coding,
                            amount: 30,
                            points: expect.any(Number),
                            // the submission id keeps the ledger credit idempotent
                            refId: "submission-1",
                        })
                        expect(writeActivity).toHaveBeenCalledWith({
                            entityManager,
                            userId: "user-1",
                            type: ActivityType.CodingSolved,
                            idempotencyKey: "codingSolved:user-1:problem-1",
                            metadata: {
                                target: {
                                    entityName: "CodingProblemEntity",
                                    id: "problem-1",
                                    label: "Two Sum",
                                },
                            },
                        })
                    })

                it("awards nothing when the problem was already solved before",
                    async () => {
                        // the just-saved row plus an earlier Accepted submission
                        entityManager.count.mockResolvedValue(2)
                        const context = makeContext()

                        await service.process(context as never)

                        expect(writeXpHistory).not.toHaveBeenCalled()
                        expect(writeActivity).not.toHaveBeenCalled()
                        // it never even looks for a reveal once a prior solve is found
                        expect(entityManager.count).toHaveBeenCalledTimes(1)
                    })

                it("forfeits the award when the reference solution was revealed first",
                    async () => {
                        entityManager.count.mockImplementation(
                            async (entity: unknown) => (
                                entity === CodingSolutionRevealEntity ? 1 : 1
                            ),
                        )
                        const context = makeContext()

                        await service.process(context as never)

                        expect(entityManager.count).toHaveBeenCalledTimes(2)
                        expect(writeXpHistory).not.toHaveBeenCalled()
                        expect(writeActivity).not.toHaveBeenCalled()
                    })

                it("awards nothing when the submission was not accepted",
                    async () => {
                        judge0Service.judgeBatch.mockResolvedValue({
                            results: [
                                judge0Result(Judge0StatusId.WrongAnswer),
                                judge0Result(Judge0StatusId.WrongAnswer),
                            ],
                        })
                        const context = makeContext()

                        await service.process(context as never)

                        expect(entityManager.count).not.toHaveBeenCalled()
                        expect(writeXpHistory).not.toHaveBeenCalled()
                    })

                it("always drops the solver's cached coding progress",
                    async () => {
                        const context = makeContext()

                        await service.process(context as never)

                        expect(codingProgressService.invalidate).toHaveBeenCalledWith({
                            userId: "user-1",
                        })
                    })
            })

        describe("learner notification",
            () => {
                it.each([
                    CodingVerdict.Pending,
                    CodingVerdict.Judging,
                ])("emails and notifies on the first terminal verdict after %s",
                    async (priorVerdict: CodingVerdict) => {
                        const context = makeContext({
                            priorVerdict,
                        })

                        await service.process(context as never)

                        expect(enqueueLearnerEmail).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: "user-1",
                                template: "coding-result",
                                extraContext: {
                                    verdict: CodingVerdict.Accepted,
                                    verdictLabel: "Accepted",
                                    passedCount: 2,
                                    totalCount: 2,
                                },
                            }),
                        )
                        expect(notificationService.createNotification).toHaveBeenCalledWith({
                            userId: "user-1",
                            type: NotificationType.CodingGraded,
                            title: {
                                key: "notification.codingGraded.title",
                                params: {
                                    title: "Two Sum",
                                    verdictLabel: "Accepted",
                                },
                            },
                            target: {
                                entityName: "CodingSubmissionEntity",
                                id: "submission-1",
                                label: "Two Sum",
                            },
                        })
                    })

                it("does not re-notify when an already-judged submission is judged again",
                    async () => {
                        const context = makeContext({
                            priorVerdict: CodingVerdict.WrongAnswer,
                        })

                        await service.process(context as never)

                        expect(enqueueLearnerEmail).not.toHaveBeenCalled()
                        expect(notificationService.createNotification).not.toHaveBeenCalled()
                        // the verdict was still recomputed and persisted
                        expect(entityManager.save).toHaveBeenCalled()
                    })

                it("falls back to the raw verdict when no human label exists for it",
                    async () => {
                        judge0Service.judgeBatch.mockResolvedValue({
                            results: [
                                // a non-terminal status maps to `judging`, which has no label
                                judge0Result(Judge0StatusId.InQueue),
                                judge0Result(Judge0StatusId.Accepted),
                            ],
                        })
                        const context = makeContext()

                        await service.process(context as never)

                        expect(enqueueLearnerEmail).toHaveBeenCalledWith(
                            expect.objectContaining({
                                extraContext: expect.objectContaining({
                                    verdict: CodingVerdict.Judging,
                                    verdictLabel: CodingVerdict.Judging,
                                }),
                            }),
                        )
                        expect(notificationService.createNotification).toHaveBeenCalledWith(
                            expect.objectContaining({
                                title: {
                                    key: "notification.codingGraded.title",
                                    params: {
                                        title: "Two Sum",
                                        verdictLabel: CodingVerdict.Judging,
                                    },
                                },
                            }),
                        )
                    })

                it("logs and continues when the in-app notification write fails",
                    async () => {
                        notificationService.createNotification.mockRejectedValue(
                            new Error("notification store down"),
                        )
                        const context = makeContext()

                        await expect(service.process(context as never)).resolves.toBeUndefined()

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.NotificationCreateFailed,
                            {
                                jobId: "job-1",
                                queueName: "judge-coding-submission",
                                step: "judge",
                                error: "notification store down",
                            },
                        )
                        // the step still advanced despite the notification failure
                        expect(jobActionService.increaseJob).toHaveBeenCalled()
                    })

                it("stringifies a non-Error notification failure and reports an absent job id as empty",
                    async () => {
                        notificationService.createNotification.mockRejectedValue("boom")
                        const context = makeContext({
                            jobId: null,
                        })

                        await service.process(context as never)

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.NotificationCreateFailed,
                            expect.objectContaining({
                                jobId: "",
                                error: "boom",
                            }),
                        )
                    })
            })

        describe("finalize",
            () => {
                it("advances the step and stores the summary in one transaction, then logs success",
                    async () => {
                        const context = makeContext()

                        await service.process(context as never)

                        expect(entityManager.transaction).toHaveBeenCalledTimes(1)
                        expect(jobActionService.increaseJob).toHaveBeenCalledWith({
                            job: context.job,
                            entityManager,
                        })
                        expect(jobActionService.saveExecutionResult).toHaveBeenCalledWith({
                            job: context.job,
                            key: "judge",
                            executionResult: {
                                verdict: CodingVerdict.Accepted,
                                passedCount: 2,
                                totalCount: 2,
                                runtimeMs: 10,
                                memoryKb: 2048,
                            },
                            entityManager,
                        })
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.JobExecutedSuccessfully,
                            {
                                jobId: "job-1",
                                queueName: "judge-coding-submission",
                                payload: context.payload,
                            },
                        )
                    })

                it("reports an absent job id as an empty string in the success log",
                    async () => {
                        const context = makeContext({
                            jobId: null,
                        })

                        await service.process(context as never)

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.JobExecutedSuccessfully,
                            expect.objectContaining({
                                jobId: "",
                            }),
                        )
                    })
            })
    })
