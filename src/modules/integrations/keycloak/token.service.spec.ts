import {
    KeycloakTokenService
} from "./token.service"
import {
    KeycloakUserIdResolutionFailedException
} from "@modules/platform/exceptions/errors/keycloak/keycloak-user-id-resolution-failed"
import {
    KeycloakLoginFailedException,
} from "@modules/platform/exceptions/errors/keycloak/keycloak-login-failed"
import axios from "axios"

describe("KeycloakTokenService",
    () => {
        const make = () => {
            const client = {
                post: jest.fn(), get: jest.fn(), put: jest.fn()
            }
            const service = new KeycloakTokenService({
                create: jest.fn().mockReturnValue(client)
            } as never,
{
    keycloakClientSecret: "secret"
} as never,
{
    verifyAccessToken: jest.fn()
} as never,
{
    getAdminToken: jest.fn().mockResolvedValue("admin")
} as never)
            return {
                service, client
            }
        }
        it("exchanges password and refresh tokens and revokes refresh",
            async () => {
                const { service, client } = make()
                client.post.mockResolvedValue({
                    data: {
                        access_token: "a"
                    }
                })
                await expect(service.exchangePasswordForToken({
                    username: "u", password: "p"
                } as never)).resolves.toEqual({
                    access_token: "a"
                })
                await expect(service.exchangeRefreshTokenForToken({
                    refreshToken: "r"
                } as never)).resolves.toEqual({
                    access_token: "a"
                })
                await expect(service.revokeRefreshToken({
                    refreshToken: "r"
                } as never)).resolves.toBeUndefined()
                expect(client.post).toHaveBeenCalledTimes(3)
            })
        it("resolves created user id from location or fallback lookup",
            async () => {
                const { service, client } = make()
                client.post.mockResolvedValueOnce({
                    headers: {
                        location: "/users/new"
                    }
                })
                await expect(service.registerUserWithPassword({
                    username: "u", email: "e", firstName: "f", lastName: "l", password: "p"
                } as never)).resolves.toBe("new")
                client.post.mockResolvedValueOnce({
                    headers: {
                    }
                })
                client.get.mockResolvedValueOnce({
                    data: [{
                        id: "found"
                    }]
                })
                await expect(service.registerUserWithPassword({
                    username: "u", email: "e", password: "p"
                } as never)).resolves.toBe("found")
                client.post.mockResolvedValueOnce({
                    headers: {
                    }
                })
                client.get.mockResolvedValueOnce({
                    data: []
                })
                await expect(service.registerUserWithPassword({
                    username: "u", email: "e", password: "p"
                } as never)).rejects.toBeInstanceOf(KeycloakUserIdResolutionFailedException)
            })
        it("normalizes a Keycloak 401 credential rejection",
            async () => {
                const { service, client } = make()
                client.post.mockRejectedValueOnce(new axios.AxiosError(
                    "Request failed with status code 401",
                    "ERR_BAD_REQUEST",
                    undefined,
                    undefined,
                    {
                        status: 401,
                        statusText: "Unauthorized",
                        headers: {
                        },
                        config: {
                        } as never,
                        data: {
                            error: "invalid_grant",
                        },
                    },
                ))
                await expect(service.exchangePasswordForToken(
                    {
                        username: "u", password: "wrong",
                    } as never,
                )).rejects.toBeInstanceOf(KeycloakLoginFailedException)
            })
        it("delegates access verification and sends verify-email action",
            async () => {
                const { service, client } = make()
                await expect(service.verifyAccessToken("token")).resolves.toBeUndefined()
                await service.sendVerifyEmail("user")
                expect(client.put).toHaveBeenCalled()
            })
    })
