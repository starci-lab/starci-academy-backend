import {
    KeycloakAuthService
} from "./auth.service"

describe("KeycloakAuthService",
    () => {
        it("dispatches login, registration, and mail-adapter commands",
            async () => {
                const execute = jest.fn()
                    .mockResolvedValueOnce({
                        accessToken: "login-token"
                    })
                    .mockResolvedValueOnce({
                        accessToken: "register-token"
                    })
                    .mockResolvedValueOnce({
                        configured: true
                    })
                const service = new KeycloakAuthService({
                    execute
                } as never)
                const login = {
                    username: "learner",
                    password: "secret-password",
                }
                const register = {
                    email: "learner@example.com",
                    password: "secret-password",
                    firstName: "Ada",
                }
                const configure = {
                    verifyEmailUserId: "550e8400-e29b-41d4-a716-446655440000",
                }

                await expect(service.login(login as never)).resolves.toEqual({
                    accessToken: "login-token",
                })
                await expect(service.register(register as never)).resolves.toEqual({
                    accessToken: "register-token",
                })
                await expect(service.configureMailAdapter(configure as never)).resolves.toEqual({
                    configured: true,
                })

                expect(execute).toHaveBeenCalledTimes(3)
                expect(execute).toHaveBeenNthCalledWith(1,
                    expect.objectContaining({
                        params: login,
                    }))
                expect(execute).toHaveBeenNthCalledWith(2,
                    expect.objectContaining({
                        params: register,
                    }))
                expect(execute).toHaveBeenNthCalledWith(3,
                    expect.objectContaining({
                        params: configure,
                    }))
            })

        it("propagates a command failure",
            async () => {
                const failure = new Error("Keycloak unavailable")
                const execute = jest.fn().mockRejectedValue(failure)
                const service = new KeycloakAuthService({
                    execute
                } as never)

                await expect(service.login({
                    username: "learner",
                    password: "secret-password",
                } as never)).rejects.toBe(failure)
            })
    })
