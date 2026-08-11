import SuperJSON from "superjson"
import type {
    Redis,
} from "ioredis"
import {
    createHash,
} from "crypto"
import {
    OtpChallengeService,
} from "./otp-challenge.service"

describe("OtpChallengeService",
    () => {
        const superJson = new SuperJSON()
        let redis: {
            set: jest.Mock
            eval: jest.Mock
        }
        let service: OtpChallengeService

        beforeEach(() => {
            redis = {
                set: jest.fn().mockResolvedValue("OK"),
                eval: jest.fn(),
            }
            service = new OtpChallengeService(
                redis as unknown as Redis,
                superJson,
            )
        })

        it("stores a challenge-bound hash instead of the plaintext OTP",
            async () => {
                const created = await service.createActionChallenge({
                    email: "learner@starci.test",
                    payload: {
                        purpose: "sign-in",
                    },
                })

                const stored = superJson.parse<{
                    otpHash: string
                    attempts: number
                }>(redis.set.mock.calls[0][1] as string)
                expect(stored.otpHash).toBe(createHash("sha256")
                    .update(`${created.challengeId}:${created.otp}`)
                    .digest("hex"))
                expect(stored.otpHash).not.toContain(created.otp)
                expect(stored.attempts).toBe(0)
            })

        it.each([
            [
                ["not_found",
                    "0"],
                {
                    mismatch: false,
                    attemptsLeft: 0,
                    notFound: true,
                },
            ],
            [
                ["mismatch",
                    "3"],
                {
                    mismatch: true,
                    attemptsLeft: 3,
                    notFound: false,
                },
            ],
        ])("maps the atomic verification decision %j",
            async (scriptResult, expected) => {
                redis.eval.mockResolvedValue(scriptResult)

                await expect(service.verifyActionChallenge({
                    challengeId: "challenge-id",
                    otp: "123456",
                })).resolves.toEqual(expected)
            })

        it("returns and consumes the payload selected atomically by Redis",
            async () => {
                redis.eval.mockResolvedValue([
                    "verified",
                    superJson.stringify({
                        email: "learner@starci.test",
                        otpHash: "hash",
                        attempts: 0,
                        payload: {
                            accessToken: "access",
                        },
                    }),
                ])

                await expect(service.verifyActionChallenge({
                    challengeId: "challenge-id",
                    otp: "123456",
                })).resolves.toEqual({
                    email: "learner@starci.test",
                    payload: {
                        accessToken: "access",
                    },
                    mismatch: false,
                    attemptsLeft: 5,
                    notFound: false,
                })
            })

        it("returns null when an expired challenge cannot be rotated",
            async () => {
                redis.eval.mockResolvedValue([
                    "not_found",
                ])

                await expect(service.refreshActionChallengeOtp("expired"))
                    .resolves.toBeNull()
            })
    })
