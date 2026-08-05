import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
} from "@nestjs/common"
import {
    FileInterceptor,
} from "@nestjs/platform-express"
import {
    ApiOperation,
    ApiTags,
} from "@nestjs/swagger"
import {
    randomUUID,
} from "crypto"
import {
    MockFileRequiredException,
    MockFileTooLargeException,
} from "@modules/exceptions"
import {
    MockDelayInterceptor,
} from "../../interceptors"
import type {
    MulterFile,
    UploadedFileInfo,
} from "./types"

/** Per-file byte cap for the single-file upload demo (10 MB). */
const MAX_FILE_BYTES = 10 * 1024 * 1024

@ApiTags("mock")
@UseInterceptors(MockDelayInterceptor)
@Controller()
/**
 * Mock controller for lesson `0-multer-single-file-upload`.
 *
 * Mounted at the bare origin (the lesson frontend talks to
 * `new URL(VITE_API_BASE).origin`, not the session-scoped path), it accepts a
 * single multipart `file` field and echoes back the metadata multer would
 * report — without persisting anything to disk.
 */
export class MulterController {
    /**
     * Accepts a single multipart `file` field and returns its metadata.
     */
    @ApiOperation({
        summary: "Upload a single file (multipart)",
    })
    @Post("upload")
    @UseInterceptors(FileInterceptor("file"))
    upload(
        @UploadedFile() file: MulterFile | undefined,
    ): UploadedFileInfo {
        // the field is required — mirror multer's "no file" error
        if (!file) {
            throw new MockFileRequiredException({
                fieldName: "file",
            })
        }

        // guard the in-memory buffer against oversized uploads
        if (file.size > MAX_FILE_BYTES) {
            throw new MockFileTooLargeException({
                reason: "single-file upload",
                maxBytes: MAX_FILE_BYTES,
            })
        }

        // derive a uuid-prefixed storage filename, preserving the original
        const filename = `${randomUUID()}-${file.originalname}`

        return {
            originalName: file.originalname,
            filename,
            size: file.size,
            mimetype: file.mimetype,
            path: `uploads/${filename}`,
        }
    }
}
