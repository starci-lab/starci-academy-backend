import {
    WinstonLog
} from "@modules/platform/winston/enums/winston-log"
import {
    ProcessSendMailCompleteStepService
} from "./process-send-mail-complete-step.service"

describe("ProcessSendMailCompleteStepService",
    () => {
        const context = {
            job: {
                id: "mail-job",
            },
            payload: {
                to: [
                    {
                        address: "user@example.com",
                    },
                ],
                subject: "Welcome",
            },
            queueName: "send-mail",
        }

        it("advances the job and persists the empty completion result",
            async () => {
                const transaction = jest.fn().mockImplementation(
                    async (callback: (manager: object) => Promise<unknown>) => callback({
                    }),
                )
                const increaseJob = jest.fn().mockResolvedValue(undefined)
                const saveExecutionResult = jest.fn().mockResolvedValue(undefined)
                const log = jest.fn()
                const service = new ProcessSendMailCompleteStepService(
            {
                transaction,
            } as never,
            {
                increaseJob,
                saveExecutionResult,
            } as never,
            {
                log,
            } as never,
                )

                await service.process(context as never)

                expect(transaction).toHaveBeenCalledTimes(1)
                expect(increaseJob).toHaveBeenCalledWith(expect.objectContaining({
                    job: context.job,
                }))
                expect(saveExecutionResult).toHaveBeenCalledWith(expect.objectContaining({
                    key: "complete",
                    executionResult: {
                    },
                }))
                expect(log).toHaveBeenCalledWith(WinstonLog.ProcessStepExecuted,
                    expect.objectContaining({
                        jobId: "mail-job",
                        queueName: "send-mail",
                        step: "complete",
                        success: true,
                    }))
            })

        it("does not log completion when the transaction fails",
            async () => {
                const failure = new Error("database unavailable")
                const transaction = jest.fn().mockRejectedValue(failure)
                const log = jest.fn()
                const service = new ProcessSendMailCompleteStepService(
            {
                transaction,
            } as never,
            {
                increaseJob: jest.fn(),
                saveExecutionResult: jest.fn(),
            } as never,
            {
                log,
            } as never,
                )

                await expect(service.process(context as never)).rejects.toBe(failure)
                expect(log).not.toHaveBeenCalled()
            })
    })
