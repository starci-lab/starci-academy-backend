import request from "supertest"
import {
    Test
} from "@nestjs/testing"
import type {
    INestApplication, CanActivate, ExecutionContext
} from "@nestjs/common"
import {
    CqrsModule
} from "@nestjs/cqrs"
import {
    GqlExecutionContext
} from "@nestjs/graphql"
import {
    JwtService
} from "@nestjs/jwt"
import {
    getEntityManagerToken
} from "@nestjs/typeorm"
import type {
    EntityManager
} from "typeorm"
import {
    ApolloServerModule
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType
} from "@modules/api/apollo/server/enums/server"
import {
    EncryptionService
} from "@modules/crypto/encryption.service"
import type {
    DecryptParams, EncryptParams
} from "@modules/crypto/types/encryption"
import {
    UserEntity
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    PrimaryPostgreSQLModule
} from "@modules/databases/postgresql/primary/primary.module"
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
    KeycloakAuthGraphQLGuard
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakJwksService
} from "@modules/integrations/keycloak/jwks.service"
import {
    KeycloakTokenService
} from "@modules/integrations/keycloak/token.service"
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
    SetupTwoFactorResolver
} from "@features/api/core/graphql/mutations/two-factor/setup-two-factor/setup-two-factor.resolver"
import {
    SetupTwoFactorService
} from "@features/api/core/graphql/mutations/two-factor/setup-two-factor/setup-two-factor.service"
import {
    SetupTwoFactorHandler
} from "@features/api/core/graphql/mutations/two-factor/setup-two-factor/setup-two-factor.handler"
import {
    ConfirmTwoFactorResolver
} from "@features/api/core/graphql/mutations/two-factor/confirm-two-factor/confirm-two-factor.resolver"
import {
    ConfirmTwoFactorService
} from "@features/api/core/graphql/mutations/two-factor/confirm-two-factor/confirm-two-factor.service"
import {
    ConfirmTwoFactorHandler
} from "@features/api/core/graphql/mutations/two-factor/confirm-two-factor/confirm-two-factor.handler"
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
    SignInVerifyOtpResolver
} from "@features/api/core/graphql/mutations/keycloak/sign-in/verify-otp/sign-in-verify-otp.resolver"
import {
    SignInVerifyOtpService
} from "@features/api/core/graphql/mutations/keycloak/sign-in/verify-otp/sign-in-verify-otp.service"
import {
    SignInVerifyOtpHandler
} from "@features/api/core/graphql/mutations/keycloak/sign-in/verify-otp/sign-in-verify-otp.handler"
import {
    TestHelpersModule
} from "@tests/helpers/test-helpers.module"

interface SignInChallenge { email: string, otp: string, payload: unknown }

/** A learner enables TOTP and every later password sign-in requires it. */
describe("a learner enables two-factor authentication and it is then required",
    () => {
        const EMAIL = "two-factor-learner@starci.test"
        const KEYCLOAK_ID = "kc-two-factor-flow"
        const TOTP_SECRET = "JBSWY3DPEHPK3PXP"
        const VALID_TOTP = "111111"
        const EMAIL_OTP = "222222"
        let app: INestApplication
        let entityManager: EntityManager
        let learner: UserEntity
        let challengeId: string
        const challenges = new Map<string, SignInChallenge>()
        const authGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                const gqlContext = GqlExecutionContext.create(context).getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = learner
                return true
            },
        }
        const gql = (query: string, variables: Record<string, unknown> = {
        }) =>
            request(app.getHttpServer()).post("/graphql").send({
                query, variables
            })

        beforeAll(async () => {
            const encryptionService = {
                encrypt: ({ plainText }: EncryptParams) => ({
                    iv: "flow-iv", authTag: "flow-auth-tag", ciphertext: Buffer.from(plainText).toString("base64")
                }),
                decrypt: ({ payload }: DecryptParams) => Buffer.from(payload.ciphertext,
                    "base64").toString("utf8"),
            }
            const otpChallengeService = {
                createActionChallenge: jest.fn(async (params: { email: string, payload: unknown }) => {
                    const id = "00000000-0000-4000-8000-000000000222"
                    challenges.set(id,
                        {
                            email: params.email, otp: EMAIL_OTP, payload: params.payload
                        })
                    return {
                        challengeId: id, otp: EMAIL_OTP, expiresInSeconds: 300
                    }
                }),
                verifyActionChallenge: jest.fn(async (params: { challengeId: string, otp: string }) => {
                    const challenge = challenges.get(params.challengeId)
                    if (!challenge) return {
                        notFound: true, mismatch: false, attemptsLeft: 0
                    }
                    if (challenge.otp !== params.otp) return {
                        notFound: false, mismatch: true, attemptsLeft: 4
                    }
                    challenges.delete(params.challengeId)
                    return {
                        email: challenge.email, payload: challenge.payload, notFound: false, mismatch: false, attemptsLeft: 5
                    }
                }),
            }
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic, useServices: false
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true, withHydration: false, withResolvers: false
                    }),
                    CqrsModule,
                ],
                providers: [
                    SetupTwoFactorResolver,
                    SetupTwoFactorService,
                    SetupTwoFactorHandler,
                    ConfirmTwoFactorResolver,
                    ConfirmTwoFactorService,
                    ConfirmTwoFactorHandler,
                    SignInInitResolver,
                    SignInInitService,
                    SignInInitHandler,
                    SignInVerifyOtpResolver,
                    SignInVerifyOtpService,
                    SignInVerifyOtpHandler,
                    {
                        provide: EncryptionService, useValue: encryptionService
                    },
                    {
                        provide: TotpService, useValue: {
                            generateSecret: jest.fn().mockReturnValue(TOTP_SECRET),
                            generateKeyUri: jest.fn().mockReturnValue("otpauth://starci/two-factor"),
                            verify: jest.fn((params: { token: string }) => params.token === VALID_TOTP),
                        }
                    },
                    {
                        provide: KeycloakTokenService, useValue: {
                            exchangePasswordForToken: jest.fn().mockResolvedValue({
                                access_token: "access-two-factor-flow", refresh_token: "refresh-two-factor-flow"
                            })
                        }
                    },
                    {
                        provide: OtpChallengeService, useValue: otpChallengeService
                    },
                    {
                        provide: EnqueueSendMailJobService, useValue: {
                            enqueue: jest.fn().mockResolvedValue(undefined)
                        }
                    },
                    {
                        provide: JwtService, useValue: {
                            decode: jest.fn().mockReturnValue({
                                sub: KEYCLOAK_ID
                            })
                        }
                    },
                    {
                        provide: CaptchaService, useValue: {
                            verify: jest.fn().mockResolvedValue(true)
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
                    {
                        provide: KeycloakJwksService, useValue: {
                        }
                    },
                ],
            }).overrideGuard(KeycloakAuthGraphQLGuard).useValue(authGuard).compile()
            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get(getEntityManagerToken("primary"))
            await entityManager.query("TRUNCATE TABLE \"users\" RESTART IDENTITY CASCADE")
            learner = await entityManager.save(entityManager.create(UserEntity,
                {
                    keycloakId: KEYCLOAK_ID, email: EMAIL, username: "two-factor-learner", twoFactorEnabled: false, twoFactorSecret: null,
                }))
        })

        afterAll(async () => { await app?.close().catch(() => undefined) })

        it("stores a pending encrypted secret without enabling the factor",
            async () => {
                const response = await gql("mutation { setupTwoFactor { success data { secret otpauthUrl } } }")
                expect(response.body.data.setupTwoFactor.data.secret).toBe(TOTP_SECRET)
                learner = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: learner.id
                    })
                expect(learner.twoFactorEnabled).toBe(false)
                expect(learner.twoFactorSecret).not.toContain(TOTP_SECRET)
            })

        it("keeps the factor disabled when authenticator proof is wrong",
            async () => {
                const response = await gql(`mutation Confirm($request: ConfirmTwoFactorRequest!) {
            confirmTwoFactor(request: $request) { success error }
        }`,
                {
                    request: {
                        code: "999999"
                    }
                })
                expect(response.body.data.confirmTwoFactor.success).toBe(false)
                const reloaded = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: learner.id
                    })
                expect(reloaded.twoFactorEnabled).toBe(false)
            })

        it("enables the factor after valid authenticator proof",
            async () => {
                const response = await gql(`mutation Confirm($request: ConfirmTwoFactorRequest!) {
            confirmTwoFactor(request: $request) { success }
        }`,
                {
                    request: {
                        code: VALID_TOTP
                    }
                })
                expect(response.body.data.confirmTwoFactor.success).toBe(true)
                learner = await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: learner.id
                    })
                expect(learner.twoFactorEnabled).toBe(true)
            })

        it("refuses password sign-in without TOTP and creates no email challenge",
            async () => {
                const response = await gql(`mutation SignIn($request: SignInInitRequest!) {
            signInInit(request: $request) { success error }
        }`,
                {
                    request: {
                        email: EMAIL, password: "correct-password"
                    }
                })
                expect(response.body.data.signInInit.success).toBe(false)
                expect(challenges.size).toBe(0)
            })

        it("accepts TOTP, then email OTP, and releases the parked session",
            async () => {
                const initiated = await gql(`mutation SignIn($request: SignInInitRequest!) {
            signInInit(request: $request) { success data { challengeId } }
        }`,
                {
                    request: {
                        email: EMAIL, password: "correct-password", twoFactorCode: VALID_TOTP
                    }
                })
                challengeId = initiated.body.data.signInInit.data.challengeId
                expect(challenges.has(challengeId)).toBe(true)
                const signedIn = await gql(`mutation Verify($request: SignInVerifyOtpRequest!) {
            signInVerifyOtp(request: $request) { success data { accessToken } }
        }`,
                {
                    request: {
                        challengeId, otp: EMAIL_OTP
                    }
                })
                expect(signedIn.body.data.signInVerifyOtp.data.accessToken).toBe("access-two-factor-flow")
                expect(challenges.has(challengeId)).toBe(false)
            })
    })
