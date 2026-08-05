// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    JwtService,
} from "@nestjs/jwt"
import {
    EmailBloomFilterService,
} from "@modules/bussiness"
import {
    KeycloakIdentityProvider,
    KeycloakOidcRedirectService,
    KeycloakTokenService,
} from "@modules/keycloak"
import {
    InvalidJwtPayloadException,
} from "@modules/exceptions"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import {
    ExchangeCodeForTokenCommand,
} from "./exchange-code-for-token.command"
import {
    ExchangeCodeForTokenHandler,
} from "./exchange-code-for-token.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("ExchangeCodeForTokenHandler",
    () => {
        let module: TestingModule
        let handler: ExchangeCodeForTokenHandler
        let entityManager: EntityManagerMock
        let jwtService: jest.Mocked<Pick<JwtService, "decode">>
        let keycloakTokenService: jest.Mocked<Pick<KeycloakTokenService, "exchangeCodeForToken">>
        let keycloakOidcRedirectService: jest.Mocked<
            Pick<KeycloakOidcRedirectService, "loadPkceBundle" | "clearPkceBundle">
        >
        let emailBloomFilterService: jest.Mocked<Pick<EmailBloomFilterService, "add">>

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // decodes the exchanged access token into Keycloak claims
            jwtService = {
                decode: jest.fn(),
            } as unknown as jest.Mocked<Pick<JwtService, "decode">>

            // exchanges the OIDC code for a token pair
            keycloakTokenService = {
                exchangeCodeForToken: jest.fn().mockResolvedValue({
                    access_token: "access-1",
                    refresh_token: "refresh-1",
                }),
            } as unknown as jest.Mocked<Pick<KeycloakTokenService, "exchangeCodeForToken">>

            // loads + clears the server-side PKCE bundle keyed by provider/state
            keycloakOidcRedirectService = {
                loadPkceBundle: jest.fn().mockResolvedValue({
                    redirectUri: "https://app/callback",
                    codeVerifier: "verifier",
                }),
                clearPkceBundle: jest.fn(),
            } as unknown as jest.Mocked<
                Pick<KeycloakOidcRedirectService, "loadPkceBundle" | "clearPkceBundle">
            >

            // records a new user's email in the existence bloom filter
            emailBloomFilterService = {
                add: jest.fn(),
            } as unknown as jest.Mocked<Pick<EmailBloomFilterService, "add">>

            module = await Test.createTestingModule({
                providers: [
                    ExchangeCodeForTokenHandler,
                    {
                        provide: KeycloakTokenService,
                        useValue: keycloakTokenService,
                    },
                    {
                        provide: KeycloakOidcRedirectService,
                        useValue: keycloakOidcRedirectService,
                    },
                    {
                        provide: JwtService,
                        useValue: jwtService,
                    },
                    {
                        provide: EmailBloomFilterService,
                        useValue: emailBloomFilterService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<ExchangeCodeForTokenHandler>(ExchangeCodeForTokenHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("exchanges the code, creates a missing user and returns the tokens",
            async () => {
                // the token decodes to a valid subject for a brand-new account
                jwtService.decode.mockReturnValueOnce({
                    sub: "kc-1",
                    email: "new@example.com",
                    preferred_username: "newbie",
                } as never)
                // no local user yet -> one is created
                entityManager.findOne.mockResolvedValueOnce(null)

                const result = await handler.execute(
                    new ExchangeCodeForTokenCommand({
                        request: {
                            code: "auth-code",
                            provider: KeycloakIdentityProvider.Google,
                            state: "state-1",
                        },
                    }),
                )

                // the code is exchanged using the loaded PKCE bundle
                expect(keycloakTokenService.exchangeCodeForToken).toHaveBeenCalledWith({
                    code: "auth-code",
                    redirectUri: "https://app/callback",
                    codeVerifier: "verifier",
                })
                // the consumed PKCE bundle is cleared
                expect(keycloakOidcRedirectService.clearPkceBundle).toHaveBeenCalledWith(
                    KeycloakIdentityProvider.Google,
                    "state-1",
                )
                // the new user is persisted and its email recorded in the bloom filter
                expect(entityManager.save).toHaveBeenCalled()
                expect(emailBloomFilterService.add).toHaveBeenCalledWith("new@example.com")
                // the exchanged tokens are returned
                expect(result).toEqual({
                    data: {
                        accessToken: "access-1",
                    },
                    refreshToken: "refresh-1",
                })
            })

        it("does not recreate the user when one already exists for the subject",
            async () => {
                jwtService.decode.mockReturnValueOnce({
                    sub: "kc-1",
                    email: "existing@example.com",
                } as never)
                // the local user already exists for this subject
                entityManager.findOne.mockResolvedValueOnce({
                    id: "user-1",
                    keycloakId: "kc-1",
                })

                await handler.execute(
                    new ExchangeCodeForTokenCommand({
                        request: {
                            code: "auth-code",
                            provider: KeycloakIdentityProvider.Github,
                            state: "state-1",
                        },
                    }),
                )

                // no save / bloom-filter write when the user is already present
                expect(entityManager.save).not.toHaveBeenCalled()
                expect(emailBloomFilterService.add).not.toHaveBeenCalled()
            })

        it("throws when the exchanged token decodes to an invalid payload",
            async () => {
                // decode yields no subject -> invalid payload
                jwtService.decode.mockReturnValueOnce(null as never)

                await expect(
                    handler.execute(
                        new ExchangeCodeForTokenCommand({
                            request: {
                                code: "auth-code",
                                provider: KeycloakIdentityProvider.Google,
                                state: "state-1",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(InvalidJwtPayloadException)

                // no user is loaded or created on an invalid token
                expect(entityManager.findOne).not.toHaveBeenCalled()
            })
    })
