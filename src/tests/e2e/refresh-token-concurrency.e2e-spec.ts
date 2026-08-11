/* eslint-disable starci-be/e2e-asserts-persisted-state -- The production consequence is the Redis single-flight result plus identical rotated HTTP cookies; this auth flow owns no Postgres row. */
import Redis from "ioredis"
import request from "supertest"
import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    JwtService,
} from "@nestjs/jwt"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import type {
    KeycloakExchangeCodeForTokenResponse,
} from "@modules/integrations/keycloak/types/tokens"
import {
    createIoRedisKey,
} from "@modules/lib/native/ioredis/constants"
import {
    IoRedisInstanceKey,
} from "@modules/lib/native/ioredis/enums/instance-key"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    CookieName,
} from "@modules/platform/cookie/enums"
import {
    CsrfService,
} from "@modules/platform/csrf/csrf.service"
import {
    CsrfGuard,
} from "@modules/platform/csrf/guards/csrf.guard"
import {
    RefreshTokenResolver,
} from "@features/api/core/graphql/mutations/keycloak/refresh-token/refresh-token.resolver"
import {
    RefreshTokenService,
} from "@features/api/core/graphql/mutations/keycloak/refresh-token/refresh-token.service"
import {
    RefreshTokenHandler,
} from "@features/api/core/graphql/mutations/keycloak/refresh-token/refresh-token.handler"
import {
    RefreshTokenCoalescerService,
} from "@features/api/core/graphql/mutations/keycloak/refresh-token/refresh-token-coalescer.service"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

interface Deferred<T> {
    promise: Promise<T>
    resolve: (value: T) => void
    reject: (reason: unknown) => void
}

const deferred = <T>(): Deferred<T> => {
    let resolve!: (value: T) => void
    let reject!: (reason: unknown) => void
    const promise = new Promise<T>((onResolve, onReject) => {
        resolve = onResolve
        reject = onReject
    })
    return {
        promise,
        resolve,
        reject,
    }
}

const tokenSet = (sequence: number): KeycloakExchangeCodeForTokenResponse => ({
    access_token: `access-concurrent-${sequence}`,
    refresh_token: `refresh-concurrent-${sequence}`,
    expires_in: 300,
    scope: "openid",
    token_type: "Bearer",
    session_state: `session-concurrent-${sequence}`,
})

/** Concurrent browser refreshes share one rotation and recover from a failed leader. */
describe("concurrent refresh-token requests coalesce across Redis",
    () => {
        const INITIAL_TOKEN = "refresh-concurrent-initial"
        let app: INestApplication
        let redis: Redis
        let csrfToken: string
        const exchange = jest.fn()

        const graphqlRefresh = async () => request(app.getHttpServer())
            .post("/graphql")
            .set("Cookie",
                `${CookieName.KeycloakRefreshToken}=${INITIAL_TOKEN}; ${CookieName.CsrfToken}=${csrfToken}`)
            .set("x-csrf-token",
                csrfToken)
            .send({
                query: "mutation { refreshToken(request: {}) { success error data { accessToken } } }",
            })

        beforeAll(async () => {
            redis = new Redis({
                host: process.env.REDIS_BULLMQ_HOST,
                port: Number(process.env.REDIS_BULLMQ_PORT),
                password: process.env.REDIS_BULLMQ_PASSWORD,
                maxRetriesPerRequest: null,
            })
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                    CqrsModule,
                ],
                providers: [
                    RefreshTokenResolver,
                    RefreshTokenService,
                    RefreshTokenHandler,
                    RefreshTokenCoalescerService,
                    CookieService,
                    CsrfService,
                    CsrfGuard,
                    {
                        provide: createIoRedisKey(IoRedisInstanceKey.Cache),
                        useValue: redis,
                    },
                    {
                        provide: KeycloakTokenService,
                        useValue: {
                            exchangeRefreshTokenForToken: exchange,
                        },
                    },
                    {
                        provide: JwtService,
                        useValue: {
                            decode: jest.fn(),
                        },
                    },
                ],
            }).compile()
            app = moduleRef.createNestApplication()
            app.use((req: {
                headers: {
                    cookie?: string
                }
                cookies?: Record<string, string>
            }, _res: unknown, next: () => void) => {
                const raw = req.headers.cookie ?? ""
                req.cookies = Object.fromEntries(raw.split(";")
                    .filter(Boolean)
                    .map((part) => part.trim().split("=")))
                next()
            })
            await app.init()

            const cookies: Record<string, string> = {
            }
            app.get(CsrfService).issueCookie({
                res: {
                    cookie: (name: string, value: string) => {
                        cookies[name] = value
                    },
                    clearCookie: jest.fn(),
                } as never,
            })
            csrfToken = cookies[CookieName.CsrfToken]
        })

        beforeEach(async () => {
            const keys = [
                ...await redis.keys("kc:refresh:lock:*"),
                ...await redis.keys("kc:refresh:result:*"),
            ]
            await Promise.all(keys.map((key) => redis.del(key)))
            exchange.mockReset()
        })

        afterAll(async () => {
            await app?.close()
            await redis?.quit()
        })

        it("returns one rotated pair to an entire concurrent burst",
            async () => {
                const provider = deferred<KeycloakExchangeCodeForTokenResponse>()
                exchange.mockReturnValue(provider.promise)

                const responses = Array.from({
                    length: 8,
                },
                () => graphqlRefresh())
                provider.resolve(tokenSet(2))
                const settled = await Promise.all(responses)

                expect(settled.map((response) => response.body.data.refreshToken.data.accessToken))
                    .toEqual(Array.from({
                        length: 8,
                    },
                    () => "access-concurrent-2"))
                expect(settled.map((response) => response.headers["set-cookie"]?.[0]))
                    .toEqual(Array.from({
                        length: 8,
                    },
                    () => expect.stringContaining("refresh-concurrent-2")))
                expect(exchange).toHaveBeenCalledTimes(1)
                expect(await redis.keys("kc:refresh:lock:*")).toHaveLength(0)
                expect(await redis.keys("kc:refresh:result:*")).toHaveLength(1)
            })

        it("re-elects a follower after the first Keycloak leader fails",
            async () => {
                const firstAttempt = deferred<KeycloakExchangeCodeForTokenResponse>()
                const leaderEntered = deferred<void>()
                exchange
                    .mockImplementationOnce(() => {
                        leaderEntered.resolve()
                        return firstAttempt.promise
                    })
                    .mockResolvedValueOnce(tokenSet(3))

                const leaderResponse = graphqlRefresh()
                await leaderEntered.promise
                const followerResponse = graphqlRefresh()
                firstAttempt.reject(new Error("keycloak temporarily unavailable"))
                const [leader,
                    follower] = await Promise.all([
                    leaderResponse,
                    followerResponse,
                ])

                expect(leader.body.data.refreshToken.success).toBe(false)
                expect(follower.body.data.refreshToken.data.accessToken).toBe("access-concurrent-3")
                expect(follower.headers["set-cookie"]?.[0]).toContain("refresh-concurrent-3")
                expect(exchange).toHaveBeenCalledTimes(2)
                expect(await redis.keys("kc:refresh:lock:*")).toHaveLength(0)
                expect(await redis.keys("kc:refresh:result:*")).toHaveLength(1)
            })
    })
