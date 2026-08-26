import {
    DeleteCvBlocksService
} from "./delete-cv-blocks.service"

describe("DeleteCvBlocksService",
    () => {
        it("forwards deletion params and returns the command result",
            async () => {
                const execute = jest.fn().mockResolvedValue({
                    deleted: 1
                })
                const params = {
                    user: {
                        id: "u-1"
                    }, request: {
                        ids: ["block-1"]
                    }
                }
                await expect(new DeleteCvBlocksService({
                    execute
                } as never).execute(params as never)).resolves.toEqual({
                    deleted: 1
                })
                expect(execute).toHaveBeenCalledWith(expect.objectContaining({
                    params
                }))
            })
    })
