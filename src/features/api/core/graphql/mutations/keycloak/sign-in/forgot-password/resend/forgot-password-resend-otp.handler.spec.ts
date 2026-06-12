// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` — dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness"
import {
    OtpChallengeService,
} from "@modules/code"
import {
    ChallengeOtpNotFoundException,
} from "@modules/exceptions"
import {
    ForgotPasswordResendOtpCommand,
} from "./forgot-password-resend-otp.command"
import {
    ForgotPasswordResendOtpHandler,
} from "./forgot-password-resend-otp.handler"

describe("ForgotPasswordResendOtpHandler",
    () => {
        let module: TestingModule
        let handler: ForgotPasswordResendOtpHandler
        let otpChallengeService: jest.Mocked<Pick<OtpChallengeService, "refreshActionChallengeOtp">>
        let enqueueSendMailJobService: jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>

        beforeEach(async () => {
            // rotates the OTP for an existing challenge (null when the id is unknown)
            otpChallengeService = {
                refreshActionChallengeOtp: jest.fn(),
            } as unknown as jest.Mocked<Pick<OtpChallengeService, "refreshActionChallengeOtp">>

            // mail worker hand-off — assert the refreshed OTP email is queued
            enqueueSendMailJobService = {
                enqueue: jest.fn(),
            } as unknown as jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>

            module = await Test.createTestingModule({
                providers: [
                    ForgotPasswordResendOtpHandler,
                    {
                        provide: OtpChallengeService,
                        useValue: otpChallengeService,
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: enqueueSendMailJobService,
                    },
                ],
            }).compile()

            handler = module.get<ForgotPasswordResendOtpHandler>(ForgotPasswordResendOtpHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("rotates the OTP and re-queues the reset email for a known challenge",
            async () => {
                // the challenge exists → a fresh OTP + expiry is returned
                otpChallengeService.refreshActionChallengeOtp.mockResolvedValueOnce({
                    email: "user@example.com",
                    otp: "654321",
                    expiresInSeconds: 300,
                } as never)

                const result = await handler.execute(
                    new ForgotPasswordResendOtpCommand({
                        request: {
                            challengeId: "chal-1",
                        },
                    }),
                )

                // the OTP is rotated for the given challenge id
                expect(otpChallengeService.refreshActionChallengeOtp).toHaveBeenCalledWith("chal-1")
                // the refreshed OTP is emailed using the password-reset template
                expect(enqueueSendMailJobService.enqueue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        subject: "Reset your password",
                        context: expect.objectContaining({
                            otp: "654321",
                            expiresInMinutes: 5,
                        }),
                    }),
                )
                // the same challenge id + new expiry are echoed back
                expect(result).toEqual({
                    challengeId: "chal-1",
                    expiresInSeconds: 300,
                })
            })

        it("throws when the challenge id is unknown (no email queued)",
            async () => {
                // refresh returns null → the challenge id does not exist / expired
                otpChallengeService.refreshActionChallengeOtp.mockResolvedValueOnce(null as never)

                await expect(
                    handler.execute(
                        new ForgotPasswordResendOtpCommand({
                            request: {
                                challengeId: "missing",
                            },
                        }),
                    ),
                ).rejects.toBeInstanceOf(ChallengeOtpNotFoundException)

                // nothing is emailed when there is no challenge to refresh
                expect(enqueueSendMailJobService.enqueue).not.toHaveBeenCalled()
            })
    })
