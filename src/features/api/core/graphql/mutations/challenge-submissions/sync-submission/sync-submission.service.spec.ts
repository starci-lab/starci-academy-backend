import {
    SyncSubmissionService
} from "./sync-submission.service"

describe("SyncSubmissionService",
    () => {
        it("delegates draft synchronization and preserves the command result",
            async () => {
                const execute = jest.fn().mockResolvedValue(undefined)
                const params = {
                    userId: "u-1", submissionId: "s-1", code: "return 1"
                }
                await expect(new SyncSubmissionService({
                    execute
                } as never).execute(params as never)).resolves.toBeUndefined()
                expect(execute).toHaveBeenCalledWith(expect.objectContaining({
                    params
                }))
            })
    })
