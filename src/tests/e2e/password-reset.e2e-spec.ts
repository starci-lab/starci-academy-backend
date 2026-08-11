import request from "supertest"
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
    UserEntity
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    EnqueueSendMailJobService
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    CaptchaService
} from "@modules/integrations/captcha/captcha.service"
import {
    OtpChallengeService
} from "@modules/integrations/code/otp-challenge.service"
import {
    KeycloakTokenService
} from "@modules/integrations/keycloak/token.service"
import {
    KeycloakUserService
} from "@modules/integrations/keycloak/user.service"
import {
    TotpService
} from "@modules/integrations/totp/totp.service"
import {
    CookieService
} from "@modules/platform/cookie/cookie.service"
import {
    CsrfService
} from "@modules/platform/csrf/csrf.service"
import {
    SessionService
} from "@modules/platform/session/session.service"
import {
    ForgotPasswordInitResolver
} from "@features/api/core/graphql/mutations/keycloak/sign-in/forgot-password/init/forgot-password-init.resolver"
import {
    ForgotPasswordInitService
} from "@features/api/core/graphql/mutations/keycloak/sign-in/forgot-password/init/forgot-password-init.service"
import {
    ForgotPasswordInitHandler
} from "@features/api/core/graphql/mutations/keycloak/sign-in/forgot-password/init/forgot-password-init.handler"
import {
    ForgotPasswordVerifyOtpResolver
} from "@features/api/core/graphql/mutations/keycloak/sign-in/forgot-password/verify-otp/forgot-password-verify-otp.resolver"
import {
    ForgotPasswordVerifyOtpService
} from "@features/api/core/graphql/mutations/keycloak/sign-in/forgot-password/verify-otp/forgot-password-verify-otp.service"
import {
    ForgotPasswordVerifyOtpHandler
} from "@features/api/core/graphql/mutations/keycloak/sign-in/forgot-password/verify-otp/forgot-password-verify-otp.handler"
import {
    SignInInitResolver
} from "@features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.resolver"
import {
    SignInInitService
} from "@features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.service"
import {
    SignInInitHandler
} from "@features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler"
import {
    bootFlowWorld
} from "@tests/helpers/flow-world"
import type {
    FlowWorld
} from "@tests/helpers/flow-world"

interface ResetChallenge { email: string, otp: string, payload: unknown }

/** A locked-out learner proves mailbox ownership, changes the credential, and gets back in. */
describe("a locked-out learner resets the password and gets back in",
    () => {
        const EMAIL = "locked-out@starci.test"
        const KEYCLOAK_ID = "kc-password-reset-flow"
        const OLD_PASSWORD = "old-password"
        const NEW_PASSWORD = "new-password"
        const OTP = "333333"
        const ACCESS_TOKEN = "access-after-password-reset"
        let world: FlowWorld
        let challengeId: string
        let activePassword = OLD_PASSWORD
        const challenges = new Map<string, ResetChallenge>()
        const sentMail = jest.fn().mockResolvedValue(undefined)
        const gql = (query: string, variables: Record<string, unknown>) =>
            request(world.app.getHttpServer()).post("/graphql").send({
                query, variables
            })

        beforeAll(async () => {
            const otpChallengeService = {
                createActionChallenge: jest.fn(async (params: { email: string, payload: unknown }) => {
                    const id = "00000000-0000-4000-8000-000000000333"
                    challenges.set(id,
                        {
                            email: params.email, otp: OTP, payload: params.payload
                        })
                    return {
                        challengeId: id, otp: OTP, expiresInSeconds: 300
                    }
                }),
                verifyActionChallenge: jest.fn(async (input: { challengeId: string, otp: string }) => {
                    const challenge = challenges.get(input.challengeId)
                    if (!challenge) return {
                        mismatch: false, attemptsLeft: 0, notFound: true
                    }
                    if (challenge.otp !== input.otp) return {
                        mismatch: true, attemptsLeft: 4, notFound: false
                    }
                    challenges.delete(input.challengeId)
                    return {
                        email: challenge.email, payload: challenge.payload, mismatch: false, attemptsLeft: 5, notFound: false
                    }
                }),
            }
            const exchangePasswordForToken = jest.fn(async (credentials: { username: string, password: string }) => {
                if (credentials.username !== EMAIL || credentials.password !== activePassword) throw new Error("invalid credentials")
                return {
                    access_token: ACCESS_TOKEN, refresh_token: "refresh-after-password-reset"
                }
            })
            world = await bootFlowWorld({
                imports: [ApolloServerModule.register({
                    type: ApolloServerType.Monolithic, useServices: false
                })],
                providers: [
                    ForgotPasswordInitResolver,
                    ForgotPasswordInitService,
                    ForgotPasswordInitHandler,
                    ForgotPasswordVerifyOtpResolver,
                    ForgotPasswordVerifyOtpService,
                    ForgotPasswordVerifyOtpHandler,
                    SignInInitResolver,
                    SignInInitService,
                    SignInInitHandler,
                    {
                        provide: CaptchaService, useValue: {
                            verify: jest.fn().mockResolvedValue(true)
                        }
                    },
                    {
                        provide: OtpChallengeService, useValue: otpChallengeService
                    },
                    {
                        provide: KeycloakUserService, useValue: {
                            getUserByUsername: jest.fn().mockResolvedValue({
                                id: KEYCLOAK_ID
                            }),
                            resetUserPassword: jest.fn(async (_id: string, password: string) => { activePassword = password }),
                        }
                    },
                    {
                        provide: KeycloakTokenService, useValue: {
                            exchangePasswordForToken
                        }
                    },
                    {
                        provide: TotpService, useValue: {
                            verify: jest.fn()
                        }
                    },
                    {
                        provide: JwtService, useValue: {
                            decode: jest.fn(() => ({
                                sub: KEYCLOAK_ID, email: EMAIL
                            }))
                        }
                    },
                    {
                        provide: EnqueueSendMailJobService, useValue: {
                            enqueue: sentMail
                        }
                    },
                    {
                        provide: CookieService, useValue: {
                            attachHttpOnlyCookie: jest.fn()
                        }
                    },
                    {
                        provide: CsrfService, useValue: {
                            issueCookie: jest.fn()
                        }
                    },
                    {
                        provide: SessionService, useValue: {
                            startSession: jest.fn().mockResolvedValue(undefined)
                        }
                    },
                ],
            })
            await world.truncate("users")
            await world.entityManager.save(world.entityManager.create(UserEntity,
                {
                    keycloakId: KEYCLOAK_ID, email: EMAIL, username: "locked-out",
                }))
        })

        afterAll(async () => { await world?.close() })

        it("starts reset without changing the old credential and mails an OTP",
            async () => {
                const response = await gql(`mutation Reset($request: ForgotPasswordInitRequest!) {
            forgotPasswordInit(request: $request) { success data { challengeId } }
        }`,
                {
                    request: {
                        email: EMAIL, newPassword: NEW_PASSWORD
                    }
                })
                expect(response.status).toBe(200)
                challengeId = response.body.data.forgotPasswordInit.data.challengeId
                expect(activePassword).toBe(OLD_PASSWORD)
                expect(sentMail).toHaveBeenCalledWith(expect.objectContaining({
                    template: "forgot-password-otp"
                }))
            })

        it("applies the parked password only after the right OTP",
            async () => {
                const response = await gql(`mutation Verify($request: ForgotPasswordVerifyOtpRequest!) {
            forgotPasswordVerifyOtp(request: $request) { success data { accessToken } }
        }`,
                {
                    request: {
                        challengeId, otp: OTP
                    }
                })
                expect(response.body.data.forgotPasswordVerifyOtp.data.accessToken).toBe(ACCESS_TOKEN)
                expect(activePassword).toBe(NEW_PASSWORD)
                expect(sentMail).toHaveBeenCalledWith(expect.objectContaining({
                    template: "password-changed"
                }))
            })

        it("rejects the old credential after reset",
            async () => {
                const response = await gql(`mutation SignIn($request: SignInInitRequest!) {
            signInInit(request: $request) { success error }
        }`,
                {
                    request: {
                        email: EMAIL, password: OLD_PASSWORD
                    }
                })
                expect(response.body.data.signInInit.success).toBe(false)
            })

        it("accepts the new credential and issues a fresh sign-in challenge",
            async () => {
                const response = await gql(`mutation SignIn($request: SignInInitRequest!) {
            signInInit(request: $request) { success data { challengeId } }
        }`,
                {
                    request: {
                        email: EMAIL, password: NEW_PASSWORD
                    }
                })
                expect(response.body.data.signInInit.data.challengeId).toBe(challengeId)
            })
    })
