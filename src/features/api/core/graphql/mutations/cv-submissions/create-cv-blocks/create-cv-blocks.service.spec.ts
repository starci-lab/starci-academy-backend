import {
    CreateCvBlocksService
} from "./create-cv-blocks.service"

describe("CreateCvBlocksService",
    () => {
        it("forwards block creation params to the command bus",
            async () => {
                const execute = jest.fn().mockResolvedValue({
                    blocks: []
                })
                const params = {
                    user: {
                        id: "u-1"
                    }, request: {
                        blocks: []
                    }
                }
                await expect(new CreateCvBlocksService({
                    execute
                } as never).execute(params as never)).resolves.toEqual({
                    blocks: []
                })
                expect(execute).toHaveBeenCalledWith(expect.objectContaining({
                    params
                }))
            })
    })
