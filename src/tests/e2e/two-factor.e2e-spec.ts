import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    JwtService,
} from "@nestjs/jwt"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"
import type {
    DecryptParams,
    EncryptParams,
} from "@modules/crypto/types/encryption"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    OtpChallengeService,
} from "@modules/integrations/code/otp-challenge.service"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    TotpService,
} from "@modules/integrations/totp/totp.service"
import {
    TwoFactorInvalidCodeException,
} from "@modules/platform/exceptions/errors/api/two-factor-invalid-code"
import {
    SetupTwoFactorCommand,
} from "@features/api/core/graphql/mutations/two-factor/setup-two-factor/setup-two-factor.command"
import {
    SetupTwoFactorHandler,
} from "@features/api/core/graphql/mutations/two-factor/setup-two-factor/setup-two-factor.handler"
import {
    ConfirmTwoFactorCommand,
} from "@features/api/core/graphql/mutations/two-factor/confirm-two-factor/confirm-two-factor.command"
import {
    ConfirmTwoFactorHandler,
} from "@features/api/core/graphql/mutations/two-factor/confirm-two-factor/confirm-two-factor.handler"
import {
    SignInInitCommand,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.command"
import {
    SignInInitHandler,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler"
import {
    SignInVerifyOtpCommand,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/verify-otp/sign-in-verify-otp.command"
import {
    SignInVerifyOtpHandler,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/verify-otp/sign-in-verify-otp.handler"
import {
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"

interface SignInChallenge {
    email: string
    otp: string
    payload: unknown
}

/** A learner enables TOTP and every later password sign-in requires it. */
describe("a learner enables two-factor authentication and it is then required",
    () => {
        const EMAIL = "two-factor-learner@starci.test"
        const KEYCLOAK_ID = "kc-two-factor-flow"
        const TOTP_SECRET = "JBSWY3DPEHPK3PXP"
        const VALID_TOTP = "111111"
        const EMAIL_OTP = "222222"

        let world: FlowWorld
        let commandBus: CommandBus
        let learner: UserEntity
        let challengeId: string
        const challenges = new Map<string, SignInChallenge>()

        beforeAll(async () => {
            const encryptionService = {
                encrypt: ({ plainText }: EncryptParams) => ({
                    iv: "flow-iv",
                    authTag: "flow-auth-tag",
                    ciphertext: Buffer.from(plainText).toString("base64"),
                }),
                decrypt: ({ payload }: DecryptParams) =>
                    Buffer.from(payload.ciphertext,
                        "base64").toString("utf8"),
            }
            const otpChallengeService = {
                createActionChallenge: jest.fn(async (
                    params: {
                        email: string
                        payload: unknown
                    },
                ) => {
                    const id = "two-factor-sign-in-challenge"
                    challenges.set(id,
                        {
                            email: params.email,
                            otp: EMAIL_OTP,
                            payload: params.payload,
                        })
                    return {
                        challengeId: id,
                        otp: EMAIL_OTP,
                        expiresInSeconds: 300,
                    }
                }),
                verifyActionChallenge: jest.fn(async (
                    params: {
                        challengeId: string
                        otp: string
                    },
                ) => {
                    const challenge = challenges.get(params.challengeId)
                    if (!challenge) {
                        return {
                            notFound: true,
                            mismatch: false,
                            attemptsLeft: 0,
                        }
                    }
                    if (challenge.otp !== params.otp) {
                        return {
                            notFound: false,
                            mismatch: true,
                            attemptsLeft: 4,
                        }
                    }
                    challenges.delete(params.challengeId)
                    return {
                        email: challenge.email,
                        payload: challenge.payload,
                        notFound: false,
                        mismatch: false,
                        attemptsLeft: 5,
                    }
                }),
            }

            world = await bootFlowWorld({
                providers: [
                    SetupTwoFactorHandler,
                    ConfirmTwoFactorHandler,
                    SignInInitHandler,
                    SignInVerifyOtpHandler,
                    {
                        provide: EncryptionService,
                        useValue: encryptionService,
                    },
                    {
                        provide: TotpService,
                        useValue: {
                            generateSecret: jest.fn().mockReturnValue(TOTP_SECRET),
                            generateKeyUri: jest.fn().mockReturnValue("otpauth://starci/two-factor"),
                            verify: jest.fn((params: { token: string }) => params.token === VALID_TOTP),
                        },
                    },
                    {
                        provide: KeycloakTokenService,
                        useValue: {
                            exchangePasswordForToken: jest.fn().mockResolvedValue({
                                access_token: "access-two-factor-flow",
                                refresh_token: "refresh-two-factor-flow",
                            }),
                        },
                    },
                    {
                        provide: OtpChallengeService,
                        useValue: otpChallengeService,
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: {
                            enqueue: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: JwtService,
                        useValue: {
                            decode: jest.fn().mockReturnValue({
                                sub: KEYCLOAK_ID,
                            }),
                        },
                    },
                ],
            })
            commandBus = world.app.get(CommandBus)
            await world.truncate("users")
            learner = await world.entityManager.save(
                world.entityManager.create(UserEntity,
                    {
                        keycloakId: KEYCLOAK_ID,
                        email: EMAIL,
                        username: "two-factor-learner",
                        twoFactorEnabled: false,
                        twoFactorSecret: null,
                    }),
            )
        })

        afterAll(async () => {
            await world?.close()
        })

        it("stores a pending encrypted secret without enabling the factor",
            async () => {
                const setup = await commandBus.execute(
                    new SetupTwoFactorCommand({
                        request: undefined,
                        user: learner,
                    }),
                )
                expect(setup.secret).toBe(TOTP_SECRET)

                learner = await world.entityManager.findOneByOrFail(UserEntity,
                    {
                        id: learner.id,
                    })
                expect(learner.twoFactorEnabled).toBe(false)
                expect(learner.twoFactorSecret).not.toContain(TOTP_SECRET)
            })

        it("does not enable the factor with a wrong authenticator code",
            async () => {
                await expect(commandBus.execute(
                    new ConfirmTwoFactorCommand({
                        request: {
                            code: "999999",
                        },
                        user: learner,
                    }),
                )).rejects.toBeInstanceOf(TwoFactorInvalidCodeException)

                const reloaded = await world.entityManager.findOneByOrFail(UserEntity,
                    {
                        id: learner.id,
                    })
                expect(reloaded.twoFactorEnabled).toBe(false)
            })

        it("enables the factor after valid authenticator proof",
            async () => {
                await commandBus.execute(
                    new ConfirmTwoFactorCommand({
                        request: {
                            code: VALID_TOTP,
                        },
                        user: learner,
                    }),
                )
                learner = await world.entityManager.findOneByOrFail(UserEntity,
                    {
                        id: learner.id,
                    })
                expect(learner.twoFactorEnabled).toBe(true)
            })

        it("refuses password sign-in without TOTP and creates no email challenge",
            async () => {
                await expect(commandBus.execute(
                    new SignInInitCommand({
                        request: {
                            email: EMAIL,
                            password: "correct-password",
                        },
                    }),
                )).rejects.toBeInstanceOf(TwoFactorInvalidCodeException)
                expect(challenges.size).toBe(0)
            })

        it("accepts TOTP, then email OTP, and releases the parked session token",
            async () => {
                const initiated = await commandBus.execute(
                    new SignInInitCommand({
                        request: {
                            email: EMAIL,
                            password: "correct-password",
                            twoFactorCode: VALID_TOTP,
                        },
                    }),
                )
                challengeId = initiated.challengeId
                expect(challenges.has(challengeId)).toBe(true)

                const signedIn = await commandBus.execute(
                    new SignInVerifyOtpCommand({
                        request: {
                            challengeId,
                            otp: EMAIL_OTP,
                        },
                    }),
                )
                expect(signedIn.data.accessToken).toBe("access-two-factor-flow")
                expect(challenges.has(challengeId)).toBe(false)
            })
    })
