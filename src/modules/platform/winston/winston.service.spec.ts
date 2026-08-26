import {
    WinstonService,
} from "./winston.service"
import {
    WinstonLog,
} from "./enums/winston-log"

describe("WinstonService",
    () => {
        const consoleLogger = {
            info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn(), verbose: jest.fn(),
        }
        const lokiLogger = {
            info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn(), verbose: jest.fn(),
        }
        const combinedLogger = {
            info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn(), verbose: jest.fn(),
        }
        const service = new WinstonService(consoleLogger as never,
lokiLogger as never,
combinedLogger as never)

        beforeEach(() => {
            jest.clearAllMocks()
        })

        it("uses the configured combined logger and removes undefined fields",
            () => {
                service.log(WinstonLog.JobExecutedSuccessfully,
{
    jobId: "job-1",
    result: "ok",
    error: undefined,
} as never)

                expect(combinedLogger.debug).toHaveBeenCalledWith(
                    WinstonLog.JobExecutedSuccessfully,
                    {
                        jobId: "job-1", result: "ok"
                    },
                )
            })

        it("routes error-level events to error",
            () => {
                service.log(WinstonLog.JobExecutedFailed,
{
    jobId: "job-2",
    error: "failed",
} as never)

                expect(combinedLogger.error).toHaveBeenCalledWith(
                    WinstonLog.JobExecutedFailed,
                    {
                        jobId: "job-2", error: "failed"
                    },
                )
                expect(combinedLogger.info).not.toHaveBeenCalled()
            })

        it("routes warning and verbose events to their matching logger methods",
            () => {
                service.log(WinstonLog.InitSeederEntitySkipped,
                    {
                        entity: "course",
                        error: "invalid markdown",
                    } as never)
                service.log(WinstonLog.CoursesSeededSuccessfully,
                    {
                        count: 3,
                    } as never)

                expect(combinedLogger.warn).toHaveBeenCalledWith(
                    WinstonLog.InitSeederEntitySkipped,
                    {
                        entity: "course",
                        error: "invalid markdown",
                    },
                )
                expect(combinedLogger.verbose).toHaveBeenCalledWith(
                    WinstonLog.CoursesSeededSuccessfully,
                    {
                        count: 3,
                    },
                )
            })

        it("routes informational events to info",
            () => {
                service.log(WinstonLog.CdnSynchronizerCdnSyncStarted,
                    {
                        courseCount: 1,
                    } as never)

                expect(combinedLogger.info).toHaveBeenCalledWith(
                    WinstonLog.CdnSynchronizerCdnSyncStarted,
                    {
                        courseCount: 1,
                    },
                )
            })

        it("removes undefined fields from informational events",
            () => {
                service.log(WinstonLog.CdnSynchronizerCdnSyncStarted,
{
    courseCount: 2,
    optional: undefined,
} as never)
                expect(combinedLogger.info).toHaveBeenCalledWith(
                    WinstonLog.CdnSynchronizerCdnSyncStarted,
                    {
                        courseCount: 2,
                    },
                )
            })
    })
