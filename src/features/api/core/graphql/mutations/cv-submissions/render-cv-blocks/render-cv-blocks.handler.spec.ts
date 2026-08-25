import {
    RenderCvBlocksHandler
} from "./render-cv-blocks.handler"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
import {
    CvDocumentNotFoundException
} from "@modules/platform/exceptions/errors/cv/cv-document-not-found"

describe("RenderCvBlocksHandler",
    () => {
        const command = (user?: { id: string }) => ({
            params: {
                request: {
                    id: "cv", tex: "tex"
                }, user
            }
        }) as never
        it("rejects unauthenticated requests before reading the database",
            async () => {
                const manager = {
                    findOne: jest.fn()
                }
                const handler = new RenderCvBlocksHandler(manager as never,
{
} as never,
{
} as never)
                await expect((handler as unknown as { process(command: unknown): Promise<unknown> }).process(command())).rejects.toBeInstanceOf(UserNotFoundException)
                expect(manager.findOne).not.toHaveBeenCalled()
            })
        it("rejects a CV not owned by the requesting user",
            async () => {
                const manager = {
                    findOne: jest.fn().mockResolvedValue(null)
                }
                const handler = new RenderCvBlocksHandler(manager as never,
{
} as never,
{
} as never)
                await expect((handler as unknown as { process(command: unknown): Promise<unknown> }).process(command({
                    id: "user"
                }))).rejects.toBeInstanceOf(CvDocumentNotFoundException)
                expect(manager.findOne).toHaveBeenCalled()
            })
    })
