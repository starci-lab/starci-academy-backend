import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Thrown when a requested foundations mount file does not exist or is unreadable. */
export interface MountFoundationsFileNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    relativePath?: string
}

/**
 * Thrown when `GET /mount/foundations/*path` cannot resolve or read the
 * requested file -- bad path, no filesystem context configured, or the file
 * itself is missing. Maps to 404 (the same shape a missing static file gets).
 */
export class MountFoundationsFileNotFoundException extends AbstractException {
    constructor({
        relativePath,
        originalError,
    }: MountFoundationsFileNotFoundExceptionMetadata) {
        super(
            "Foundations mount file not found.",
            "MOUNT_FOUNDATIONS_FILE_NOT_FOUND_EXCEPTION",
            {
                relativePath,
                originalError,
            },
            HttpStatus.NOT_FOUND,
        )
    }
}
