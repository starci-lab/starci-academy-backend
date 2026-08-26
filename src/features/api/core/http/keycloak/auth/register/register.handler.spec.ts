import {
    KeycloakRegisterHandler
} from "./register.handler"
import {
    KeycloakRegisterCommand
} from "./register.command"

describe("KeycloakRegisterHandler",
    () => {
        it("registers, verifies email, signs in, and persists the local identity",
            async () => {
                const tokenService = {
                    registerUserWithPassword: jest.fn().mockResolvedValue("kc-1"),
                    sendVerifyEmail: jest.fn(),
                    exchangePasswordForToken: jest.fn().mockResolvedValue({
                        access_token: "access", refresh_token: "refresh", token_type: "Bearer", id_token: "id"
                    }),
                }
                const userService = {
                }
                const entityManager = {
                    findOne: jest.fn().mockResolvedValue(null),
                    create: jest.fn((_entity, value) => ({
                        id: "local-1", ...value
                    })),
                    save: jest.fn(),
                }
                const jwtService = {
                    decode: jest.fn().mockReturnValue({
                        sub: "kc-1", email: "ada@example.com"
                    })
                }
                const handler = new KeycloakRegisterHandler(tokenService as never,
userService as never,
entityManager as never,
jwtService as never)
                const command = new KeycloakRegisterCommand({
                    email: "ada@example.com", password: "password", firstName: "Ada", lastName: "Lovelace"
                })
                await expect(handler.execute(command)).resolves.toMatchObject({
                    id: "local-1", accessToken: "access"
                })
                expect(tokenService.sendVerifyEmail).toHaveBeenCalledWith("kc-1")
                expect(entityManager.save).toHaveBeenCalledTimes(1)
            })

        it("falls back to the registration id when the decoded token omits its subject",
            async () => {
                const tokenService = {
                    registerUserWithPassword: jest.fn().mockResolvedValue("kc-fallback"),
                    sendVerifyEmail: jest.fn(),
                    exchangePasswordForToken: jest.fn().mockResolvedValue({
                        access_token: "access",
                        refresh_token: "refresh",
                    }),
                }
                const entityManager = {
                    findOne: jest.fn().mockResolvedValue({
                        id: "local-existing",
                    }),
                    create: jest.fn(),
                    save: jest.fn(),
                }
                const handler = new KeycloakRegisterHandler(
                    tokenService as never,
                    {
                    } as never,
                    entityManager as never,
                    {
                        decode: jest.fn().mockReturnValue({
                            email: "fallback@example.com",
                        }),
                    } as never,
                )

                await expect(handler.execute(new KeycloakRegisterCommand({
                    email: "fallback@example.com",
                    password: "password",
                    firstName: "Fallback",
                    lastName: "User",
                }))).resolves.toMatchObject({
                    id: "local-existing",
                    accessToken: "access",
                })
                expect(entityManager.create).not.toHaveBeenCalled()
            })
        it("does not persist an account when the identity provider rejects registration",
            async () => {
                const failure = new Error("registration unavailable")
                const tokenService = {
                    registerUserWithPassword: jest.fn().mockRejectedValue(failure),
                }
                const entityManager = {
                    findOne: jest.fn(),
                    create: jest.fn(),
                    save: jest.fn(),
                }
                const handler = new KeycloakRegisterHandler(tokenService as never,
                    {
                    } as never,
entityManager as never,
{
} as never)

                await expect(handler.execute(new KeycloakRegisterCommand({
                    email: "failed@example.com",
                    password: "password",
                    firstName: "Failed",
                    lastName: "User",
                }))).rejects.toBe(failure)
                expect(entityManager.save).not.toHaveBeenCalled()
            })

        it("rejects a token response whose decoded payload is not an object",
            async () => {
                const tokenService = {
                    registerUserWithPassword: jest.fn().mockResolvedValue("kc-2"),
                    sendVerifyEmail: jest.fn(),
                    exchangePasswordForToken: jest.fn().mockResolvedValue({
                        access_token: "access",
                    }),
                }
                const jwtService = {
                    decode: jest.fn().mockReturnValue(null),
                }
                const handler = new KeycloakRegisterHandler(tokenService as never,
                    {
                    } as never,
{
    findOne: jest.fn()
} as never,
jwtService as never)

                await expect(handler.execute(new KeycloakRegisterCommand({
                    email: "invalid@example.com",
                    password: "password",
                    firstName: "Invalid",
                    lastName: "Token",
                }))).rejects.toThrow()
                expect(tokenService.sendVerifyEmail).toHaveBeenCalledWith("kc-2")
            })
    })
