import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    EmailBloomFilterService,
} from "./email.service"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    BloomFilterType,
    CacheKey,
} from "@modules/integrations/cache/enums/cache-key"
import {
    ScalableBloomFilter,
} from "bloom-filters"
import type {
    SetParams,
} from "@modules/integrations/cache/types/cache"

describe("EmailBloomFilterService",
    () => {
        let module: TestingModule
        let service: EmailBloomFilterService
        let cacheService: jest.Mocked<CacheService>

        const email = "starci183@example.com"

        beforeEach(async () => {
            // cache get/set stubs the test programs per-case
            cacheService = {
                get: jest.fn(),
                set: jest.fn(),
                del: jest.fn(),
            } as unknown as jest.Mocked<CacheService>

            module = await Test.createTestingModule({
                providers: [
                    EmailBloomFilterService,
                    {
                        provide: CacheService,
                        useValue: cacheService,
                    },
                ],
            }).compile()

            service = module.get<EmailBloomFilterService>(EmailBloomFilterService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("get",
            () => {
                it("returns whatever is cached without recreating it",
                    async () => {
                        const cached = {
                            scalableBloomFilter: new ScalableBloomFilter(),
                        }
                        cacheService.get.mockResolvedValueOnce(cached)

                        const result = await service.get()

                        expect(result).toBe(cached)
                        expect(cacheService.get).toHaveBeenCalledWith({
                            key: CacheKey.BloomFilter,
                            args: [
                                BloomFilterType.Email,
                            ],
                        })
                        // read-only: never writes back
                        expect(cacheService.set).not.toHaveBeenCalled()
                    })

                it("returns undefined without writing anything when nothing is cached",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)

                        const result = await service.get()

                        expect(result).toBeUndefined()
                        expect(cacheService.set).not.toHaveBeenCalled()
                    })
            })

        describe("add",
            () => {
                it("adds the email to an already-cached filter and re-persists it",
                    async () => {
                        const existingFilter = new ScalableBloomFilter()
                        cacheService.get.mockResolvedValueOnce({
                            scalableBloomFilter: existingFilter,
                        })

                        await service.add(email)

                        expect(existingFilter.has(email)).toBe(true)
                        expect(cacheService.set).toHaveBeenCalledWith({
                            key: CacheKey.BloomFilter,
                            args: [
                                BloomFilterType.Email,
                            ],
                            cacheResult: {
                                scalableBloomFilter: existingFilter,
                            },
                        })
                    })

                it("lazily creates an empty filter, adds the email, and persists it on a cache miss",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)

                        await service.add(email)

                        // loadOrCreate persists the fresh empty filter first...
                        expect(cacheService.set).toHaveBeenNthCalledWith(1,
                            {
                                key: CacheKey.BloomFilter,
                                args: [
                                    BloomFilterType.Email,
                                ],
                                cacheResult: {
                                    scalableBloomFilter: expect.any(ScalableBloomFilter),
                                },
                            })
                        // ...then add() persists it again with the email present
                        // jest.Mocked erases set()'s `K extends CacheKey` generic, so the
                        // recorded cacheResult widens to every key's payload; this service
                        // only ever writes CacheKey.BloomFilter
                        const secondCall = cacheService.set.mock.calls[1][0] as SetParams<CacheKey.BloomFilter>
                        expect(secondCall.cacheResult.scalableBloomFilter.has(email)).toBe(true)
                        expect(cacheService.set).toHaveBeenCalledTimes(2)
                    })
            })

        describe("addMultiple",
            () => {
                it("adds every email to an already-cached filter and re-persists it once",
                    async () => {
                        const existingFilter = new ScalableBloomFilter()
                        cacheService.get.mockResolvedValueOnce({
                            scalableBloomFilter: existingFilter,
                        })
                        const emails = [
                            "a@example.com",
                            "b@example.com",
                        ]

                        await service.addMultiple(emails)

                        expect(existingFilter.has("a@example.com")).toBe(true)
                        expect(existingFilter.has("b@example.com")).toBe(true)
                        // one write for the whole batch, not one per email
                        expect(cacheService.set).toHaveBeenCalledTimes(1)
                        expect(cacheService.set).toHaveBeenCalledWith({
                            key: CacheKey.BloomFilter,
                            args: [
                                BloomFilterType.Email,
                            ],
                            cacheResult: {
                                scalableBloomFilter: existingFilter,
                            },
                        })
                    })

                it("lazily creates the filter on a miss before adding the batch",
                    async () => {
                        cacheService.get.mockResolvedValueOnce(undefined)
                        const emails = [
                            "a@example.com",
                            "b@example.com",
                        ]

                        await service.addMultiple(emails)

                        // loadOrCreate's write, then addMultiple's write
                        expect(cacheService.set).toHaveBeenCalledTimes(2)
                        // same generic erasure as above -- narrow back to the bloom-filter key
                        const finalCall = cacheService.set.mock.calls[1][0] as SetParams<CacheKey.BloomFilter>
                        expect(finalCall.cacheResult.scalableBloomFilter.has("a@example.com")).toBe(true)
                        expect(finalCall.cacheResult.scalableBloomFilter.has("b@example.com")).toBe(true)
                    })

                it("handles an empty batch by persisting the filter unchanged",
                    async () => {
                        const existingFilter = new ScalableBloomFilter()
                        cacheService.get.mockResolvedValueOnce({
                            scalableBloomFilter: existingFilter,
                        })

                        await service.addMultiple([])

                        expect(cacheService.set).toHaveBeenCalledWith({
                            key: CacheKey.BloomFilter,
                            args: [
                                BloomFilterType.Email,
                            ],
                            cacheResult: {
                                scalableBloomFilter: existingFilter,
                            },
                        })
                    })
            })
    })
