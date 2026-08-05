import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Thrown by an ops-tools processing endpoint when the required multipart field was not sent. */
export interface ToolsFileRequiredExceptionMetadata extends AbstractExceptionMetadata {
    /** Name of the expected multipart field (e.g. "file", "files"). */
    fieldName?: string
}

/**
 * Thrown by the `apps/tools` ops console (DASH, media, upload) when the
 * required multipart file field was not sent.
 */
export class ToolsFileRequiredException extends AbstractException {
    constructor(
        {
            fieldName,
            originalError,
        }: ToolsFileRequiredExceptionMetadata,
    ) {
        super(
            "No file uploaded.",
            "TOOLS_FILE_REQUIRED_EXCEPTION",
            {
                fieldName,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
