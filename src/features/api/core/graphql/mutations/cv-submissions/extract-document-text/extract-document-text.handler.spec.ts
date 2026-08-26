import {
    ExtractDocumentTextHandler
} from "./extract-document-text.handler"
import {
    ExtractDocumentTextCommand
} from "./extract-document-text.command"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
import {
    CvSubmissionExtractS3BufferEmptyException
} from "@modules/platform/exceptions/errors/api/review-cv-submission-extract"

describe("ExtractDocumentTextHandler",
    () => {
        it("rejects anonymous and empty S3 buffers",
            async () => {
                const buffer = jest.fn().mockResolvedValue(Buffer.alloc(0))
                const handler = new ExtractDocumentTextHandler({
                    buffer
                } as never)
                await expect(handler.execute(new ExtractDocumentTextCommand({
                    request: {
                        cdnKey: "cv.txt"
                    }, user: undefined
                } as never))).rejects.toBeInstanceOf(UserNotFoundException)
                await expect(handler.execute(new ExtractDocumentTextCommand({
                    request: {
                        cdnKey: "cv.txt"
                    }, user: {
                        id: "u1"
                    }
                } as never))).rejects.toBeInstanceOf(CvSubmissionExtractS3BufferEmptyException)
                expect(buffer).toHaveBeenCalled()
            })

        it("extracts plain text from a non-empty text document",
            async () => {
                const handler = new ExtractDocumentTextHandler({
                    buffer: jest.fn().mockResolvedValue(Buffer.from("Resume text")),
                } as never)
                await expect(handler.execute(new ExtractDocumentTextCommand({
                    request: {
                        cdnKey: "cv.txt"
                    },
                    user: {
                        id: "u1"
                    },
                } as never))).resolves.toEqual({
                    text: "Resume text"
                })
            })
    })
