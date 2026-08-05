// Side-effect import: load the elasticsearch barrel first to dodge the cqrs
// barrel load-order cycle (see courses/course/course.handler.spec.ts for details).
import "@modules/elasticsearch"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    CheckEmailExistsHandler,
} from "./check-email-exists.handler"
import {
    CheckEmailExistsQuery,
} from "./check-email-exists.query"
import {
    CacheService,
} from "@modules/cache"

describe("CheckEmailExistsHandler",
    () => {
        let module: TestingModule
        let handler: CheckEmailExistsHandler
        let cacheService: jest.Mocked<Pick<CacheService, "get">>

        beforeEach(async () => {
            cacheService = {
                get: jest.fn(),
            } as unknown as jest.Mocked<Pick<CacheService, "get">>

            module = await Test.createTestingModule({
                providers: [
                    CheckEmailExistsHandler,
                    {
                        provide: CacheService,
                        useValue: cacheService,
                    },
                ],
            }).compile()

            handler = module.get<CheckEmailExistsHandler>(CheckEmailExistsHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("returns not-ready/not-exists for a blank email (never hits the cache)",
            async () => {
                const result = await handler.execute(
                    new CheckEmailExistsQuery({
                        request: {
                            email: "   ",
                        },
                    }),
                )

                expect(result).toEqual({
                    exists: false,
                    isBloomFilterReady: false,
                })
                expect(cacheService.get).not.toHaveBeenCalled()
            })

        it("reports not-ready when the bloom filter is absent from the cache",
            async () => {
                // cache miss -> the filter has not been built yet
                cacheService.get.mockResolvedValueOnce(null)

                const result = await handler.execute(
                    new CheckEmailExistsQuery({
                        request: {
                            email: "user@example.com",
                        },
                    }),
                )

                expect(result).toEqual({
                    exists: false,
                    isBloomFilterReady: false,
                })
            })

        it("normalizes the email and probes the bloom filter when it is ready",
            async () => {
                const has = jest.fn(() => true)
                cacheService.get.mockResolvedValueOnce({
                    scalableBloomFilter: {
                        has,
                    },
                })

                const result = await handler.execute(
                    new CheckEmailExistsQuery({
                        request: {
                            email: "  User@Example.COM ",
                        },
                    }),
                )

                expect(result).toEqual({
                    exists: true,
                    isBloomFilterReady: true,
                })
                // email is trimmed + lower-cased before the membership probe
                expect(has).toHaveBeenCalledWith("user@example.com")
            })
    })
