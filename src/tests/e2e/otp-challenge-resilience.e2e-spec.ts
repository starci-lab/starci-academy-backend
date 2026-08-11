import Redis from "ioredis"
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
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    LoginSessionEntity,
} from "@modules/databases/postgresql/primary/entities/login-session.entity"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    OtpChallengeService,
} from "@modules/integrations/code/otp-challenge.service"
import {
    createIoRedisKey,
} from "@modules/lib/native/ioredis/constants"
import {
    IoRedisInstanceKey,
} from "@modules/lib/native/ioredis/enums/instance-key"
import {
    createSuperJsonServiceProvider,
} from "@modules/lib/mixin/superjson.providers"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    CsrfService,
} from "@modules/platform/csrf/csrf.service"
import {
    SessionService,
} from "@modules/platform/session/session.service"
import {
    SignInResendOtpResolver,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/resend/sign-in-resend-otp.resolver"
import {
    SignInResendOtpService,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/resend/sign-in-resend-otp.service"
import {
    SignInResendOtpHandler,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/resend/sign-in-resend-otp.handler"
import {
    SignInVerifyOtpResolver,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/verify-otp/sign-in-verify-otp.resolver"
import {
    SignInVerifyOtpService,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/verify-otp/sign-in-verify-otp.service"
import {
    SignInVerifyOtpHandler,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/verify-otp/sign-in-verify-otp.handler"
import {
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"

interface SignInPayload {
    email: string
    accessToken: string
    refreshToken: string
}

interface OtpMutationData {
    signInVerifyOtp: {
        success: boolean
        data?: {
            accessToken: string
        }
    }
}

/** An OTP remains single-use and bounded when retries and app instances race. */
describe("an OTP challenge survives retries, resend, expiry, and concurrent verification",
    () => {
        const EMAIL = "otp-resilience@starci.test"
        const KEYCLOAK_ID = "kc-otp-resilience"
        const ACCESS_TOKEN = [
            Buffer.from(JSON.stringify({
                alg: "none",
            })).toString("base64url"),
            Buffer.from(JSON.stringify({
                sub: KEYCLOAK_ID,
                email: EMAIL,
            })).toString("base64url"),
            "signature",
        ].join(".")
        const REFRESH_TOKEN = "refresh-otp-resilience"
        const mail = jest.fn().mockResolvedValue(undefined)
        let redis: Redis
        let world: FlowWorld
        let otpService: OtpChallengeService

        const createChallenge = async () => otpService.createActionChallenge<SignInPayload>({
            email: EMAIL,
            payload: {
                email: EMAIL,
                accessToken: ACCESS_TOKEN,
                refreshToken: REFRESH_TOKEN,
            },
        })
        const verify = (challengeId: string, otp: string) => world.graphql<OtpMutationData>({
            query: `
                mutation Verify($request: SignInVerifyOtpRequest!) {
                    signInVerifyOtp(request: $request) {
                        success
                        error
                        data { accessToken }
                    }
                }
            `,
            variables: {
                request: {
                    challengeId,
                    otp,
                },
            },
        })

        beforeAll(async () => {
            redis = new Redis({
                host: process.env.REDIS_BULLMQ_HOST,
                port: Number(process.env.REDIS_BULLMQ_PORT),
                password: process.env.REDIS_BULLMQ_PASSWORD,
                maxRetriesPerRequest: null,
            })
            world = await bootFlowWorld({
                imports: [
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                ],
                providers: [
                    OtpChallengeService,
                    createSuperJsonServiceProvider(),
                    SignInResendOtpResolver,
                    SignInResendOtpService,
                    SignInResendOtpHandler,
                    SignInVerifyOtpResolver,
                    SignInVerifyOtpService,
                    SignInVerifyOtpHandler,
                    CookieService,
                    CsrfService,
                    SessionService,
                    {
                        provide: createIoRedisKey(IoRedisInstanceKey.Cache),
                        useValue: redis,
                    },
                    {
                        provide: JwtService,
                        useValue: {
                            decode: jest.fn().mockReturnValue({
                                sub: KEYCLOAK_ID,
                                email: EMAIL,
                            }),
                        },
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: {
                            enqueue: mail,
                        },
                    },
                ],
            })
            otpService = world.app.get(OtpChallengeService)
        })

        beforeEach(async () => {
            await world.truncate(
                "login_sessions",
                "users",
            )
            await Promise.all((await redis.keys("auth:login_otp:challenge:*"))
                .map((key) => redis.del(key)))
            mail.mockClear()
            await world.entityManager.save(world.entityManager.create(UserEntity,
                {
                    keycloakId: KEYCLOAK_ID,
                    email: EMAIL,
                    username: "otp-resilience",
                }))
        })

        afterAll(async () => {
            await world?.close()
            await redis?.quit()
        })

        it("deletes a challenge after five wrong codes and rejects the right code afterward",
            async () => {
                const challenge = await createChallenge()
                const key = `auth:login_otp:challenge:${challenge.challengeId}`

                expect((await verify(challenge.challengeId,
                    "999999")).data?.signInVerifyOtp.success).toBe(false)
                expect((await verify(challenge.challengeId,
                    "999999")).data?.signInVerifyOtp.success).toBe(false)
                expect((await verify(challenge.challengeId,
                    "999999")).data?.signInVerifyOtp.success).toBe(false)
                expect((await verify(challenge.challengeId,
                    "999999")).data?.signInVerifyOtp.success).toBe(false)
                const beforeLockout = JSON.parse(await redis.get(key) ?? "{}") as {
                    json?: {
                        attempts?: number
                    }
                }
                expect(beforeLockout.json?.attempts).toBe(4)
                expect((await verify(challenge.challengeId,
                    "999999")).data?.signInVerifyOtp.success).toBe(false)
                expect(await redis.exists(key)).toBe(0)

                const lockedOut = await verify(challenge.challengeId,
                    challenge.otp)
                expect(lockedOut.data?.signInVerifyOtp.success).toBe(false)
                expect(await world.entityManager.count(LoginSessionEntity)).toBe(0)
            })

        it("does not revive an expired challenge",
            async () => {
                const challenge = await createChallenge()
                await redis.pexpire(`auth:login_otp:challenge:${challenge.challengeId}`,
                    0)

                const expired = await verify(challenge.challengeId,
                    challenge.otp)

                expect(expired.data?.signInVerifyOtp.success).toBe(false)
                expect(await world.entityManager.count(LoginSessionEntity)).toBe(0)
            })

        it("invalidates the old code on resend and consumes the replacement once",
            async () => {
                const challenge = await createChallenge()
                const resent = await world.graphql<{
                    signInResendOtp: {
                        success: boolean
                    }
                }>({
                    query: `
                        mutation Resend($request: SignInResendOtpRequest!) {
                            signInResendOtp(request: $request) { success error }
                        }
                    `,
                    variables: {
                        request: {
                            challengeId: challenge.challengeId,
                        },
                    },
                })
                const replacementOtp = mail.mock.calls[0][0].context.otp as string

                expect(resent.data?.signInResendOtp.success).toBe(true)
                expect((await verify(challenge.challengeId,
                    challenge.otp)).data?.signInVerifyOtp.success).toBe(false)
                expect((await verify(challenge.challengeId,
                    replacementOtp)).data?.signInVerifyOtp.success).toBe(true)
                expect((await verify(challenge.challengeId,
                    replacementOtp)).data?.signInVerifyOtp.success).toBe(false)
                expect(await world.entityManager.count(LoginSessionEntity)).toBe(1)
            })

        it("allows exactly one winner when two requests verify the same code concurrently",
            async () => {
                const challenge = await createChallenge()

                const outcomes = await Promise.all([
                    verify(challenge.challengeId,
                        challenge.otp),
                    verify(challenge.challengeId,
                        challenge.otp),
                ])

                expect(outcomes.map((result) => result.data?.signInVerifyOtp.success).sort())
                    .toEqual([
                        false,
                        true,
                    ])
                expect(await world.entityManager.count(LoginSessionEntity)).toBe(1)
                expect(await redis.exists(`auth:login_otp:challenge:${challenge.challengeId}`))
                    .toBe(0)
            })
    })
