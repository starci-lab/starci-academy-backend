import request from "supertest"
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
    EmailBloomFilterService,
} from "@modules/bussiness/bloom-filters/email.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    CaptchaService,
} from "@modules/integrations/captcha/captcha.service"
import {
    OtpChallengeService,
} from "@modules/integrations/code/otp-challenge.service"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    KeycloakUserService,
} from "@modules/integrations/keycloak/user.service"
import {
    TotpService,
} from "@modules/integrations/totp/totp.service"
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
    SignUpInitResolver,
} from "@features/api/core/graphql/mutations/keycloak/sign-up/init/sign-up-init.resolver"
import {
    SignUpInitService,
} from "@features/api/core/graphql/mutations/keycloak/sign-up/init/sign-up-init.service"
import {
    SignUpInitHandler,
} from "@features/api/core/graphql/mutations/keycloak/sign-up/init/sign-up-init.handler"
import {
    SignUpVerifyOtpResolver,
} from "@features/api/core/graphql/mutations/keycloak/sign-up/verify-otp/sign-up-verify-otp.resolver"
import {
    SignUpVerifyOtpService,
} from "@features/api/core/graphql/mutations/keycloak/sign-up/verify-otp/sign-up-verify-otp.service"
import {
    SignUpVerifyOtpHandler,
} from "@features/api/core/graphql/mutations/keycloak/sign-up/verify-otp/sign-up-verify-otp.handler"
import {
    SignInInitResolver,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.resolver"
import {
    SignInInitService,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.service"
import {
    SignInInitHandler,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler"
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

interface StoredChallenge {
    email: string
    otp: string
    payload: unknown
}

/** A stranger registers, verifies, and signs in through the production GraphQL boundary. */
describe("a stranger registers, verifies, and signs in",
    () => {
        const EMAIL = "new-learner@starci.test"
        const PASSWORD = "correct-horse-battery"
        const KEYCLOAK_ID = "kc-signup-and-signin-flow"
        const ACCESS_TOKEN = "access-signup-and-signin-flow"
        const REFRESH_TOKEN = "refresh-signup-and-signin-flow"

        let world: FlowWorld
        let signUpChallengeId: string
        let signInChallengeId: string
        let learner: UserEntity
        let challengeSequence = 0
        const challenges = new Map<string, StoredChallenge>()
        const sentMail = jest.fn().mockResolvedValue(undefined)
        const attachHttpOnlyCookie = jest.fn()
        const issueCsrfCookie = jest.fn()
        const startSession = jest.fn().mockResolvedValue(undefined)
        const originalBypassEnabled = process.env.LOCAL_TEST_AUTH_BYPASS_ENABLED
        const originalTestEmail = process.env.DEV_TEST_ACCOUNT_EMAIL

        const otpChallengeService = {
            createActionChallenge: jest.fn(async (params: { email: string, payload: unknown }) => {
                challengeSequence += 1
                const challengeId = `challenge-${challengeSequence}`
                const otp = challengeSequence === 1 ? "111111" : "222222"
                challenges.set(challengeId,
                    {
                        email: params.email,
                        otp,
                        payload: params.payload,
                    })
                return {
                    challengeId,
                    otp,
                    expiresInSeconds: 300,
                }
            }),
            verifyActionChallenge: jest.fn(async (input: { challengeId: string, otp: string }) => {
                const challenge = challenges.get(input.challengeId)
                if (!challenge) {
                    return {
                        mismatch: false,
                        attemptsLeft: 0,
                        notFound: true,
                    }
                }
                if (challenge.otp !== input.otp) {
                    return {
                        mismatch: true,
                        attemptsLeft: 4,
                        notFound: false,
                    }
                }
                challenges.delete(input.challengeId)
                return {
                    email: challenge.email,
                    payload: challenge.payload,
                    mismatch: false,
                    attemptsLeft: 5,
                    notFound: false,
                }
            }),
        }
        const gql = (query: string, variables: Record<string, unknown>) =>
            request(world.app.getHttpServer())
                .post("/graphql")
                .send({
                    query,
                    variables,
                })

        beforeAll(async () => {
            world = await bootFlowWorld({
                imports: [
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                ],
                providers: [
                    SignUpInitResolver,
                    SignUpInitService,
                    SignUpInitHandler,
                    SignUpVerifyOtpResolver,
                    SignUpVerifyOtpService,
                    SignUpVerifyOtpHandler,
                    SignInInitResolver,
                    SignInInitService,
                    SignInInitHandler,
                    SignInVerifyOtpResolver,
                    SignInVerifyOtpService,
                    SignInVerifyOtpHandler,
                    {
                        provide: CaptchaService,
                        useValue: {
                            verify: jest.fn().mockResolvedValue(true),
                        },
                    },
                    {
                        provide: OtpChallengeService,
                        useValue: otpChallengeService,
                    },
                    {
                        provide: KeycloakTokenService,
                        useValue: {
                            registerUserWithPassword: jest.fn().mockResolvedValue(KEYCLOAK_ID),
                            exchangePasswordForToken: jest.fn().mockResolvedValue({
                                access_token: ACCESS_TOKEN,
                                refresh_token: REFRESH_TOKEN,
                            }),
                        },
                    },
                    {
                        provide: KeycloakUserService,
                        useValue: {
                            getUserByUsername: jest.fn().mockResolvedValue(null),
                            setUserEmailVerified: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: TotpService,
                        useValue: {
                            verify: jest.fn(),
                        },
                    },
                    {
                        provide: JwtService,
                        useValue: {
                            decode: jest.fn(() => ({
                                sub: KEYCLOAK_ID,
                                email: EMAIL,
                                preferred_username: "new-learner",
                            })),
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
                            enqueue: sentMail,
                        },
                    },
                    {
                        provide: CookieService,
                        useValue: {
                            attachHttpOnlyCookie,
                        },
                    },
                    {
                        provide: CsrfService,
                        useValue: {
                            issueCookie: issueCsrfCookie,
                        },
                    },
                    {
                        provide: SessionService,
                        useValue: {
                            startSession,
                        },
                    },
                ],
            })
            await world.truncate("users")
        })

        afterAll(async () => {
            if (originalBypassEnabled === undefined) delete process.env.LOCAL_TEST_AUTH_BYPASS_ENABLED
            else process.env.LOCAL_TEST_AUTH_BYPASS_ENABLED = originalBypassEnabled
            if (originalTestEmail === undefined) delete process.env.DEV_TEST_ACCOUNT_EMAIL
            else process.env.DEV_TEST_ACCOUNT_EMAIL = originalTestEmail
            await world?.close()
        })

        it("starts registration and sends the verification code without creating a local user",
            async () => {
                const response = await gql(`
                    mutation SignUp($request: SignUpInitRequest!) {
                        signUpInit(request: $request) { success data { challengeId } }
                    }
                `,
                {
                    request: {
                        email: EMAIL,
                        password: PASSWORD,
                        username: "new-learner",
                        firstName: "New",
                        lastName: "Learner",
                    },
                })
                expect(response.status).toBe(200)
                expect(response.body.errors).toBeUndefined()
                signUpChallengeId = response.body.data.signUpInit.data.challengeId
                expect(await world.entityManager.count(UserEntity)).toBe(0)
                expect(sentMail).toHaveBeenCalledWith(expect.objectContaining({
                    template: "sign-up-otp",
                    context: expect.objectContaining({
                        otp: "111111",
                    }),
                }))
            })

        it("keeps the identity closed when the verification code is wrong",
            async () => {
                const response = await gql(`
                    mutation Verify($request: SignUpVerifyOtpInput!) {
                        signUpVerifyOtp(request: $request) { success error }
                    }
                `,
                {
                    request: {
                        challengeId: signUpChallengeId,
                        otp: "999999",
                    },
                })
                expect(response.body.data.signUpVerifyOtp.success).toBe(false)
                expect(await world.entityManager.count(UserEntity)).toBe(0)
            })

        it("consumes the right code and persists the local identity",
            async () => {
                const response = await gql(`
                    mutation Verify($request: SignUpVerifyOtpInput!) {
                        signUpVerifyOtp(request: $request) { success data { accessToken } }
                    }
                `,
                {
                    request: {
                        challengeId: signUpChallengeId,
                        otp: "111111",
                    },
                })
                expect(response.body.data.signUpVerifyOtp.data.accessToken).toBe(ACCESS_TOKEN)
                learner = await world.entityManager.findOneOrFail(UserEntity,
                    {
                        where: {
                            keycloakId: KEYCLOAK_ID,
                        },
                    })
                expect(learner.email).toBe(EMAIL)
                expect(learner.username).toBe("new-learner")
            })

        it("checks the password again and sends a fresh sign-in code",
            async () => {
                const response = await gql(`
                    mutation SignIn($request: SignInInitRequest!) {
                        signInInit(request: $request) { success data { challengeId } }
                    }
                `,
                {
                    request: {
                        email: EMAIL,
                        password: PASSWORD,
                    },
                })
                signInChallengeId = response.body.data.signInInit.data.challengeId
                expect(signInChallengeId).not.toBe(signUpChallengeId)
                expect(sentMail).toHaveBeenCalledWith(expect.objectContaining({
                    template: "sign-in-otp",
                    context: expect.objectContaining({
                        otp: "222222",
                    }),
                }))
            })

        it("finishes sign-in and returns the session for the persisted identity",
            async () => {
                const signedIn = await gql(`
                    mutation Verify($request: SignInVerifyOtpRequest!) {
                        signInVerifyOtp(request: $request) { success data { accessToken } }
                    }
                `,
                {
                    request: {
                        challengeId: signInChallengeId,
                        otp: "222222",
                    },
                })
                expect(signedIn.body.data.signInVerifyOtp.data.accessToken).toBe(ACCESS_TOKEN)
                const persisted = await world.entityManager.findOneByOrFail(UserEntity,
                    {
                        id: learner.id,
                    })
                expect(persisted.keycloakId).toBe(KEYCLOAK_ID)
            })

        it("completes the explicitly enabled local test sign-in at the init boundary",
            async () => {
                process.env.LOCAL_TEST_AUTH_BYPASS_ENABLED = "true"
                process.env.DEV_TEST_ACCOUNT_EMAIL = EMAIL
                const challengeCount = challenges.size
                const mailCount = sentMail.mock.calls.length

                const response = await gql(`
                    mutation LocalTestSignIn($request: SignInInitRequest!) {
                        signInInit(request: $request) {
                            success
                            data { challengeId expiresInSeconds accessToken }
                        }
                    }
                `,
                {
                    request: {
                        email: EMAIL,
                        password: PASSWORD,
                    },
                })

                expect(response.body.errors).toBeUndefined()
                expect(response.body.data.signInInit.data).toEqual({
                    challengeId: null,
                    expiresInSeconds: null,
                    accessToken: ACCESS_TOKEN,
                })
                expect(challenges.size).toBe(challengeCount)
                expect(sentMail).toHaveBeenCalledTimes(mailCount)
                expect(attachHttpOnlyCookie).toHaveBeenCalled()
                expect(issueCsrfCookie).toHaveBeenCalled()
                expect(startSession).toHaveBeenCalledWith(expect.objectContaining({
                    accessToken: ACCESS_TOKEN,
                }))
                expect(await world.entityManager.findOneByOrFail(UserEntity,
                    {
                        id: learner.id,
                    })).toBeDefined()
            })
    })
