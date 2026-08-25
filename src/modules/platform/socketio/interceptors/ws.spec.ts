import {
    of, throwError
} from "rxjs"
import {
    WsTransformInterceptor
} from "./ws"

describe("WsTransformInterceptor",
    () => {
        const context = (client: { emit: jest.Mock; data?: unknown; handshake?: unknown }) => ({
            switchToWs: () => ({
                getClient: () => client
            }), getHandler: jest.fn(), getClass: jest.fn()
        } as never)
        it("emits a successful localized envelope",
            (done) => {
                const client = {
                    emit: jest.fn(), data: {
                        locale: "en"
                    }, handshake: {
                        headers: {
                        }
                    }
                }; const reflector = {
                    get: jest.fn().mockReturnValue("ok")
                }; const interceptor = new WsTransformInterceptor(reflector as never,
{
    serialize: (value: unknown) => ({
        json: value
    })
} as never)
                interceptor.intercept(context(client),
{
    handle: () => of({
        id: 1
    })
} as never).subscribe({
                    complete: () => { expect(client.emit).toHaveBeenCalledWith("ok",
                        expect.objectContaining({
                            success: true, data: {
                                json: {
                                    id: 1
                                }
                            }
                        })); done() }
                })
            })
        it("emits failed envelopes",
            (done) => {
                const client = {
                    emit: jest.fn(), data: {
                    }, handshake: {
                        headers: {
                        }
                    }
                }; const interceptor = new WsTransformInterceptor({
                    get: jest.fn()
                } as never,
{
    serialize: (value: unknown) => value
} as never)
                interceptor.intercept(context(client),
{
    handle: () => throwError(() => new Error("boom"))
} as never).subscribe({
                    complete: () => { expect(client.emit).toHaveBeenCalledWith(undefined,
                        {
                            success: false, message: "boom", error: "Error"
                        }); done() }
                })
            })
    })
