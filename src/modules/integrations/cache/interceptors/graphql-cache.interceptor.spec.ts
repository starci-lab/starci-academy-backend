import {
    GraphQLCacheInterceptor
} from "./graphql-cache.interceptor"
import {
    of, firstValueFrom
} from "rxjs"
describe("GraphQLCacheInterceptor",
    () => { const context = (config: unknown, args: unknown[] = [null,
        {
            id: "a"
        },
        {
            id: "u"
        }]) => ({
        getHandler: jest.fn().mockReturnValue("handler"), getArgs: jest.fn().mockReturnValue(args), reflector: {
            get: jest.fn().mockReturnValue(config)
        }
    }); it("returns successful cache hits and evicts failed payloads",
        async () => { const cache = {
            get: jest.fn().mockResolvedValue({
                success: true, value: 1
            }), del: jest.fn(), set: jest.fn()
        }; const i = new GraphQLCacheInterceptor({
            get: jest.fn().mockReturnValue({
                key: "k", argsExtractor: jest.fn().mockReturnValue(["a"])
            })
        } as never,
cache as never); const result = await i.intercept(context(null,
            []).reflector ? context(null,
                []) as never : context(null,
                    []) as never,
{
    handle: jest.fn().mockReturnValue(of({
        success: false
    }))
} as never); expect(await firstValueFrom(result)).toEqual({
            success: true, value: 1
        }); expect(cache.del).not.toHaveBeenCalled() })

    it("bypasses cache when resolver metadata is absent",
        async () => {
            const handler = {
                handle: jest.fn().mockReturnValue(of({
                    value: "fresh",
                })),
            }
            const cache = {
                get: jest.fn(),
                del: jest.fn(),
                set: jest.fn(),
            }
            const i = new GraphQLCacheInterceptor({
                get: jest.fn().mockReturnValue(undefined),
            } as never,
cache as never)

            const result = await i.intercept(context(null) as never,
handler as never)

            expect(await firstValueFrom(result)).toEqual({
                value: "fresh",
            })
            expect(handler.handle).toHaveBeenCalledTimes(1)
            expect(cache.get).not.toHaveBeenCalled()
        })

    it("evicts failed cached payloads and stores a successful recomputation",
        async () => {
            const config = {
                key: "course",
                argsExtractor: jest.fn().mockReturnValue(["course-1",
                    "user-1"]),
            }
            const handler = {
                handle: jest.fn().mockReturnValue(of({
                    success: true,
                    value: "fresh",
                })),
            }
            const cache = {
                get: jest.fn().mockResolvedValue({
                    success: false,
                    error: "stale",
                }),
                del: jest.fn().mockResolvedValue(undefined),
                set: jest.fn().mockResolvedValue(undefined),
            }
            const i = new GraphQLCacheInterceptor({
                get: jest.fn().mockReturnValue(config),
            } as never,
cache as never)

            const result = await i.intercept(context(config) as never,
handler as never)
            expect(await firstValueFrom(result)).toEqual({
                success: true,
                value: "fresh",
            })
            await new Promise((resolve) => setTimeout(resolve,
                0))

            expect(cache.del).toHaveBeenCalledWith({
                key: "course",
                args: ["course-1",
                    "user-1"],
            })
            expect(cache.set).toHaveBeenCalledWith({
                key: "course",
                args: ["course-1",
                    "user-1"],
                cacheResult: {
                    success: true,
                    value: "fresh",
                },
            })
        })

    it("does not cache null, undefined, or explicitly unsuccessful handler results",
        async () => {
            const config = {
                key: "course",
                argsExtractor: jest.fn().mockReturnValue([]),
            }
            const cache = {
                get: jest.fn().mockResolvedValue(undefined),
                del: jest.fn(),
                set: jest.fn(),
            }
            const i = new GraphQLCacheInterceptor({
                get: jest.fn().mockReturnValue(config),
            } as never,
cache as never)

            for (const value of [null,
                undefined,
                {
                    success: false,
                }]) {
                const handler = {
                    handle: jest.fn().mockReturnValue(of(value)),
                }
                const result = await i.intercept(context(config) as never,
handler as never)
                await firstValueFrom(result)
            }
            await new Promise((resolve) => setTimeout(resolve,
                0))

            expect(cache.set).not.toHaveBeenCalled()
        })
    })
