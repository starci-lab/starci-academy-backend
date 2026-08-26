import {
    KeycloakAuthController
} from "./auth.controller"

describe("KeycloakAuthController",
    () => {
        it("delegates login and registration",
            async () => {
                const service = {
                    login: jest.fn().mockResolvedValue({
                        accessToken: "a"
                    }), register: jest.fn().mockResolvedValue({
                        accessToken: "b"
                    }), configureMailAdapter: jest.fn()
                }
                const controller = new KeycloakAuthController(service as never)
                await expect(controller.login({
                    username: "u", password: "p"
                } as never)).resolves.toEqual({
                    accessToken: "a"
                })
                await expect(controller.register({
                    username: "u"
                } as never)).resolves.toEqual({
                    accessToken: "b"
                })
                expect(service.login).toHaveBeenCalled()
                expect(service.register).toHaveBeenCalled()
            })
        it("delegates mail adapter configuration",
            async () => {
                const service = {
                    configureMailAdapter: jest.fn().mockResolvedValue({
                        ok: true
                    })
                }
                await expect(new KeycloakAuthController(service as never).configureMailAdapter({
                } as never)).resolves.toEqual({
                    ok: true
                })
            })

        it("does not swallow login failures from the authentication service",
            async () => {
                const failure = new Error("Keycloak unavailable")
                const login = jest.fn().mockRejectedValue(failure)
                await expect(new KeycloakAuthController({
                    login,
                } as never).login({
                    username: "u",
                    password: "p",
                } as never)).rejects.toBe(failure)
            })
    })
