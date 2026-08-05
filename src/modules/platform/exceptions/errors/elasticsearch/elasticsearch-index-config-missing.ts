import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for an Elasticsearch operation given an entity with no configured index. */
export interface ElasticsearchIndexConfigMissingExceptionMetadata extends AbstractExceptionMetadata {
    /** The entity name looked up in `configMap`. */
    entity: string
}

/**
 * Thrown when {@link ElasticsearchService.indicateName} is called for an
 * entity that has no entry in `configMap` -- a new synced entity was added
 * without registering its index config.
 */
export class ElasticsearchIndexConfigMissingException extends AbstractException {
    constructor({
        entity,
        originalError,
    }: ElasticsearchIndexConfigMissingExceptionMetadata) {
        super(
            "Elasticsearch index config is missing for this entity.",
            "ELASTICSEARCH_INDEX_CONFIG_MISSING_EXCEPTION",
            {
                entity,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
