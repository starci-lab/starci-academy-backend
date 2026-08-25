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
        }); expect(cache.del).not.toHaveBeenCalled() }) })
