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
    KeycloakJwtInvalidPayloadException,
} from "@modules/platform/exceptions/errors/keycloak/invalid-jwt-payload"
import {
    ChallengeOtpMismatchException,
    ChallengeOtpNotFoundException,
} from "@modules/platform/exceptions/errors/users/otp"
import {
    EmailBloomFilterService,
} from "@modules/bussiness/bloom-filters/email.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    SignInVerifyOtpCommand,
} from "./sign-in-verify-otp.command"
import {
    SignInVerifyOtpHandler,
} from "./sign-in-verify-otp.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("SignInVerifyOtpHandler",
    () => {
        let module: TestingModule
        let handler: SignInVerifyOtpHandler
        let entityManager: EntityManagerMock
        let jwtService: jest.Mocked<Pick<JwtService, "decode">>
        let otpChallengeService: jest.Mocked<Pick<OtpChallengeService, "verifyActionChallenge">>
        let emailBloomFilterService: jest.Mocked<Pick<EmailBloomFilterService, "add">>

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // decodes the embedded access token into Keycloak claims
            jwtService = {
                decode: jest.fn(),
            } as unknown as jest.Mocked<Pick<JwtService, "decode">>

            // verifies the OTP against the stored challenge
            otpChallengeService = {
                verifyActionChallenge: jest.fn(),
            } as unknown as jest.Mocked<Pick<OtpChallengeService, "verifyActionChallenge">>
            emailBloomFilterService = {
                add: jest.fn(),
            }

            module = await Test.createTestingModule({
                providers: [
                    SignInVerifyOtpHandler,
                    {
                        provide: JwtService,
                        useValue: jwtService,
                    },
                    {
                        provide: OtpChallengeService,
                        useValue: otpChallengeService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: EmailBloomFilterService,
                        useValue: emailBloomFilterService,
                    },
                ],
            }).compile()

            handler = module.get<SignInVerifyOtpHandler>(SignInVerifyOtpHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("returns the tokens when the OTP is valid and the user exists",
            async () => {
                // the OTP matches and the challenge carries the issued tokens
                otpChallengeService.verifyActionChallenge.mockResolvedValueOnce({
                    notFound: false,
                    mismatch: false,
                    email: "user@example.com",
                    payload: {
                        accessToken: "access-1",
                        refreshToken: "refresh-1",
                    },
                } as never)
                // the access token decodes to a valid Keycloak subject
                jwtService.decode.mockReturnValueOnce({
                    sub: "kc-1",
                } as never)
                // the local user row exists for that subject
                entityManager.findOne.mockResolvedValueOnce({
                    id: "user-1",
                    keycloakId: "kc-1",
                })

                const result = await handler.execute(
                    new SignInVerifyOtpCommand({
                        request: {
                            challengeId: "chal-1",
                            otp: "123456",
                        },
                    }),
                )

                // the embedded tokens are handed back to the client
                expect(result).toEqual({
                    data: {
                        accessToken: "access-1",
                    },
                    refreshToken: "refresh-1",
                })
            })

        it("throws when the challenge is not found",
            async () => {
                // verify reports the challenge id is unknown / expired
                otpChallengeService.verifyActionChallenge.mockResolvedValueOnce({
                    notFound: true,
                } as never)

                await expect(
                    handler.execute(
                        new SignInVerifyOtpCommand({
                            request: {
                                challengeId: "missing",
                                otp: "123456",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ChallengeOtpNotFoundException)
            })

        it("throws on an OTP mismatch",
            async () => {
                // verify reports the supplied OTP does not match
                otpChallengeService.verifyActionChallenge.mockResolvedValueOnce({
                    notFound: false,
                    mismatch: true,
                } as never)

                await expect(
                    handler.execute(
                        new SignInVerifyOtpCommand({
                            request: {
                                challengeId: "chal-1",
                                otp: "000000",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ChallengeOtpMismatchException)
            })

        it("throws when the access token decodes to an invalid payload",
            async () => {
                // OTP is valid but the embedded token has no subject
                otpChallengeService.verifyActionChallenge.mockResolvedValueOnce({
                    notFound: false,
                    mismatch: false,
                    email: "user@example.com",
                    payload: {
                        accessToken: "access-1",
                        refreshToken: "refresh-1",
                    },
                } as never)
                jwtService.decode.mockReturnValueOnce(null as never)

                await expect(
                    handler.execute(
                        new SignInVerifyOtpCommand({
                            request: {
                                challengeId: "chal-1",
                                otp: "123456",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(KeycloakJwtInvalidPayloadException)
            })

        it("provisions the local credential user when the Keycloak subject signs in first",
            async () => {
                // OTP valid, token decodes, but the local user row is missing
                otpChallengeService.verifyActionChallenge.mockResolvedValueOnce({
                    notFound: false,
                    mismatch: false,
                    email: "user@example.com",
                    payload: {
                        accessToken: "access-1",
                        refreshToken: "refresh-1",
                    },
                } as never)
                jwtService.decode.mockReturnValueOnce({
                    sub: "kc-1",
                    email: "user@example.com",
                    preferred_username: "user@example.com",
                } as never)
                entityManager.findOne.mockResolvedValueOnce(null)

                await expect(handler.execute(
                    new SignInVerifyOtpCommand({
                        request: {
                            challengeId: "chal-1",
                            otp: "123456",
                        },
                    }),
                )).resolves.toEqual({
                    data: {
                        accessToken: "access-1" 
                    },
                    refreshToken: "refresh-1",
                })
                expect(entityManager.create).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        keycloakId: "kc-1",
                        email: "user@example.com",
                        username: "user",
                        authenticationType: "credentials",
                    }),
                )
                expect(entityManager.save).toHaveBeenCalled()
                expect(emailBloomFilterService.add).toHaveBeenCalledWith("user@example.com")
            })

    })
