import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
import {
    WinstonLog
} from "@modules/platform/winston/enums/winston-log"
import {
    ProcessResolveGithubUpdateUserStepService
} from "./process-resolve-github-update-user-step.service"

describe("ProcessResolveGithubUpdateUserStepService",
    () => {
        const makeContext = (id?: string) => ({
            job: {
                id,
            },
            payload: {
                userId: "user-1",
                githubUsername: "octocat",
                teamSlug: "backend",
            },
            queueName: "resolve-github",
        })

        it("updates the user and records the successful step in a transaction",
            async () => {
                const user = {
                    id: "user-1",
                    githubUsername: "old-name",
                }
                const findOne = jest.fn().mockResolvedValue(user)
                const save = jest.fn().mockResolvedValue(user)
                const transaction = jest.fn().mockImplementation(
                    async (callback: (manager: object) => Promise<unknown>) => callback({
                    }),
                )
                const increaseJob = jest.fn().mockResolvedValue(undefined)
                const saveExecutionResult = jest.fn().mockResolvedValue(undefined)
                const log = jest.fn()
                const service = new ProcessResolveGithubUpdateUserStepService(
            {
                findOne,
                save,
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

                await service.process(makeContext("job-1") as never)

                expect(findOne).toHaveBeenCalledWith(expect.anything(),
                    {
                        where: {
                            id: "user-1",
                        },
                    })
                expect(user.githubUsername).toBe("octocat")
                expect(save).toHaveBeenCalledWith(user)
                expect(increaseJob).toHaveBeenCalledWith(expect.objectContaining({
                    job: {
                        id: "job-1",
                    },
                }))
                expect(saveExecutionResult).toHaveBeenCalledWith(expect.objectContaining({
                    key: "update-user",
                    executionResult: {
                    },
                }))
                expect(log).toHaveBeenCalledWith(WinstonLog.ProcessStepExecuted,
                    expect.objectContaining({
                        jobId: "job-1",
                        success: true,
                    }))
            })

        it("uses an empty job id when the queue job has no id",
            async () => {
                const transaction = jest.fn().mockImplementation(
                    async (callback: (manager: object) => Promise<unknown>) => callback({
                    }),
                )
                const log = jest.fn()
                const service = new ProcessResolveGithubUpdateUserStepService(
            {
                findOne: jest.fn().mockResolvedValue({
                    id: "user-1",
                }),
                save: jest.fn().mockResolvedValue(undefined),
                transaction,
            } as never,
            {
                increaseJob: jest.fn().mockResolvedValue(undefined),
                saveExecutionResult: jest.fn().mockResolvedValue(undefined),
            } as never,
            {
                log,
            } as never,
                )

                await service.process(makeContext() as never)

                expect(log).toHaveBeenCalledWith(WinstonLog.ProcessStepExecuted,
                    expect.objectContaining({
                        jobId: "",
                    }))
            })

        it("rejects before saving when the user does not exist",
            async () => {
                const save = jest.fn()
                const transaction = jest.fn()
                const service = new ProcessResolveGithubUpdateUserStepService(
            {
                findOne: jest.fn().mockResolvedValue(null),
                save,
                transaction,
            } as never,
            {
                increaseJob: jest.fn(),
                saveExecutionResult: jest.fn(),
            } as never,
            {
                log: jest.fn(),
            } as never,
                )

                await expect(service.process(makeContext("job-2") as never))
                    .rejects.toBeInstanceOf(UserNotFoundException)
                expect(save).not.toHaveBeenCalled()
                expect(transaction).not.toHaveBeenCalled()
            })
    })
