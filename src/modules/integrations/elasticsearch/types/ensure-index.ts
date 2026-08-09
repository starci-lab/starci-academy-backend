import type {
    ElasticsearchIndexMapping,
} from "../mappings/types"

/** Params for creating a concrete index from its declared mapping. */
export interface CreateIndexParams {
    /** Concrete index name (`<base>[-<locale>]`). */
    index: string
    /** Entity class name owning the index -- reported when the mapping cannot be applied. */
    entity: string
    /** Declared mapping (settings + mappings); omitted means dynamic mapping. */
    mapping?: ElasticsearchIndexMapping
}

/** Params for comparing a live index mapping against its declaration. */
export interface DetectMappingDriftParams {
    /** Concrete index name to read the live mapping from. */
    index: string
    /** Declared `mappings` block to compare against. */
    mapping: Record<string, unknown>
}
