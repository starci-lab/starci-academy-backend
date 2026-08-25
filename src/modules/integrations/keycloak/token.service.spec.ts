jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: () => ({
            keycloak: {
                url: "https://keycloak.test/", realm: "realm", clientId: "client" 
            } 
        }) 
    }))
import {
    KeycloakTokenService 
} from "./token.service"

describe("KeycloakTokenService",
    () => {
        it("posts password and refresh exchanges through the configured axios client",
            async () => {
                const post = jest.fn().mockResolvedValue({
                    data: {
                        access_token: "token" 
                    } 
                }); const service = new KeycloakTokenService({
                    create: jest.fn().mockReturnValue({
                        post 
                    }) 
                } as never,
{
    keycloakClientSecret: "secret" 
} as never,
{
} as never,
{
} as never)
                await expect(service.exchangePasswordForToken({
                    username: "u", password: "p" 
                })).resolves.toEqual({
                    access_token: "token" 
                }); await service.exchangeRefreshTokenForToken({
                    refreshToken: "refresh" 
                }); expect(post).toHaveBeenCalledTimes(2)
            })
    })
