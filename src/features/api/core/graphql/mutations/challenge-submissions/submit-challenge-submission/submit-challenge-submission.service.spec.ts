import {
    SubmitChallengeSubmissionService
} from "./submit-challenge-submission.service"

describe("SubmitChallengeSubmissionService",
    () => {
        it("delegates a submission and returns the handler result",
            async () => {
                const execute = jest.fn().mockResolvedValue({
                    jobId: "job-1"
                })
                const params = {
                    userId: "u-1", challengeId: "c-1", code: "answer"
                }
                await expect(new SubmitChallengeSubmissionService({
                    execute
                } as never).execute(params as never)).resolves.toEqual({
                    jobId: "job-1"
                })
                expect(execute).toHaveBeenCalledWith(expect.objectContaining({
                    params
                }))
            })
    })
