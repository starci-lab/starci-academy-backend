import {
    ResponseDelayInterceptor
} from "./response-delay.interceptor"
import {
    of, firstValueFrom
} from "rxjs"
describe("ResponseDelayInterceptor",
    () => {
        it("passes through a handler when delay is disabled by runtime config",
            async () => {
                const next = {
                    handle: jest.fn(() => of("ok"))
                }
                const context = {
                    getType: () => "http"
                } as never
                const result = await firstValueFrom(new ResponseDelayInterceptor().intercept(context,
next as never))
                expect(result).toBe("ok")
                expect(next.handle).toHaveBeenCalled()
            })

        it("passes through a nested GraphQL resolver without adding another delay",
            async () => {
                const next = {
                    handle: jest.fn(() => of("nested")),
                }
                const context = {
                    getType: () => "graphql",
                } as never
                await expect(firstValueFrom(new ResponseDelayInterceptor().intercept(context,
                    next as never))).resolves.toBe("nested")
                expect(next.handle).toHaveBeenCalledTimes(1)
            })
    })
