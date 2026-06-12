// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` — dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    JwtService,
} from "@nestjs/jwt"
import {
    KeycloakTokenService,
} from "@modules/keycloak"
import {
    RefreshTokenCommand,
} from "./refresh-token.command"
import {
    RefreshTokenHandler,
} from "./refresh-token.handler"

describe("RefreshTokenHandler",
    () => {
        let module: TestingModule
        let handler: RefreshTokenHandler
        let jwtService: jest.Mocked<Pick<JwtService, "decode">>
        let keycloakTokenService: jest.Mocked<Pick<KeycloakTokenService, "exchangeRefreshTokenForToken">>

        beforeEach(async () => {
            // decodes the current access token to read its expiry
            jwtService = {
                decode: jest.fn(),
            } as unknown as jest.Mocked<Pick<JwtService, "decode">>

            // exchanges the refresh token for a fresh pair when a refresh is needed
            keycloakTokenService = {
                exchangeRefreshTokenForToken: jest.fn().mockResolvedValue({
                    access_token: "new-access",
                    refresh_token: "new-refresh",
                }),
            } as unknown as jest.Mocked<Pick<KeycloakTokenService, "exchangeRefreshTokenForToken">>

            module = await Test.createTestingModule({
                providers: [
                    RefreshTokenHandler,
                    {
                        provide: JwtService,
                        useValue: jwtService,
                    },
                    {
                        provide: KeycloakTokenService,
                        useValue: keycloakTokenService,
                    },
                ],
            }).compile()

            handler = module.get<RefreshTokenHandler>(RefreshTokenHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("short-circuits with the current token when it still has enough validity",
            async () => {
                // the access token expires far in the future (1h from now)
                const futureExp = Math.floor(Date.now() / 1000) + 3600
                jwtService.decode.mockReturnValueOnce({
                    exp: futureExp,
                } as never)

                const result = await handler.execute(
                    new RefreshTokenCommand({
                        refreshToken: "refresh-current",
                        accessToken: "access-current",
                        request: {
                            minValiditySeconds: 60,
                        },
                    }),
                )

                // no Keycloak round-trip when the token is still fresh enough
                expect(keycloakTokenService.exchangeRefreshTokenForToken).not.toHaveBeenCalled()
                // the existing tokens are echoed back unchanged
                expect(result).toEqual({
                    data: {
                        accessToken: "access-current",
                    },
                    refreshToken: "refresh-current",
                })
            })

        it("exchanges the refresh token when the access token is near expiry",
            async () => {
                // the access token expires in 10s — below the 60s minimum
                const soonExp = Math.floor(Date.now() / 1000) + 10
                jwtService.decode.mockReturnValueOnce({
                    exp: soonExp,
                } as never)

                const result = await handler.execute(
                    new RefreshTokenCommand({
                        refreshToken: "refresh-current",
                        accessToken: "access-current",
                        request: {
                            minValiditySeconds: 60,
                        },
                    }),
                )

                // a refresh round-trip happens and the new tokens are returned
                expect(keycloakTokenService.exchangeRefreshTokenForToken).toHaveBeenCalledWith({
                    refreshToken: "refresh-current",
                })
                expect(result).toEqual({
                    data: {
                        accessToken: "new-access",
                    },
                    refreshToken: "new-refresh",
                })
            })

        it("exchanges immediately when no minValiditySeconds is provided",
            async () => {
                const result = await handler.execute(
                    new RefreshTokenCommand({
                        refreshToken: "refresh-current",
                        request: {
                        },
                    }),
                )

                // with no validity hint the token is never decoded, just exchanged
                expect(jwtService.decode).not.toHaveBeenCalled()
                expect(keycloakTokenService.exchangeRefreshTokenForToken).toHaveBeenCalledWith({
                    refreshToken: "refresh-current",
                })
                expect(result).toEqual({
                    data: {
                        accessToken: "new-access",
                    },
                    refreshToken: "new-refresh",
                })
            })
    })
