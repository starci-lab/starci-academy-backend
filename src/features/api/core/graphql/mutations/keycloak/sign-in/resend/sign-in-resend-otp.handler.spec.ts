// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
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
    SignInResendOtpCommand,
} from "./sign-in-resend-otp.command"
import {
    SignInResendOtpHandler,
} from "./sign-in-resend-otp.handler"

describe("SignInResendOtpHandler",
    () => {
        let module: TestingModule
        let handler: SignInResendOtpHandler
        let otpChallengeService: jest.Mocked<Pick<OtpChallengeService, "refreshActionChallengeOtp">>
        let enqueueSendMailJobService: jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>

        beforeEach(async () => {
            // rotates the OTP for an existing challenge (null when the id is unknown)
            otpChallengeService = {
                refreshActionChallengeOtp: jest.fn(),
            } as unknown as jest.Mocked<Pick<OtpChallengeService, "refreshActionChallengeOtp">>

            // mail worker hand-off -- assert the refreshed OTP email is queued
            enqueueSendMailJobService = {
                enqueue: jest.fn(),
            } as unknown as jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>

            module = await Test.createTestingModule({
                providers: [
                    SignInResendOtpHandler,
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

            handler = module.get<SignInResendOtpHandler>(SignInResendOtpHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("rotates the OTP and re-queues the email for a known challenge",
            async () => {
                // the challenge exists -> a fresh OTP + expiry is returned
                otpChallengeService.refreshActionChallengeOtp.mockResolvedValueOnce({
                    email: "user@example.com",
                    otp: "654321",
                    expiresInSeconds: 300,
                } as never)

                const result = await handler.execute(
                    new SignInResendOtpCommand({
                        request: {
                            challengeId: "chal-1",
                        },
                    }),
                )

                // the OTP is rotated for the given challenge id
                expect(otpChallengeService.refreshActionChallengeOtp).toHaveBeenCalledWith("chal-1")
                // the refreshed OTP is emailed to the challenge's address
                expect(enqueueSendMailJobService.enqueue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        template: "sign-in-otp",
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
                // refresh returns null -> the challenge id does not exist / expired
                otpChallengeService.refreshActionChallengeOtp.mockResolvedValueOnce(null as never)

                await expect(
                    handler.execute(
                        new SignInResendOtpCommand({
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
