import {
    SocketIoAccessTokenInvalidException,
    SocketIoAccessTokenMissingException,
} from "@modules/platform/exceptions/errors/socketio/auth"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    socketIoKeycloakAuthMiddleware,
} from "./keycloak-auth"

describe("socketIoKeycloakAuthMiddleware",
    () => {
        it("rejects a handshake without a token",
            () => {
                const next = jest.fn()
                socketIoKeycloakAuthMiddleware({
                    handshake: {
                        auth: {
                        }, query: {
                        }
                    }, data: {
                    }
                } as never,
                next)

                expect(next).toHaveBeenCalledWith(expect.any(SocketIoAccessTokenMissingException))
            })

        it("maps an active token subject to socket data",
            async () => {
                const verifyAccessToken = jest.fn().mockResolvedValue({
                    active: true, sub: "user-7"
                })
                const app = {
                    get: jest.fn().mockReturnValue({
                        verifyAccessToken
                    })
                }
        ;(globalThis as unknown as { __APP__: typeof app }).__APP__ = app
                const socket = {
                    handshake: {
                        auth: {
                            token: "token"
                        }, query: {
                        }
                    }, data: {
                    } as { userId?: string }
                }
                const next = jest.fn()

                socketIoKeycloakAuthMiddleware(socket as never,
                    next)
                await new Promise((resolve) => setImmediate(resolve))

                expect(app.get).toHaveBeenCalledWith(KeycloakTokenService,
                    {
                        strict: false
                    })
                expect(socket.data.userId).toBe("user-7")
                expect(next).toHaveBeenCalledWith()
            })

        it("rejects verification failures as invalid access tokens",
            async () => {
                const app = {
                    get: jest.fn().mockReturnValue({
                        verifyAccessToken: jest.fn().mockRejectedValue(new Error("offline"))
                    })
                }
        ;(globalThis as unknown as { __APP__: typeof app }).__APP__ = app
                const next = jest.fn()

                socketIoKeycloakAuthMiddleware({
                    handshake: {
                        auth: {
                            token: "token"
                        }, query: {
                        }
                    }, data: {
                    }
                } as never,
                next)
                await new Promise((resolve) => setImmediate(resolve))

                expect(next).toHaveBeenCalledWith(expect.any(SocketIoAccessTokenInvalidException))
            })

        it("rejects an active token that has no subject claim",
            async () => {
                const app = {
                    get: jest.fn().mockReturnValue({
                        verifyAccessToken: jest.fn().mockResolvedValue({
                            active: true
                        }),
                    }),
                }
                ;(globalThis as unknown as { __APP__: typeof app }).__APP__ = app
                const next = jest.fn()

                const socket = {
                    handshake: {
                        auth: {
                            token: "token"
                        }, query: {
                        }
                    },
                    data: {
                    } as {
                        userId?: string
                    },
                }
                socketIoKeycloakAuthMiddleware(socket as never,
                    next)
                await new Promise((resolve) => setImmediate(resolve))

                expect(next).toHaveBeenCalledWith()
                expect(socket.data.userId).toBe("")
            })
    })
