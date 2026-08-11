/* eslint-disable starci-be/e2e-asserts-persisted-state -- Session rotation is observable at the Keycloak token boundary and HTTP cookie boundary; this focused flow deliberately has no application row to read. */
import request from "supertest"
import {
    Test
} from "@nestjs/testing"
import type {
    INestApplication, CanActivate
} from "@nestjs/common"
import {
    CqrsModule
} from "@nestjs/cqrs"
import {
    JwtService
} from "@nestjs/jwt"
import {
    ApolloServerModule
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType
} from "@modules/api/apollo/server/enums/server"
import {
    KeycloakTokenService
} from "@modules/integrations/keycloak/token.service"
import {
    CookieService
} from "@modules/platform/cookie/cookie.service"
import {
    CookieName
} from "@modules/platform/cookie/enums"
import {
    CsrfService
} from "@modules/platform/csrf/csrf.service"
import {
    CsrfGuard
} from "@modules/platform/csrf/guards/csrf.guard"
import {
    SessionService
} from "@modules/platform/session/session.service"
import {
    RefreshTokenResolver
} from "@features/api/core/graphql/mutations/keycloak/refresh-token/refresh-token.resolver"
import {
    RefreshTokenService
} from "@features/api/core/graphql/mutations/keycloak/refresh-token/refresh-token.service"
import {
    RefreshTokenHandler
} from "@features/api/core/graphql/mutations/keycloak/refresh-token/refresh-token.handler"
import {
    RefreshTokenCoalescerService
} from "@features/api/core/graphql/mutations/keycloak/refresh-token/refresh-token-coalescer.service"
import {
    SignOutResolver
} from "@features/api/core/graphql/mutations/keycloak/sign-out/sign-out.resolver"
import {
    SignOutService
} from "@features/api/core/graphql/mutations/keycloak/sign-out/sign-out.service"
import {
    SignOutHandler
} from "@features/api/core/graphql/mutations/keycloak/sign-out/sign-out.handler"
import {
    TestHelpersModule
} from "@tests/helpers/test-helpers.module"

/** A learner rotates a cookie session, signs out, and cannot revive it. */
describe("a learner refreshes a session, signs out, and cannot reuse it",
    () => {
        const INITIAL_REFRESH_TOKEN = "refresh-session-1"
        let app: INestApplication
        let currentRefreshToken = INITIAL_REFRESH_TOKEN
        let tokenSequence = 1
        const activeRefreshTokens = new Set([INITIAL_REFRESH_TOKEN])
        const attachedCookies: Array<{ name: CookieName, value: string }> = []
        const csrfGuard: CanActivate = {
            canActivate: () => true
        }
        const exchangeRefreshToken = jest.fn(async (params: { refreshToken: string }) => {
            if (!activeRefreshTokens.delete(params.refreshToken)) throw new Error("invalid refresh token")
            tokenSequence += 1
            const refreshToken = `refresh-session-${tokenSequence}`
            activeRefreshTokens.add(refreshToken)
            return {
                access_token: `access-session-${tokenSequence}`, refresh_token: refreshToken
            }
        })
        const gql = (query: string) => request(app.getHttpServer())
            .post("/graphql")
            .set("Cookie",
                `${CookieName.KeycloakRefreshToken}=${currentRefreshToken}`)
            .send({
                query
            })

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic, useServices: false
                    }),
                    CqrsModule,
                ],
                providers: [
                    RefreshTokenResolver,
                    RefreshTokenService,
                    RefreshTokenHandler,
                    SignOutResolver,
                    SignOutService,
                    SignOutHandler,
                    {
                        provide: RefreshTokenCoalescerService, useValue: {
                            exchange: exchangeRefreshToken
                        }
                    },
                    {
                        provide: KeycloakTokenService, useValue: {
                            revokeRefreshToken: jest.fn(async (params: { refreshToken: string }) => { activeRefreshTokens.delete(params.refreshToken) })
                        }
                    },
                    {
                        provide: JwtService, useValue: {
                            decode: jest.fn()
                        }
                    },
                    {
                        provide: CookieService, useValue: {
                            attachHttpOnlyCookie: jest.fn((cookie: { name: CookieName, value: string }) => { attachedCookies.push(cookie) }),
                            clearCookie: jest.fn(),
                        }
                    },
                    {
                        provide: SessionService, useValue: {
                            endSession: jest.fn().mockResolvedValue(undefined)
                        }
                    },
                    {
                        provide: CsrfService, useValue: {
                            verify: jest.fn().mockReturnValue(true)
                        }
                    },
                ],
            }).overrideGuard(CsrfGuard).useValue(csrfGuard).compile()
            app = moduleRef.createNestApplication()
            app.use((req: { headers: { cookie?: string }, cookies?: Record<string, string> }, _res: unknown, next: () => void) => {
                const raw = req.headers.cookie ?? ""
                req.cookies = Object.fromEntries(raw.split(";").filter(Boolean).map((part) => part.trim().split("=")))
                next()
            })
            await app.init()
        })

        afterAll(async () => { await app?.close().catch(() => undefined) })

        it("rotates the initial refresh cookie through GraphQL",
            async () => {
                const response = await gql("mutation { refreshToken(request: {}) { success data { accessToken } } }")
                expect(response.body.data.refreshToken.data.accessToken).toBe("access-session-2")
                currentRefreshToken = attachedCookies.at(-1)?.value ?? ""
                expect(currentRefreshToken).toBe("refresh-session-2")
                expect(activeRefreshTokens.has(INITIAL_REFRESH_TOKEN)).toBe(false)
            })

        it("rotates the live cookie again",
            async () => {
                const response = await gql("mutation { refreshToken(request: {}) { success data { accessToken } } }")
                expect(response.body.data.refreshToken.data.accessToken).toBe("access-session-3")
                currentRefreshToken = attachedCookies.at(-1)?.value ?? ""
                expect(currentRefreshToken).toBe("refresh-session-3")
            })

        it("revokes the current refresh cookie on sign-out",
            async () => {
                const response = await gql("mutation { signOut { success } }")
                expect(response.body.data.signOut.success).toBe(true)
                expect(activeRefreshTokens.has(currentRefreshToken)).toBe(false)
            })

        it("rejects an attempt to refresh the signed-out session",
            async () => {
                const response = await gql("mutation { refreshToken(request: {}) { success error } }")
                expect(response.body.data.refreshToken.success).toBe(false)
                expect(response.body.data.refreshToken.error).toBeTruthy()
            })
    })
