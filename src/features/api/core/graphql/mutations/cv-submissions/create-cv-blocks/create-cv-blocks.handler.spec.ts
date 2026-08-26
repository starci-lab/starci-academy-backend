import {
    CreateCvBlocksHandler
} from "./create-cv-blocks.handler"
import {
    CreateCvBlocksCommand
} from "./create-cv-blocks.command"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"

describe("CreateCvBlocksHandler",
    () => {
        it("rejects an anonymous command and defaults omitted blocks/style",
            async () => {
                const create = jest.fn()
                const handler = new CreateCvBlocksHandler({
                    create
                } as never)
                await expect(handler.execute(new CreateCvBlocksCommand({
                    request: {
                        label: "CV"
                    }, user: undefined
                } as never))).rejects.toBeInstanceOf(UserNotFoundException)
                const saved = {
                    id: "cv1", label: "CV", blocks: [], style: {
                    }, pdfCdnKey: null, createdAt: new Date(), updatedAt: new Date()
                }
                create.mockReturnValue(saved)
                const save = jest.fn().mockResolvedValue(saved)
                const success = new CreateCvBlocksHandler({
                    create, save
                } as never)
                await expect(success.execute(new CreateCvBlocksCommand({
                    request: {
                        label: "CV"
                    }, user: {
                        id: "u1"
                    }
                } as never))).resolves.toMatchObject({
                    id: "cv1", blocks: [], style: {
                    }
                })
            })
    })
