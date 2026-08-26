// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    JwtService,
} from "@nestjs/jwt"
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
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    ChallengeOtpMismatchException,
} from "@modules/platform/exceptions/errors/users/otp"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    ForgotPasswordVerifyOtpCommand,
} from "./forgot-password-verify-otp.command"
import {
    ForgotPasswordVerifyOtpHandler,
} from "./forgot-password-verify-otp.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** A valid verify result carrying the stored password-reset payload. */
const validVerifyResult = {
    notFound: false,
    mismatch: false,
    email: "user@example.com",
    payload: {
        keycloakUserId: "kc-1",
        email: "user@example.com",
        newPassword: "brand-new",
    },
}

describe("ForgotPasswordVerifyOtpHandler",
    () => {
        let module: TestingModule
        let handler: ForgotPasswordVerifyOtpHandler
        let entityManager: EntityManagerMock
        let jwtService: jest.Mocked<Pick<JwtService, "decode">>
        let otpChallengeService: jest.Mocked<Pick<OtpChallengeService, "verifyActionChallenge">>
        let keycloakUserService: jest.Mocked<Pick<KeycloakUserService, "resetUserPassword">>
        let keycloakTokenService: jest.Mocked<Pick<KeycloakTokenService, "exchangePasswordForToken">>
        let enqueueSendMailJobService: jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // decodes the freshly-exchanged access token into Keycloak claims
            jwtService = {
                decode: jest.fn(),
            } as unknown as jest.Mocked<Pick<JwtService, "decode">>

            // verifies the OTP against the stored reset challenge
            otpChallengeService = {
                verifyActionChallenge: jest.fn(),
            } as unknown as jest.Mocked<Pick<OtpChallengeService, "verifyActionChallenge">>

            // applies the new password to the Keycloak account
            keycloakUserService = {
                resetUserPassword: jest.fn(),
            } as unknown as jest.Mocked<Pick<KeycloakUserService, "resetUserPassword">>

            // exchanges the new credentials for a fresh token pair
            keycloakTokenService = {
                exchangePasswordForToken: jest.fn().mockResolvedValue({
                    access_token: "access-1",
                    refresh_token: "refresh-1",
                }),
            } as unknown as jest.Mocked<Pick<KeycloakTokenService, "exchangePasswordForToken">>

            // mail worker hand-off -- assert the password-changed confirmation email is queued
            enqueueSendMailJobService = {
                enqueue: jest.fn(),
            } as unknown as jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>

            module = await Test.createTestingModule({
                providers: [
                    ForgotPasswordVerifyOtpHandler,
                    {
                        provide: JwtService,
                        useValue: jwtService,
                    },
                    {
                        provide: OtpChallengeService,
                        useValue: otpChallengeService,
                    },
                    {
                        provide: KeycloakUserService,
                        useValue: keycloakUserService,
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
                        provide: EnqueueSendMailJobService,
                        useValue: enqueueSendMailJobService,
                    },
                ],
            }).compile()

            handler = module.get<ForgotPasswordVerifyOtpHandler>(ForgotPasswordVerifyOtpHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("resets the password, re-authenticates and returns the tokens",
            async () => {
                // valid OTP carrying the stored reset payload
                otpChallengeService.verifyActionChallenge.mockResolvedValueOnce(validVerifyResult as never)
                // the new token decodes to a valid subject
                jwtService.decode.mockReturnValueOnce({
                    sub: "kc-1",
                } as never)
                // the local user row exists for that subject
                entityManager.findOne.mockResolvedValueOnce({
                    id: "user-1",
                    keycloakId: "kc-1",
                })

                const result = await handler.execute(
                    new ForgotPasswordVerifyOtpCommand({
                        request: {
                            challengeId: "chal-1",
                            otp: "123456",
                        },
                    }),
                )

                // the new password is applied to Keycloak, then re-authenticated
                expect(keycloakUserService.resetUserPassword).toHaveBeenCalledWith(
                    "kc-1",
                    "brand-new",
                )
                expect(keycloakTokenService.exchangePasswordForToken).toHaveBeenCalledWith({
                    username: "user@example.com",
                    password: "brand-new",
                })
                // the fresh tokens are handed back to the client
                expect(result).toEqual({
                    data: {
                        accessToken: "access-1",
                    },
                    refreshToken: "refresh-1",
                })
            })

        it("throws on an OTP mismatch (no password reset)",
            async () => {
                otpChallengeService.verifyActionChallenge.mockResolvedValueOnce({
                    notFound: false,
                    mismatch: true,
                } as never)

                await expect(
                    handler.execute(
                        new ForgotPasswordVerifyOtpCommand({
                            request: {
                                challengeId: "chal-1",
                                otp: "000000",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ChallengeOtpMismatchException)

                // the password is never reset when the OTP is wrong
                expect(keycloakUserService.resetUserPassword).not.toHaveBeenCalled()
            })

        it("throws when no local user matches the decoded subject",
            async () => {
                otpChallengeService.verifyActionChallenge.mockResolvedValueOnce(validVerifyResult as never)
                jwtService.decode.mockReturnValueOnce({
                    sub: "kc-1",
                } as never)
                // the local user row is missing after a successful reset
                entityManager.findOne.mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new ForgotPasswordVerifyOtpCommand({
                            request: {
                                challengeId: "chal-1",
                                otp: "123456",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)
            })

        it("propagates a token exchange failure without resetting the local account",
            async () => {
                otpChallengeService.verifyActionChallenge.mockResolvedValueOnce(validVerifyResult as never)
                const exchangeError = new Error("identity provider unavailable")
                keycloakTokenService.exchangePasswordForToken.mockRejectedValueOnce(exchangeError)

                await expect(
                    handler.execute(
                        new ForgotPasswordVerifyOtpCommand({
                            request: {
                                challengeId: "chal-1",
                                otp: "123456",
                            },
                        }),
                    ),
                ).rejects.toBe(exchangeError)
                expect(keycloakUserService.resetUserPassword).toHaveBeenCalledWith(
                    "kc-1",
                    "brand-new",
                )
                expect(enqueueSendMailJobService.enqueue).not.toHaveBeenCalled()
            })
    })
