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
    KeycloakUserService,
} from "@modules/integrations/keycloak/user.service"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    ForgotPasswordInitCommand,
} from "./forgot-password-init.command"
import {
    ForgotPasswordInitHandler,
} from "./forgot-password-init.handler"

describe("ForgotPasswordInitHandler",
    () => {
        let module: TestingModule
        let handler: ForgotPasswordInitHandler
        let otpChallengeService: jest.Mocked<Pick<OtpChallengeService, "createActionChallenge">>
        let keycloakUserService: jest.Mocked<Pick<KeycloakUserService, "getUserByUsername">>
        let enqueueSendMailJobService: jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>

        beforeEach(async () => {
            // OTP challenge issuer -- returns the new challenge handle + otp code
            otpChallengeService = {
                createActionChallenge: jest.fn().mockResolvedValue({
                    challengeId: "chal-1",
                    otp: "123456",
                    expiresInSeconds: 300,
                }),
            } as unknown as jest.Mocked<Pick<OtpChallengeService, "createActionChallenge">>

            // resolves the Keycloak account by email (must exist to reset password)
            keycloakUserService = {
                getUserByUsername: jest.fn(),
            } as unknown as jest.Mocked<Pick<KeycloakUserService, "getUserByUsername">>

            // mail worker hand-off -- assert the reset OTP email is queued
            enqueueSendMailJobService = {
                enqueue: jest.fn(),
            } as unknown as jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>

            module = await Test.createTestingModule({
                providers: [
                    ForgotPasswordInitHandler,
                    {
                        provide: OtpChallengeService,
                        useValue: otpChallengeService,
                    },
                    {
                        provide: KeycloakUserService,
                        useValue: keycloakUserService,
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: enqueueSendMailJobService,
                    },
                ],
            }).compile()

            handler = module.get<ForgotPasswordInitHandler>(ForgotPasswordInitHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("issues an OTP carrying the new password and queues the reset email",
            async () => {
                // the account exists for the supplied email
                keycloakUserService.getUserByUsername.mockResolvedValueOnce({
                    id: "kc-1",
                } as never)

                const result = await handler.execute(
                    new ForgotPasswordInitCommand({
                        request: {
                            email: "user@example.com",
                            newPassword: "brand-new",
                        },
                    }),
                )

                // the OTP challenge embeds the keycloak id + the requested new password
                expect(otpChallengeService.createActionChallenge).toHaveBeenCalledWith(
                    expect.objectContaining({
                        email: "user@example.com",
                        payload: expect.objectContaining({
                            keycloakUserId: "kc-1",
                            newPassword: "brand-new",
                        }),
                    }),
                )
                // the reset OTP email is queued
                expect(enqueueSendMailJobService.enqueue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        subject: "Reset your password",
                    }),
                )
                expect(result).toEqual({
                    challengeId: "chal-1",
                    expiresInSeconds: 300,
                })
            })

        it("throws when no Keycloak account matches the email (no OTP issued)",
            async () => {
                // no account for this email -> reset cannot proceed
                keycloakUserService.getUserByUsername.mockResolvedValueOnce(null as never)

                await expect(
                    handler.execute(
                        new ForgotPasswordInitCommand({
                            request: {
                                email: "ghost@example.com",
                                newPassword: "brand-new",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                // neither challenge nor email runs for an unknown account
                expect(otpChallengeService.createActionChallenge).not.toHaveBeenCalled()
                expect(enqueueSendMailJobService.enqueue).not.toHaveBeenCalled()
            })
    })
