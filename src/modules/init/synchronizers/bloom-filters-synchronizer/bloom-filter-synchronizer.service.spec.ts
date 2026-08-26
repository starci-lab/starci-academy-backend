import {
    envConfig,
} from "@modules/platform/env/config"
import {
    CacheKey,
    BloomFilterType,
} from "@modules/integrations/cache/enums/cache-key"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    BloomFilterSynchronizerService,
} from "./bloom-filter-synchronizer.service"

jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn(() => ({
            cache: {
                ttl: {
                    bloomFilter: 60
                }
            },
            services: {
                synchronizer: {
                    emailBloomFilter: {
                        process: {
                            batchSize: 2
                        }
                    }
                }
            },
        }))
    }))

describe("BloomFilterSynchronizerService",
    () => {
        const mockedEnvConfig = jest.mocked(envConfig)
        const dayjs = {
            now: jest.fn(() => ({
                diff: jest.fn(() => 12)
            })),
        }
        const logger = {
            log: jest.fn()
        }
        const entityManager = {
            find: jest.fn()
        }
        const emailFilter = {
            addMultiple: jest.fn()
        }
        const cache = {
            get: jest.fn(), set: jest.fn()
        }
        const service = new BloomFilterSynchronizerService(
        dayjs as never,
logger as never,
entityManager as never,
emailFilter as never,
cache as never,
        )

        beforeEach(() => {
            jest.clearAllMocks()
            mockedEnvConfig.mockReturnValue({
                services: {
                    synchronizer: {
                        emailBloomFilter: {
                            process: {
                                batchSize: 2
                            }
                        }
                    }
                },
            } as ReturnType<typeof envConfig>)
        })

        it("creates a missing filter and syncs email batches until the query is empty",
            async () => {
                cache.get.mockResolvedValue(undefined)
                entityManager.find
                    .mockResolvedValueOnce([{
                        id: "a", email: "a@test"
                    },
                    {
                        id: "b", email: null
                    }])
                    .mockResolvedValueOnce([])

                await service.sync()

                expect(cache.get).toHaveBeenCalledWith({
                    key: CacheKey.BloomFilter, args: [BloomFilterType.Email]
                })
                expect(cache.set).toHaveBeenCalledWith(expect.objectContaining({
                    key: CacheKey.BloomFilter
                }))
                expect(emailFilter.addMultiple).toHaveBeenCalledWith(["a@test",
                    ""])
                expect(logger.log).toHaveBeenCalledWith(WinstonLog.BloomFilterSynchronizerFilterCreated,
                    expect.anything())
                expect(logger.log).toHaveBeenCalledWith(WinstonLog.BloomFilterSynchronizerEmailsSynced,
                    {
                        totalEmails: 2
                    })
            })

        it("continues after a failed batch and reports the existing filter",
            async () => {
                cache.get.mockResolvedValue({
                    existing: true
                })
                entityManager.find
                    .mockResolvedValueOnce([{
                        id: "a", email: "a@test"
                    }])
                    .mockResolvedValueOnce([])
                emailFilter.addMultiple.mockRejectedValueOnce(new Error("filter unavailable"))

                await service.sync()

                expect(cache.set).not.toHaveBeenCalled()
                expect(logger.log).toHaveBeenCalledWith(WinstonLog.BloomFilterSynchronizerFilterAlreadyExists,
                    expect.anything())
                expect(logger.log).toHaveBeenCalledWith(WinstonLog.BloomFilterSynchronizerEntitySyncFailed,
                    expect.objectContaining({
                        error: "filter unavailable"
                    }))
                expect(logger.log).toHaveBeenCalledWith(WinstonLog.BloomFilterSynchronizerEmailsSynced,
                    {
                        totalEmails: 0
                    })
            })
    })
