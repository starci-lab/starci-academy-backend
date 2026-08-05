import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a ScyllaDB keyspace/table/column identifier that fails validation. */
export interface InvalidScyllaIdentifierExceptionMetadata extends AbstractExceptionMetadata {
    /** The identifier value that failed validation. */
    value: string
}

/**
 * Thrown when a ScyllaDB identifier (keyspace/table/column name) fails the
 * driver's identifier validation -- guards against building unsafe CQL from an
 * unvalidated string.
 */
export class InvalidScyllaIdentifierException extends AbstractException {
    constructor({
        value,
        originalError,
    }: InvalidScyllaIdentifierExceptionMetadata) {
        super(
            "Invalid Scylla identifier.",
            "INVALID_SCYLLA_IDENTIFIER_EXCEPTION",
            {
                value,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
