import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Thrown when a target id referenced by a processing request does not resolve to a saved target. */
export interface ToolsTargetReferenceInvalidExceptionMetadata extends AbstractExceptionMetadata {
    targetId: string
}

/**
 * Thrown by the `apps/tools` ops console (DASH, media, upload, pg-backup) when
 * a `targetIds` entry on a processing request does not match a saved S3 target
 * -- a validation error on the caller's input, not a resource lookup.
 */
export class ToolsTargetReferenceInvalidException extends AbstractException {
    constructor(
        {
            targetId,
            originalError,
        }: ToolsTargetReferenceInvalidExceptionMetadata,
    ) {
        super(
            "Target does not exist.",
            "TOOLS_TARGET_REFERENCE_INVALID_EXCEPTION",
            {
                targetId,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}

/** Thrown when a saved S3 target CRUD lookup (update/delete) does not match any record. */
export interface ToolsTargetNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    targetId: string
}

/**
 * Thrown by the `apps/tools` targets controller when `PATCH`/`DELETE
 * /targets/:id` is given an id with no matching saved target.
 */
export class ToolsTargetNotFoundException extends AbstractException {
    constructor(
        {
            targetId,
            originalError,
        }: ToolsTargetNotFoundExceptionMetadata,
    ) {
        super(
            "Target not found.",
            "TOOLS_TARGET_NOT_FOUND_EXCEPTION",
            {
                targetId,
                originalError,
            },
            HttpStatus.NOT_FOUND,
        )
    }
}
