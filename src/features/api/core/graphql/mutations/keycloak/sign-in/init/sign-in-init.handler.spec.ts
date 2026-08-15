// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
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
    SignInInitCommand,
} from "./sign-in-init.command"
import {
    SignInInitHandler,
} from "./sign-in-init.handler"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"
import {
    TotpService,
} from "@modules/integrations/totp/totp.service"
import {
    TwoFactorInvalidCodeException,
} from "@modules/platform/exceptions/errors/api/two-factor-invalid-code"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    JwtService,
} from "@nestjs/jwt"
import {
    EmailBloomFilterService,
} from "@modules/bussiness/bloom-filters/email.service"

const POSTGRESQL_PRIMARY = "primary"
const originalAuthEnv = {
    nodeEnv: process.env.NODE_ENV,
    bypassEnabled: process.env.LOCAL_TEST_AUTH_BYPASS_ENABLED,
    testEmail: process.env.DEV_TEST_ACCOUNT_EMAIL,
}

const restoreEnv = (key: string, value: string | undefined): void => {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
}

describe("SignInInitHandler",
    () => {
        let module: TestingModule
        let handler: SignInInitHandler
        let otpChallengeService: jest.Mocked<Pick<OtpChallengeService, "createActionChallenge">>
        let enqueueSendMailJobService: jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>
        let keycloakTokenService: jest.Mocked<Pick<KeycloakTokenService, "exchangePasswordForToken">>
        let entityManager: EntityManagerMock
        let encryptionService: jest.Mocked<Pick<EncryptionService, "decrypt">>
        let totpService: jest.Mocked<Pick<TotpService, "verify">>
        let jwtService: jest.Mocked<Pick<JwtService, "decode">>
        let emailBloomFilterService: jest.Mocked<Pick<EmailBloomFilterService, "add">>

        beforeEach(async () => {
            process.env.NODE_ENV = "test"
            process.env.LOCAL_TEST_AUTH_BYPASS_ENABLED = "false"
            process.env.DEV_TEST_ACCOUNT_EMAIL = "test@starci.local"
            // OTP challenge issuer -- returns the new challenge handle + otp code
            otpChallengeService = {
                createActionChallenge: jest.fn(),
            } as unknown as jest.Mocked<Pick<OtpChallengeService, "createActionChallenge">>

            // mail worker hand-off -- assert the OTP email is queued
            enqueueSendMailJobService = {
                enqueue: jest.fn(),
            } as unknown as jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>

            // password is verified against Keycloak before any OTP is issued
            keycloakTokenService = {
                exchangePasswordForToken: jest.fn(),
            } as unknown as jest.Mocked<Pick<KeycloakTokenService, "exchangePasswordForToken">>
            entityManager = makeEntityManagerMock()
            entityManager.findOne.mockResolvedValue(null)
            encryptionService = {
                decrypt: jest.fn().mockReturnValue("totp-secret"),
            }
            totpService = {
                verify: jest.fn().mockReturnValue(true),
            }
            jwtService = {
                decode: jest.fn().mockReturnValue({
                    sub: "keycloak-local",
                    email: "test@starci.local",
                    preferred_username: "test",
                }),
            }
            emailBloomFilterService = {
                add: jest.fn().mockResolvedValue(undefined),
            }

            module = await Test.createTestingModule({
                providers: [
                    SignInInitHandler,
                    {
                        provide: JwtService,
                        useValue: jwtService,
                    },
                    {
                        provide: OtpChallengeService,
                        useValue: otpChallengeService,
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: enqueueSendMailJobService,
                    },
                    {
                        provide: KeycloakTokenService,
                        useValue: keycloakTokenService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: EncryptionService,
                        useValue: encryptionService,
                    },
                    {
                        provide: TotpService,
                        useValue: totpService,
                    },
                    {
                        provide: EmailBloomFilterService,
                        useValue: emailBloomFilterService,
                    },
                ],
            }).compile()

            handler = module.get<SignInInitHandler>(SignInInitHandler)
        })

        afterEach(async () => {
            await module.close()
            restoreEnv(
                "NODE_ENV",
                originalAuthEnv.nodeEnv,
            )
            restoreEnv(
                "LOCAL_TEST_AUTH_BYPASS_ENABLED",
                originalAuthEnv.bypassEnabled,
            )
            restoreEnv(
                "DEV_TEST_ACCOUNT_EMAIL",
                originalAuthEnv.testEmail,
            )
        })

        it("verifies the password, issues an OTP challenge and queues the email",
            async () => {
                // Keycloak accepts the credentials and returns the token pair
                keycloakTokenService.exchangePasswordForToken.mockResolvedValueOnce({
                    access_token: "access-1",
                    refresh_token: "refresh-1",
                } as never)
                // a fresh OTP challenge is created carrying the embedded tokens
                otpChallengeService.createActionChallenge.mockResolvedValueOnce({
                    challengeId: "chal-1",
                    otp: "123456",
                    expiresInSeconds: 300,
                } as never)

                const result = await handler.execute(
                    new SignInInitCommand({
                        request: {
                            email: "user@example.com",
                            password: "secret",
                        },
                    }),
                )

                // the password is verified against Keycloak first
                expect(keycloakTokenService.exchangePasswordForToken).toHaveBeenCalledWith({
                    username: "user@example.com",
                    password: "secret",
                })
                // the OTP challenge carries the email + freshly-exchanged tokens
                expect(otpChallengeService.createActionChallenge).toHaveBeenCalledWith(
                    expect.objectContaining({
                        email: "user@example.com",
                        payload: expect.objectContaining({
                            accessToken: "access-1",
                            refreshToken: "refresh-1",
                        }),
                    }),
                )
                // the OTP email is queued with a minutes-rounded expiry (>=1)
                expect(enqueueSendMailJobService.enqueue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        template: "sign-in-otp",
                        context: expect.objectContaining({
                            otp: "123456",
                            expiresInMinutes: 5,
                        }),
                    }),
                )
                // the challenge handle + expiry are returned to the client
                expect(result).toEqual({
                    kind: "challenge",
                    data: {
                        challengeId: "chal-1",
                        expiresInSeconds: 300,
                    },
                })
            })

        it("completes the exact local test account without creating an email challenge",
            async () => {
                process.env.LOCAL_TEST_AUTH_BYPASS_ENABLED = "true"
                keycloakTokenService.exchangePasswordForToken.mockResolvedValueOnce({
                    access_token: "access-local",
                    refresh_token: "refresh-local",
                } as never)

                const result = await handler.execute(
                    new SignInInitCommand({
                        request: {
                            email: "TEST@starci.local",
                            password: "secret",
                        },
                    }),
                )

                expect(result).toEqual({
                    kind: "session",
                    data: {
                        accessToken: "access-local",
                    },
                    refreshToken: "refresh-local",
                })
                expect(otpChallengeService.createActionChallenge).not.toHaveBeenCalled()
                expect(enqueueSendMailJobService.enqueue).not.toHaveBeenCalled()
                expect(entityManager.save).toHaveBeenCalled()
                expect(emailBloomFilterService.add).toHaveBeenCalledWith("test@starci.local")
            })

        it("reuses the existing local user for the direct session",
            async () => {
                process.env.LOCAL_TEST_AUTH_BYPASS_ENABLED = "true"
                keycloakTokenService.exchangePasswordForToken.mockResolvedValueOnce({
                    access_token: "access-local",
                    refresh_token: "refresh-local",
                } as never)
                entityManager.findOne
                    .mockResolvedValueOnce(null)
                    .mockResolvedValueOnce({
                        id: "user-existing",
                        keycloakId: "keycloak-local",
                        email: "test@starci.local",
                    })

                const result = await handler.execute(
                    new SignInInitCommand({
                        request: {
                            email: "test@starci.local",
                            password: "secret",
                        },
                    }),
                )

                expect(result.kind).toBe("session")
                expect(entityManager.save).not.toHaveBeenCalled()
                expect(emailBloomFilterService.add).not.toHaveBeenCalled()
            })

        it("keeps the OTP path for a different account when local bypass is enabled",
            async () => {
                process.env.LOCAL_TEST_AUTH_BYPASS_ENABLED = "true"
                keycloakTokenService.exchangePasswordForToken.mockResolvedValueOnce({
                    access_token: "access-1",
                    refresh_token: "refresh-1",
                } as never)
                otpChallengeService.createActionChallenge.mockResolvedValueOnce({
                    challengeId: "chal-1",
                    otp: "123456",
                    expiresInSeconds: 300,
                } as never)

                const result = await handler.execute(
                    new SignInInitCommand({
                        request: {
                            email: "other@example.com",
                            password: "secret",
                        },
                    }),
                )

                expect(result.kind).toBe("challenge")
                expect(otpChallengeService.createActionChallenge).toHaveBeenCalled()
                expect(enqueueSendMailJobService.enqueue).toHaveBeenCalled()
            })

        it("forces the OTP path in production even when local bypass is enabled",
            async () => {
                process.env.NODE_ENV = "production"
                process.env.LOCAL_TEST_AUTH_BYPASS_ENABLED = "true"
                keycloakTokenService.exchangePasswordForToken.mockResolvedValueOnce({
                    access_token: "access-1",
                    refresh_token: "refresh-1",
                } as never)
                otpChallengeService.createActionChallenge.mockResolvedValueOnce({
                    challengeId: "chal-1",
                    otp: "123456",
                    expiresInSeconds: 300,
                } as never)

                const result = await handler.execute(
                    new SignInInitCommand({
                        request: {
                            email: "test@starci.local",
                            password: "secret",
                        },
                    }),
                )

                expect(result.kind).toBe("challenge")
                expect(otpChallengeService.createActionChallenge).toHaveBeenCalled()
            })

        it("rounds a sub-minute OTP expiry up to one minute",
            async () => {
                keycloakTokenService.exchangePasswordForToken.mockResolvedValueOnce({
                    access_token: "access-1",
                    refresh_token: "refresh-1",
                } as never)
                // 30s expiry must surface as 1 minute, never 0
                otpChallengeService.createActionChallenge.mockResolvedValueOnce({
                    challengeId: "chal-1",
                    otp: "123456",
                    expiresInSeconds: 30,
                } as never)

                await handler.execute(
                    new SignInInitCommand({
                        request: {
                            email: "user@example.com",
                            password: "secret",
                        },
                    }),
                )

                expect(enqueueSendMailJobService.enqueue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        context: expect.objectContaining({
                            expiresInMinutes: 1,
                        }),
                    }),
                )
            })

        it("does not issue an OTP when password verification fails",
            async () => {
                process.env.LOCAL_TEST_AUTH_BYPASS_ENABLED = "true"
                // Keycloak rejects the credentials
                keycloakTokenService.exchangePasswordForToken.mockRejectedValueOnce(
                    new Error("invalid_grant"),
                )

                await expect(
                    handler.execute(
                        new SignInInitCommand({
                            request: {
                                email: "user@example.com",
                                password: "wrong",
                            },
                        }),
                    ),
                ).rejects.toThrow("invalid_grant")

                // no challenge + no email when the password is wrong
                expect(otpChallengeService.createActionChallenge).not.toHaveBeenCalled()
                expect(enqueueSendMailJobService.enqueue).not.toHaveBeenCalled()
            })

        it("does not create an email challenge when enrolled TOTP proof is missing",
            async () => {
                keycloakTokenService.exchangePasswordForToken.mockResolvedValueOnce({
                    access_token: "access-1",
                    refresh_token: "refresh-1",
                } as never)
                entityManager.findOne.mockResolvedValueOnce({
                    id: "user-1",
                    twoFactorEnabled: true,
                    twoFactorSecret: JSON.stringify({
                        ciphertext: "encrypted",
                    }),
                })

                await expect(handler.execute(
                    new SignInInitCommand({
                        request: {
                            email: "test@starci.local",
                            password: "secret",
                        },
                    }),
                )).rejects.toBeInstanceOf(TwoFactorInvalidCodeException)
                expect(otpChallengeService.createActionChallenge).not.toHaveBeenCalled()
            })

        it("creates the email challenge after enrolled TOTP proof succeeds",
            async () => {
                keycloakTokenService.exchangePasswordForToken.mockResolvedValueOnce({
                    access_token: "access-1",
                    refresh_token: "refresh-1",
                } as never)
                entityManager.findOne.mockResolvedValueOnce({
                    id: "user-1",
                    twoFactorEnabled: true,
                    twoFactorSecret: JSON.stringify({
                        ciphertext: "encrypted",
                    }),
                })
                otpChallengeService.createActionChallenge.mockResolvedValueOnce({
                    challengeId: "chal-1",
                    otp: "123456",
                    expiresInSeconds: 300,
                } as never)

                await handler.execute(
                    new SignInInitCommand({
                        request: {
                            email: "user@example.com",
                            password: "secret",
                            twoFactorCode: "654321",
                        },
                    }),
                )

                expect(encryptionService.decrypt).toHaveBeenCalled()
                expect(totpService.verify).toHaveBeenCalledWith({
                    secret: "totp-secret",
                    token: "654321",
                })
                expect(otpChallengeService.createActionChallenge).toHaveBeenCalled()
            })

        it("requires enrolled TOTP before completing the local test session",
            async () => {
                process.env.LOCAL_TEST_AUTH_BYPASS_ENABLED = "true"
                keycloakTokenService.exchangePasswordForToken.mockResolvedValueOnce({
                    access_token: "access-local",
                    refresh_token: "refresh-local",
                } as never)
                entityManager.findOne.mockResolvedValueOnce({
                    id: "user-1",
                    email: "test@starci.local",
                    twoFactorEnabled: true,
                    twoFactorSecret: JSON.stringify({
                        ciphertext: "encrypted",
                    }),
                })

                const result = await handler.execute(
                    new SignInInitCommand({
                        request: {
                            email: "test@starci.local",
                            password: "secret",
                            twoFactorCode: "654321",
                        },
                    }),
                )

                expect(totpService.verify).toHaveBeenCalled()
                expect(result.kind).toBe("session")
                expect(otpChallengeService.createActionChallenge).not.toHaveBeenCalled()
                expect(enqueueSendMailJobService.enqueue).not.toHaveBeenCalled()
            })
    })
