import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    JwtService,
} from "@nestjs/jwt"
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
    KeycloakUserService,
} from "@modules/integrations/keycloak/user.service"
import {
    TotpService,
} from "@modules/integrations/totp/totp.service"
import {
    ForgotPasswordInitCommand,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/forgot-password/init/forgot-password-init.command"
import {
    ForgotPasswordInitHandler,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/forgot-password/init/forgot-password-init.handler"
import {
    ForgotPasswordVerifyOtpCommand,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/forgot-password/verify-otp/forgot-password-verify-otp.command"
import {
    ForgotPasswordVerifyOtpHandler,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/forgot-password/verify-otp/forgot-password-verify-otp.handler"
import {
    SignInInitCommand,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.command"
import {
    SignInInitHandler,
} from "@features/api/core/graphql/mutations/keycloak/sign-in/init/sign-in-init.handler"
import {
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"

interface ResetChallenge {
    email: string
    otp: string
    payload: unknown
}

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
        let commandBus: CommandBus
        let challengeId: string
        let activePassword = OLD_PASSWORD
        const challenges = new Map<string, ResetChallenge>()
        const sentMail = jest.fn().mockResolvedValue(undefined)

        beforeAll(async () => {
            const otpChallengeService = {
                createActionChallenge: jest.fn(async (
                    params: {
                        email: string
                        payload: unknown
                    },
                ) => {
                    const id = "password-reset-challenge"
                    challenges.set(id,
                        {
                            email: params.email,
                            otp: OTP,
                            payload: params.payload,
                        })
                    return {
                        challengeId: id,
                        otp: OTP,
                        expiresInSeconds: 300,
                    }
                }),
                verifyActionChallenge: jest.fn(async (
                    input: {
                        challengeId: string
                        otp: string
                    },
                ) => {
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
            const exchangePasswordForToken = jest.fn(async (
                credentials: {
                    username: string
                    password: string
                },
            ) => {
                if (credentials.username !== EMAIL || credentials.password !== activePassword) {
                    throw new Error("invalid credentials")
                }
                return {
                    access_token: ACCESS_TOKEN,
                    refresh_token: "refresh-after-password-reset",
                }
            })

            world = await bootFlowWorld({
                providers: [
                    ForgotPasswordInitHandler,
                    ForgotPasswordVerifyOtpHandler,
                    SignInInitHandler,
                    {
                        provide: OtpChallengeService,
                        useValue: otpChallengeService,
                    },
                    {
                        provide: KeycloakUserService,
                        useValue: {
                            getUserByUsername: jest.fn().mockResolvedValue({
                                id: KEYCLOAK_ID,
                            }),
                            resetUserPassword: jest.fn(async (
                                _keycloakUserId: string,
                                password: string,
                            ) => {
                                activePassword = password
                            }),
                        },
                    },
                    {
                        provide: KeycloakTokenService,
                        useValue: {
                            exchangePasswordForToken,
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
                            })),
                        },
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: {
                            enqueue: sentMail,
                        },
                    },
                ],
            })
            commandBus = world.app.get(CommandBus)
            await world.truncate("users")
            await world.entityManager.save(
                world.entityManager.create(UserEntity,
                    {
                        keycloakId: KEYCLOAK_ID,
                        email: EMAIL,
                        username: "locked-out",
                    }),
            )
        })

        afterAll(async () => {
            await world?.close()
        })

        it("starts reset without changing the old credential and mails an OTP",
            async () => {
                const initiated = await commandBus.execute(
                    new ForgotPasswordInitCommand({
                        request: {
                            email: EMAIL,
                            newPassword: NEW_PASSWORD,
                        },
                    }),
                )
                challengeId = initiated.challengeId
                expect(activePassword).toBe(OLD_PASSWORD)
                expect(sentMail).toHaveBeenCalledWith(
                    expect.objectContaining({
                        template: "forgot-password-otp",
                        context: expect.objectContaining({
                            otp: OTP,
                        }),
                    }),
                )
            })

        it("applies the parked password only after the correct OTP and returns a new token",
            async () => {
                const verified = await commandBus.execute(
                    new ForgotPasswordVerifyOtpCommand({
                        request: {
                            challengeId,
                            otp: OTP,
                        },
                    }),
                )
                expect(activePassword).toBe(NEW_PASSWORD)
                expect(verified.data.accessToken).toBe(ACCESS_TOKEN)
                expect(sentMail).toHaveBeenCalledWith(
                    expect.objectContaining({
                        template: "password-changed",
                    }),
                )
            })

        it("rejects the old credential after reset",
            async () => {
                await expect(commandBus.execute(
                    new SignInInitCommand({
                        request: {
                            email: EMAIL,
                            password: OLD_PASSWORD,
                        },
                    }),
                )).rejects.toThrow("invalid credentials")
            })

        it("accepts the new credential and issues the next sign-in challenge",
            async () => {
                const initiated = await commandBus.execute(
                    new SignInInitCommand({
                        request: {
                            email: EMAIL,
                            password: NEW_PASSWORD,
                        },
                    }),
                )
                expect(initiated.challengeId).toBe("password-reset-challenge")
            })
    })
