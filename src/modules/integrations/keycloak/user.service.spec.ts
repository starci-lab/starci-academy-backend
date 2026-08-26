jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: jest.fn().mockReturnValue({
            keycloak: {
                url: "https://keycloak/", realm: "realm", admin: {
                    clientId: "client"
                }
            }
        }),
    }))

import {
    KeycloakUserService
} from "./user.service"

describe("KeycloakUserService",
    () => {
        const makeService = (get: jest.Mock, post: jest.Mock, put: jest.Mock) => new KeycloakUserService({
            create: jest.fn().mockReturnValue({
                get, post, put
            }),
        } as never,
{
    keycloakAdmin: {
        username: "admin", password: "secret"
    }
} as never)

        it("returns null for an absent username and maps a found user",
            async () => {
                const get = jest.fn().mockResolvedValueOnce({
                    data: []
                }).mockResolvedValueOnce({
                    data: [{
                        id: "u1"
                    }]
                })
                const service = makeService(get,
                    jest.fn().mockResolvedValue({
                        data: {
                            access_token: "token",
                        },
                    }),
                    jest.fn())
                await expect(service.getUserByUsername("none")).resolves.toBeNull()
                await expect(service.getUserByUsername("alice")).resolves.toEqual({
                    id: "u1"
                })
                expect(get).toHaveBeenCalledWith(expect.stringContaining("/users"),
                    expect.objectContaining({
                        params: {
                            username: "alice"
                        }
                    }))
            })

        it("gets an admin token and resets a password",
            async () => {
                const post = jest.fn().mockResolvedValue({
                    data: {
                        access_token: "token"
                    }
                })
                const put = jest.fn().mockResolvedValue(undefined)
                const service = makeService(jest.fn(),
                    post,
                    put)
                await expect(service.getAdminToken()).resolves.toBe("token")
                await service.resetUserPassword("u1",
                    "new")
                expect(put).toHaveBeenCalledWith(expect.stringContaining("reset-password"),
                    expect.objectContaining({
                        value: "new"
                    }),
                    expect.anything())
            })
    })
