// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` — dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness"
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
    EmailBloomFilterService,
} from "@modules/bussiness"
import {
    OtpChallengeService,
} from "@modules/code"
import {
    KeycloakTokenService,
    KeycloakUserService,
} from "@modules/keycloak"
import {
    ChallengeOtpMismatchException,
    InvalidJwtPayloadException,
} from "@modules/exceptions"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import {
    SignUpVerifyOtpCommand,
} from "./sign-up-verify-otp.command"
import {
    SignUpVerifyOtpHandler,
} from "./sign-up-verify-otp.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** A valid verify result carrying the stored sign-up payload. */
const validVerifyResult = {
    notFound: false,
    mismatch: false,
    email: "new@example.com",
    payload: {
        keycloakUserId: "kc-1",
        email: "new@example.com",
        password: "secret",
        username: "newbie",
    },
}

describe("SignUpVerifyOtpHandler",
    () => {
        let module: TestingModule
        let handler: SignUpVerifyOtpHandler
        let entityManager: EntityManagerMock
        let jwtService: jest.Mocked<Pick<JwtService, "decode">>
        let otpChallengeService: jest.Mocked<Pick<OtpChallengeService, "verifyActionChallenge">>
        let keycloakTokenService: jest.Mocked<Pick<KeycloakTokenService, "exchangePasswordForToken">>
        let keycloakUserService: jest.Mocked<Pick<KeycloakUserService, "setUserEmailVerified">>
        let emailBloomFilterService: jest.Mocked<Pick<EmailBloomFilterService, "add">>

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // decodes the freshly-exchanged access token into Keycloak claims
            jwtService = {
                decode: jest.fn(),
            } as unknown as jest.Mocked<Pick<JwtService, "decode">>

            // verifies the OTP against the stored sign-up challenge
            otpChallengeService = {
                verifyActionChallenge: jest.fn(),
            } as unknown as jest.Mocked<Pick<OtpChallengeService, "verifyActionChallenge">>

            // exchanges the stored credentials for a token pair after verification
            keycloakTokenService = {
                exchangePasswordForToken: jest.fn().mockResolvedValue({
                    access_token: "access-1",
                    refresh_token: "refresh-1",
                }),
            } as unknown as jest.Mocked<Pick<KeycloakTokenService, "exchangePasswordForToken">>

            // flips the Keycloak account to email-verified
            keycloakUserService = {
                setUserEmailVerified: jest.fn(),
            } as unknown as jest.Mocked<Pick<KeycloakUserService, "setUserEmailVerified">>

            // records the new user's email in the existence bloom filter
            emailBloomFilterService = {
                add: jest.fn(),
            } as unknown as jest.Mocked<Pick<EmailBloomFilterService, "add">>

            module = await Test.createTestingModule({
                providers: [
                    SignUpVerifyOtpHandler,
                    {
                        provide: JwtService,
                        useValue: jwtService,
                    },
                    {
                        provide: OtpChallengeService,
                        useValue: otpChallengeService,
                    },
                    {
                        provide: KeycloakTokenService,
                        useValue: keycloakTokenService,
                    },
                    {
                        provide: KeycloakUserService,
                        useValue: keycloakUserService,
                    },
                    {
                        provide: EmailBloomFilterService,
                        useValue: emailBloomFilterService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<SignUpVerifyOtpHandler>(SignUpVerifyOtpHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("verifies email, creates the local user and returns the tokens",
            async () => {
                // valid OTP carrying the stored sign-up payload
                otpChallengeService.verifyActionChallenge.mockResolvedValueOnce(validVerifyResult as never)
                // exchanged token decodes to a valid subject
                jwtService.decode.mockReturnValueOnce({
                    sub: "kc-1",
                    email: "new@example.com",
                    preferred_username: "newbie",
                } as never)
                // no local user yet → one is created
                entityManager.findOne.mockResolvedValueOnce(null)

                const result = await handler.execute(
                    new SignUpVerifyOtpCommand({
                        request: {
                            challengeId: "chal-1",
                            otp: "123456",
                        },
                    }),
                )

                // the Keycloak account is marked email-verified
                expect(keycloakUserService.setUserEmailVerified).toHaveBeenCalledWith("kc-1")
                // a local user row is created and the email recorded in the bloom filter
                expect(entityManager.save).toHaveBeenCalled()
                expect(emailBloomFilterService.add).toHaveBeenCalledWith("new@example.com")
                // the new tokens are returned
                expect(result).toEqual({
                    data: {
                        accessToken: "access-1",
                    },
                    refreshToken: "refresh-1",
                })
            })

        it("does not recreate the local user when one already exists",
            async () => {
                otpChallengeService.verifyActionChallenge.mockResolvedValueOnce(validVerifyResult as never)
                jwtService.decode.mockReturnValueOnce({
                    sub: "kc-1",
                    email: "new@example.com",
                } as never)
                // the local user already exists for this subject
                entityManager.findOne.mockResolvedValueOnce({
                    id: "user-1",
                    keycloakId: "kc-1",
                })

                await handler.execute(
                    new SignUpVerifyOtpCommand({
                        request: {
                            challengeId: "chal-1",
                            otp: "123456",
                        },
                    }),
                )

                // no save / bloom-filter write when the user is already present
                expect(entityManager.save).not.toHaveBeenCalled()
                expect(emailBloomFilterService.add).not.toHaveBeenCalled()
            })

        it("throws on an OTP mismatch (no token exchange)",
            async () => {
                otpChallengeService.verifyActionChallenge.mockResolvedValueOnce({
                    notFound: false,
                    mismatch: true,
                } as never)

                await expect(
                    handler.execute(
                        new SignUpVerifyOtpCommand({
                            request: {
                                challengeId: "chal-1",
                                otp: "000000",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ChallengeOtpMismatchException)

                // the credentials are never exchanged when the OTP is wrong
                expect(keycloakTokenService.exchangePasswordForToken).not.toHaveBeenCalled()
            })

        it("throws when the exchanged token decodes to an invalid payload",
            async () => {
                otpChallengeService.verifyActionChallenge.mockResolvedValueOnce(validVerifyResult as never)
                // decode yields no subject → invalid payload
                jwtService.decode.mockReturnValueOnce(null as never)

                await expect(
                    handler.execute(
                        new SignUpVerifyOtpCommand({
                            request: {
                                challengeId: "chal-1",
                                otp: "123456",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(InvalidJwtPayloadException)
            })
    })
