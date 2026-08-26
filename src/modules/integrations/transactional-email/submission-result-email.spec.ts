import {
    enqueueSubmissionResultEmail
} from "./submission-result-email"
describe("enqueueSubmissionResultEmail",
    () => {
        it("skips incomplete submissions and formats a complete Vietnamese message",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValueOnce({
                        user: {
                        }
                    }).mockResolvedValueOnce({
                        user: {
                            email: "a@b.com", displayName: "A"
                        }, submission: {
                            challenge: {
                                title: "Challenge"
                            }
                        }
                    })
                }
                const enqueue = {
                    enqueue: jest.fn().mockResolvedValue(undefined)
                }
                await enqueueSubmissionResultEmail({
                    entityManager: manager as never, enqueueSendMailJobService: enqueue as never, userChallengeSubmissionId: "s", score: 90, feedback: null, webBaseUrl: "https://app", locale: "vi" as never
                })
                await enqueueSubmissionResultEmail({
                    entityManager: manager as never, enqueueSendMailJobService: enqueue as never, userChallengeSubmissionId: "s", score: 90, feedback: null, webBaseUrl: "https://app", locale: "vi" as never
                })
                expect(enqueue.enqueue).toHaveBeenCalledWith(expect.objectContaining({
                    subject: expect.stringContaining("Challenge"), template: "submission-result"
                }))
            })
        it("swallows enqueue failures",
            async () => {
                const manager = {
                    findOne: jest.fn().mockRejectedValue(new Error("db"))
                }
                await expect(enqueueSubmissionResultEmail({
                    entityManager: manager as never, enqueueSendMailJobService: {
                    } as never, userChallengeSubmissionId: "s", score: 1, webBaseUrl: "url"
                })).resolves.toBeUndefined()
            })
    })
