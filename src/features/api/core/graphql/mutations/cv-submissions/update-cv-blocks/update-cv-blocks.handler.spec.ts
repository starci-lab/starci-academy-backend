import {
    UpdateCvBlocksHandler
} from "./update-cv-blocks.handler"
import {
    UpdateCvBlocksCommand
} from "./update-cv-blocks.command"
import {
    CvDocumentNotFoundException
} from "@modules/platform/exceptions/errors/cv/cv-document-not-found"
describe("UpdateCvBlocksHandler",
    () => {
        const manager = {
            findOne: jest.fn(), save: jest.fn()
        }
        const handler = new UpdateCvBlocksHandler(manager as never)
        beforeEach(() => jest.clearAllMocks())
        it("rejects missing users and documents",
            async () => {
                await expect(handler.execute(new UpdateCvBlocksCommand({
                    request: {
                        id: "cv"
                    } as never, user: undefined
                } as never))).rejects.toThrow()
                manager.findOne.mockResolvedValueOnce(null)
                await expect(handler.execute(new UpdateCvBlocksCommand({
                    request: {
                        id: "cv"
                    } as never, user: {
                        id: "u"
                    }
                } as never))).rejects.toBeInstanceOf(CvDocumentNotFoundException)
            })
        it("applies partial fields and clears the generated PDF key",
            async () => {
                const entity = {
                    id: "cv", label: "old", blocks: [], style: {
                    }, pdfCdnKey: "old", createdAt: new Date(), updatedAt: new Date()
                }
                manager.findOne.mockResolvedValue(entity); manager.save.mockImplementation(async (value: unknown) => value)
                await expect(handler.execute(new UpdateCvBlocksCommand({
                    request: {
                        id: "cv", label: "new", blocks: [{
                            type: "text"
                        }]
                    } as never, user: {
                        id: "u"
                    }
                } as never))).resolves.toMatchObject({
                    label: "new", pdfCdnKey: null
                })
                expect(manager.save).toHaveBeenCalledWith(entity)
            })
    })
