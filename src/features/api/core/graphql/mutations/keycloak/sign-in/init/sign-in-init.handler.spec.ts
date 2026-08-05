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

describe("SignInInitHandler",
    () => {
        let module: TestingModule
        let handler: SignInInitHandler
        let otpChallengeService: jest.Mocked<Pick<OtpChallengeService, "createActionChallenge">>
        let enqueueSendMailJobService: jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>
        let keycloakTokenService: jest.Mocked<Pick<KeycloakTokenService, "exchangePasswordForToken">>

        beforeEach(async () => {
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

            module = await Test.createTestingModule({
                providers: [
                    SignInInitHandler,
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
                ],
            }).compile()

            handler = module.get<SignInInitHandler>(SignInInitHandler)
        })

        afterEach(async () => {
            await module.close()
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
                    challengeId: "chal-1",
                    expiresInSeconds: 300,
                })
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
    })
