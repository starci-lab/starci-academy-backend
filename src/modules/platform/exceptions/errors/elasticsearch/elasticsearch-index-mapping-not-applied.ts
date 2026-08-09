import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for an index that could not be created with its declared mapping. */
export interface ElasticsearchIndexMappingNotAppliedExceptionMetadata extends AbstractExceptionMetadata {
    /** The concrete index name (`<base>[-<locale>]`) the create targeted. */
    index: string
    /** Entity class name whose declared mapping was being applied. */
    entity: string
}

/**
 * Thrown when an index cannot be created with the mapping declared in
 * `src/modules/integrations/elasticsearch/mappings`.
 *
 * Swallowing this is what produced a fully dynamic index in the first place: the create failed, the
 * first indexed document auto-created the index instead, and every declared type was lost. Boot
 * fails loudly rather than serving a silently mistyped index.
 */
export class ElasticsearchIndexMappingNotAppliedException extends AbstractException {
    constructor({
        index,
        entity,
        originalError,
    }: ElasticsearchIndexMappingNotAppliedExceptionMetadata) {
        super(
            "Elasticsearch index could not be created with its declared mapping.",
            "ELASTICSEARCH_INDEX_MAPPING_NOT_APPLIED_EXCEPTION",
            {
                index,
                entity,
                originalError,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        )
    }
}
