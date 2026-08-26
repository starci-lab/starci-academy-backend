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
        it("prefers the socket locale and serializes localized message metadata",
            (done) => {
                const client = {
                    emit: jest.fn(), data: {
                        locale: "vi"
                    }, handshake: {
                        headers: {
                        }
                    }
                }
                const reflector = {
                    get: jest.fn()
                        .mockReturnValueOnce({
                            en: "English", vi: "Tiếng Việt"
                        })
                        .mockReturnValueOnce("status.updated")
                }
                const interceptor = new WsTransformInterceptor(reflector as never,
                    {
                        serialize: (value: unknown) => value
                    } as never)
                interceptor.intercept(context(client),
                    {
                        handle: () => of({
                            ok: true
                        })
                    } as never).subscribe({
                    complete: () => {
                        expect(client.emit).toHaveBeenCalledWith("status.updated",
                            {
                                success: true, message: "Tiếng Việt", data: {
                                    ok: true
                                }
                            })
                        done()
                    }
                })
            })
        it("falls back to accepted English when socket locale is absent",
            (done) => {
                const client = {
                    emit: jest.fn(), data: {
                    }, handshake: {
                        headers: {
                            "accept-language": "fr, en-US;q=0.8"
                        }
                    }
                }
                const reflector = {
                    get: jest.fn()
                        .mockReturnValueOnce({
                            en: "English", vi: "Vietnamese"
                        })
                        .mockReturnValueOnce("status.updated")
                }
                const interceptor = new WsTransformInterceptor(reflector as never,
                    {
                        serialize: (value: unknown) => value
                    } as never)
                interceptor.intercept(context(client),
                    {
                        handle: () => of(null)
                    } as never).subscribe({
                    complete: () => {
                        expect(client.emit).toHaveBeenCalledWith("status.updated",
                            expect.objectContaining({
                                message: "English"
                            }))
                        done()
                    }
                })
            })
    })
