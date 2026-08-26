import {
    KeycloakLoginHandler
} from "./login.handler"
import {
    KeycloakLoginCommand
} from "./login.command"
import {
    KeycloakTokenPayloadInvalidException
} from "@modules/platform/exceptions/errors/keycloak/keycloak-token-payload-invalid"

describe("KeycloakLoginHandler",
    () => {
        const command = new KeycloakLoginCommand({
            username: "ada", password: "password"
        })

        it("creates a local user on first successful login",
            async () => {
                const tokenService = {
                    exchangePasswordForToken: jest.fn().mockResolvedValue({
                        access_token: "access", refresh_token: "refresh", token_type: "Bearer", id_token: "id"
                    })
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
                const handler = new KeycloakLoginHandler(tokenService as never,
entityManager as never,
jwtService as never)
                await expect(handler.execute(command)).resolves.toMatchObject({
                    id: "local-1", accessToken: "access"
                })
                expect(entityManager.save).toHaveBeenCalledTimes(1)
                expect(entityManager.create).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        keycloakId: "kc-1", email: "ada@example.com"
                    }))
            })

        it("reuses an existing local user and rejects malformed token payloads",
            async () => {
                const tokenService = {
                    exchangePasswordForToken: jest.fn().mockResolvedValue({
                        access_token: "access", refresh_token: "refresh", token_type: "Bearer"
                    })
                }
                const entityManager = {
                    findOne: jest.fn().mockResolvedValue({
                        id: "existing", keycloakId: "kc-1"
                    }), create: jest.fn(), save: jest.fn()
                }
                const jwtService = {
                    decode: jest.fn().mockReturnValue(null)
                }
                const handler = new KeycloakLoginHandler(tokenService as never,
entityManager as never,
jwtService as never)
                await expect(handler.execute(command)).rejects.toBeInstanceOf(KeycloakTokenPayloadInvalidException)
                expect(entityManager.save).not.toHaveBeenCalled()
            })
        it("propagates an identity-provider login failure before local lookup",
            async () => {
                const failure = new Error("login unavailable")
                const tokenService = {
                    exchangePasswordForToken: jest.fn().mockRejectedValue(failure),
                }
                const entityManager = {
                    findOne: jest.fn(),
                    create: jest.fn(),
                    save: jest.fn(),
                }
                const handler = new KeycloakLoginHandler(tokenService as never,
                    entityManager as never,
{
} as never)

                await expect(handler.execute(command)).rejects.toBe(failure)
                expect(entityManager.findOne).not.toHaveBeenCalled()
            })
    })
