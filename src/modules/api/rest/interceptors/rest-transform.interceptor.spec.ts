import {
    HttpException, HttpStatus
} from "@nestjs/common"
import {
    RestTransformInterceptor
} from "./rest-transform.interceptor"
import {
    of, firstValueFrom, throwError
} from "rxjs"

describe("RestTransformInterceptor",
    () => {
        const context = {
            getHandler: jest.fn(), getClass: jest.fn()
        } as never
        it("wraps success with handler metadata",
            async () => {
                const reflector = {
                    get: jest.fn().mockReturnValueOnce("ok").mockReturnValue(undefined)
                }
                await expect(firstValueFrom(new RestTransformInterceptor(reflector as never).intercept(context,
{
    handle: () => of({
        id: 1
    })
} as never))).resolves.toEqual({
                    data: {
                        id: 1
                    }, message: "ok", success: true
                })
            })
        it("normalizes HttpException array errors",
            async () => {
                const interceptor = new RestTransformInterceptor({
                    get: jest.fn()
                } as never)
                const promise = firstValueFrom(interceptor.intercept(context,
{
    handle: () => throwError(() => new HttpException({
        message: ["a",
            "b"], error: "Bad"
    },
    HttpStatus.BAD_REQUEST))
} as never))
                await expect(promise).rejects.toMatchObject({
                    status: 400, response: {
                        success: false, message: "Http Exception", error: "HttpException"
                    }
                })
            })
    })
