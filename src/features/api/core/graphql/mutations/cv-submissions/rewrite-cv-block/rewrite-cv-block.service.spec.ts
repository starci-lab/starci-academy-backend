import {
    RewriteCvBlockService
} from "./rewrite-cv-block.service"

describe("RewriteCvBlockService",
    () => {
        it("delegates block rewrite params and returns the response",
            async () => {
                const execute = jest.fn().mockResolvedValue({
                    blockId: "block-1"
                })
                const params = {
                    user: {
                        id: "u-1"
                    }, request: {
                        blockId: "block-1", instruction: "make concise"
                    }
                }
                await expect(new RewriteCvBlockService({
                    execute
                } as never).execute(params as never)).resolves.toEqual({
                    blockId: "block-1"
                })
                expect(execute).toHaveBeenCalledWith(expect.objectContaining({
                    params
                }))
            })
    })
