import type {
    INestApplication,
} from "@nestjs/common"
import {
    VersioningType,
} from "@nestjs/common"
import {
    Test,
} from "@nestjs/testing"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import request from "supertest"
import type Redis from "ioredis"
import type {
    EntityManager,
} from "typeorm"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    EmailBloomFilterService,
} from "@modules/bussiness/bloom-filters/email.service"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakJwksService,
} from "@modules/integrations/keycloak/jwks.service"
import {
    KeycloakOidcRedirectService,
} from "@modules/integrations/keycloak/keycloak-oidc-redirect.service"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    KeycloakIdentityProvider,
} from "@modules/integrations/keycloak/types/tokens"
import {
    JwtService,
} from "@nestjs/jwt"
import {
    createIoRedisKey,
} from "@modules/lib/native/ioredis/constants"
import {
    IoRedisInstanceKey,
} from "@modules/lib/native/ioredis/enums/instance-key"
import {
    IoRedisModule,
} from "@modules/lib/native/ioredis/ioredis.module"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    CookieName,
} from "@modules/platform/cookie/enums"
import {
    setupCookie,
} from "@modules/platform/cookie/setup"
import {
    CsrfService,
} from "@modules/platform/csrf/csrf.service"
import {
    CsrfGuard,
} from "@modules/platform/csrf/guards/csrf.guard"
import {
    OAuthStateService,
} from "@modules/platform/oauth-state/oauth-state.service"
import {
    SessionService,
} from "@modules/platform/session/session.service"
import {
    MyCartHandler,
} from "@features/api/core/graphql/queries/courses/my-cart/my-cart.handler"
import {
    MyCartResolver,
} from "@features/api/core/graphql/queries/courses/my-cart/my-cart.resolver"
import {
    MyCartService,
} from "@features/api/core/graphql/queries/courses/my-cart/my-cart.service"
import {
    ExchangeCodeForTokenHandler,
} from "@features/api/core/graphql/mutations/keycloak/exchange-code-for-token/exchange-code-for-token.handler"
import {
    ExchangeCodeForTokenResolver,
} from "@features/api/core/graphql/mutations/keycloak/exchange-code-for-token/exchange-code-for-token.resolver"
import {
    ExchangeCodeForTokenService,
} from "@features/api/core/graphql/mutations/keycloak/exchange-code-for-token/exchange-code-for-token.service"
import {
    RefreshTokenCoalescerService,
} from "@features/api/core/graphql/mutations/keycloak/refresh-token/refresh-token-coalescer.service"
import {
    RefreshTokenHandler,
} from "@features/api/core/graphql/mutations/keycloak/refresh-token/refresh-token.handler"
import {
    RefreshTokenResolver,
} from "@features/api/core/graphql/mutations/keycloak/refresh-token/refresh-token.resolver"
import {
    RefreshTokenService,
} from "@features/api/core/graphql/mutations/keycloak/refresh-token/refresh-token.service"
import {
    KeycloakGoogleRedirectController,
} from "@features/api/core/http/keycloak/google/redirect/redirect.controller"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

const POSTGRESQL_PRIMARY = "primary"
const KEYCLOAK_SUB = "auth-boundary-rejected-subject"
const MANAGED_SESSION_ID = "another-device-session"
const OAUTH_SUB = "oauth-security-subject"

const jwtFor = (sub: string): string => {
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url")
    return `${encode({
        alg: "none", typ: "JWT"
    })}.${encode({
        sub,
        email: "oauth-security@starci.test",
        preferred_username: "oauth-security",
    })}.signature`
}

const cookieValue = (setCookies: Array<string>, name: CookieName): string => {
    const cookie = setCookies.find((candidate) => candidate.startsWith(`${name}=`))
    expect(cookie).toBeDefined()
    return cookie?.slice(name.length + 1).split(";")[0] ?? ""
}

/**
 * Operational security proof for the authenticated GraphQL boundary.
 *
 * The Keycloak verifier is the only scripted external result. GraphQL routing,
 * the production guard, Redis session enforcement and Postgres are real. A
 * rejected credential must have no persistence side effect: otherwise any
 * holder of a valid-but-superseded token can manufacture local users simply by
 * probing a protected query.
 */
describe("a superseded Keycloak session is rejected before local identity mutation",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let redis: Redis
        const accessToken = jwtFor(OAUTH_SUB)
        const exchangeCodeForToken = jest.fn().mockResolvedValue({
            access_token: accessToken,
            refresh_token: "oauth-refresh-initial",
            expires_in: 300,
            scope: "openid email profile",
            token_type: "Bearer",
            session_state: "oauth-session",
        })
        const exchangeRefreshTokenForToken = jest.fn().mockResolvedValue({
            access_token: jwtFor(OAUTH_SUB),
            refresh_token: "oauth-refresh-rotated",
            expires_in: 300,
            scope: "openid email profile",
            token_type: "Bearer",
            session_state: "oauth-session-rotated",
        })

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    IoRedisModule.register({
                        instanceKeys: [IoRedisInstanceKey.Cache],
                        isGlobal: true,
                    }),
                    CqrsModule,
                ],
                providers: [
                    MyCartResolver,
                    MyCartService,
                    MyCartHandler,
                    ExchangeCodeForTokenResolver,
                    ExchangeCodeForTokenService,
                    ExchangeCodeForTokenHandler,
                    RefreshTokenResolver,
                    RefreshTokenService,
                    RefreshTokenHandler,
                    RefreshTokenCoalescerService,
                    KeycloakAuthGraphQLGuard,
                    KeycloakOidcRedirectService,
                    OAuthStateService,
                    SessionService,
                    CookieService,
                    CsrfService,
                    CsrfGuard,
                    JwtService,
                    {
                        provide: KeycloakJwksService,
                        useValue: {
                            verifyAccessToken: jest.fn().mockResolvedValue({
                                active: true,
                                sub: KEYCLOAK_SUB,
                                email: "rejected-session@starci.test",
                                preferred_username: "rejected-session",
                            }),
                        },
                    },
                    {
                        provide: KeycloakTokenService,
                        useValue: {
                            exchangeCodeForToken,
                            exchangeRefreshTokenForToken,
                        },
                    },
                    {
                        provide: EmailBloomFilterService,
                        useValue: {
                            add: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: {
                            enqueue: jest.fn(),
                        },
                    },
                ],
                controllers: [KeycloakGoogleRedirectController],
            }).compile()

            app = moduleRef.createNestApplication()
            app.enableVersioning({
                type: VersioningType.URI,
            })
            setupCookie(app)
            await app.init()
            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            redis = app.get<Redis>(createIoRedisKey(IoRedisInstanceKey.Cache))
        })

        beforeEach(async () => {
            exchangeCodeForToken.mockClear()
            exchangeRefreshTokenForToken.mockClear()
            await entityManager.query(
                "TRUNCATE TABLE login_sessions, users RESTART IDENTITY CASCADE",
            )
            await redis.del(`session:${KEYCLOAK_SUB}`)
            await redis.del(`session:${OAUTH_SUB}`)
            await redis.hset(
                `session:${KEYCLOAK_SUB}`,
                MANAGED_SESSION_ID,
                JSON.stringify({
                    sessionId: MANAGED_SESSION_ID,
                    createdAt: Date.now(),
                    lastSeenAt: Date.now(),
                }),
            )
        })

        afterAll(async () => {
            await redis?.del(`session:${KEYCLOAK_SUB}`)
            await redis?.del(`session:${OAUTH_SUB}`)
            await app?.close().catch(() => undefined)
        })

        const startSocialOAuth = async (): Promise<URL> => {
            const response = await request(app.getHttpServer())
                .get("/v1/keycloak/google/redirect")
                .query({
                    redirect_uri: "https://academy.starci.test/auth/callback",
                })
                .expect(302)
            return new URL(response.headers.location)
        }

        const exchangeOAuthState = async (
            state: string,
            code = "keycloak-network-code",
        ) => request(app.getHttpServer())
            .post("/graphql")
            .send({
                query: `
                    mutation Exchange($request: ExchangeCodeForTokenRequest!) {
                        exchangeCodeForToken(request: $request) {
                            success
                            error
                            data { accessToken }
                        }
                    }
                `,
                variables: {
                    request: {
                        code,
                        provider: KeycloakIdentityProvider.Google,
                        state,
                    },
                },
            })

        const establishOAuthSession = async (): Promise<{
            csrfToken: string
            refreshToken: string
        }> => {
            const authorizationUrl = await startSocialOAuth()
            const state = authorizationUrl.searchParams.get("state") ?? ""
            expect(state).not.toBe("")
            const response = await exchangeOAuthState(state)
            expect(response.body.errors).toBeUndefined()
            expect(response.body.data.exchangeCodeForToken.success).toBe(true)
            const setCookies = response.headers["set-cookie"] as unknown as Array<string>
            return {
                csrfToken: cookieValue(setCookies,
                    CookieName.CsrfToken),
                refreshToken: cookieValue(setCookies,
                    CookieName.KeycloakRefreshToken),
            }
        }

        it("rejects the protected query through GraphQL when the session cookie is absent",
            async () => {
                const response = await request(app.getHttpServer())
                    .post("/graphql")
                    .set("Authorization",
                        "Bearer externally-verified-token")
                    .send({
                        query: "query { myCart { success error data { id } } }",
                    })

                expect(response.body.errors).toBeDefined()
                expect(response.body.data).toBeNull()
            })

        it("does not create a local user for the rejected security context",
            async () => {
                expect(await entityManager.count(UserEntity,
                    {
                        where: {
                            keycloakId: KEYCLOAK_SUB,
                        },
                    })).toBe(0)
            })

        it("starts social OAuth through HTTP with opaque state and PKCE",
            async () => {
                const authorizationUrl = await startSocialOAuth()
                const state = authorizationUrl.searchParams.get("state") ?? ""
                expect(state).not.toBe("")
                expect(authorizationUrl.searchParams.get("code_challenge_method"))
                    .toBe("S256")
                expect(authorizationUrl.searchParams.get("code_challenge"))
                    .not.toBe("")
            })

        it("consumes OAuth state once and rejects replay before a second exchange",
            async () => {
                const authorizationUrl = await startSocialOAuth()
                const state = authorizationUrl.searchParams.get("state") ?? ""
                const response = await exchangeOAuthState(state)

                expect(response.body.errors).toBeUndefined()
                expect(response.body.data.exchangeCodeForToken.success).toBe(true)
                expect(response.body.data.exchangeCodeForToken.data.accessToken)
                    .toBe(accessToken)
                expect(exchangeCodeForToken).toHaveBeenCalledTimes(1)
                expect(await entityManager.count(UserEntity,
                    {
                        where: {
                            keycloakId: OAUTH_SUB,
                        },
                    })).toBe(1)

                const setCookies = response.headers["set-cookie"] as unknown as Array<string>
                expect(cookieValue(setCookies,
                    CookieName.CsrfToken)).not.toBe("")
                expect(cookieValue(setCookies,
                    CookieName.KeycloakRefreshToken)).toBe("oauth-refresh-initial")
                expect(cookieValue(setCookies,
                    CookieName.SessionId)).not.toBe("")

                const replay = await exchangeOAuthState(state,
                    "replayed-code")
                expect(replay.body.data.exchangeCodeForToken.success).toBe(false)
                expect(replay.body.data.exchangeCodeForToken.error)
                    .toBe("OIDC_STATE_EXPIRED_EXCEPTION")
                expect(exchangeCodeForToken).toHaveBeenCalledTimes(1)
                expect(await entityManager.count(UserEntity,
                    {
                        where: {
                            keycloakId: OAUTH_SUB,
                        },
                    })).toBe(1)
            })

        it("rejects cookie refresh without the double-submit CSRF header",
            async () => {
                const {
                    csrfToken,
                    refreshToken,
                } = await establishOAuthSession()
                const response = await request(app.getHttpServer())
                    .post("/graphql")
                    .set("Cookie",
                        `${CookieName.KeycloakRefreshToken}=${refreshToken}; ${CookieName.CsrfToken}=${csrfToken}`)
                    .send({
                        query: "mutation { refreshToken(request: {}) { success error } }",
                    })

                expect(response.body.errors).toBeDefined()
                expect(exchangeRefreshTokenForToken).not.toHaveBeenCalled()
            })

        it("rejects a valid double-submit pair from an untrusted browser origin",
            async () => {
                const {
                    csrfToken,
                    refreshToken,
                } = await establishOAuthSession()
                const response = await request(app.getHttpServer())
                    .post("/graphql")
                    .set("Origin",
                        "https://attacker.invalid")
                    .set("X-CSRF-Token",
                        csrfToken)
                    .set("Cookie",
                        `${CookieName.KeycloakRefreshToken}=${refreshToken}; ${CookieName.CsrfToken}=${csrfToken}`)
                    .send({
                        query: "mutation { refreshToken(request: {}) { success error } }",
                    })

                expect(response.body.errors).toBeDefined()
                expect(exchangeRefreshTokenForToken).not.toHaveBeenCalled()
            })

        it("allows the bound CSRF pair and rotates the refresh token once",
            async () => {
                const {
                    csrfToken,
                    refreshToken,
                } = await establishOAuthSession()
                const response = await request(app.getHttpServer())
                    .post("/graphql")
                    .set("X-CSRF-Token",
                        csrfToken)
                    .set("Cookie",
                        `${CookieName.KeycloakRefreshToken}=${refreshToken}; ${CookieName.CsrfToken}=${csrfToken}`)
                    .send({
                        query: "mutation { refreshToken(request: {}) { success error data { accessToken } } }",
                    })

                expect(response.body.errors).toBeUndefined()
                expect(response.body.data.refreshToken.success).toBe(true)
                expect(exchangeRefreshTokenForToken).toHaveBeenCalledTimes(1)
                const setCookies = response.headers["set-cookie"] as unknown as Array<string>
                expect(cookieValue(setCookies,
                    CookieName.KeycloakRefreshToken))
                    .toBe("oauth-refresh-rotated")
            })
    })
