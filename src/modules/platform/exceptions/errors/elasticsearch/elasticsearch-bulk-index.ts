import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for an Elasticsearch bulk index request with per-item failures. */
export interface ElasticsearchBulkIndexExceptionMetadata extends AbstractExceptionMetadata {
    /** The index name the bulk request targeted. */
    index: string
    /** The first per-item error reported in the bulk response. */
    firstError: unknown
}

/**
 * Thrown when an Elasticsearch bulk index request reports `errors: true` --
 * surfaces the first per-item failure instead of silently leaving the index
 * partially written.
 */
export class ElasticsearchBulkIndexException extends AbstractException {
    constructor({
        index,
        firstError,
        originalError,
    }: ElasticsearchBulkIndexExceptionMetadata) {
        super(
            "Elasticsearch bulk index request had errors.",
            "ELASTICSEARCH_BULK_INDEX_EXCEPTION",
            {
                index,
                firstError,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
