/**
 * Shape of the `_source` payload returned for a single Elasticsearch hit
 * by the index-search query. All fields are optional because the source
 * may be partially populated or absent depending on the indexed document.
 */
export interface IndexSearchHitSource {
    /** Primary identifier of the indexed entity. */
    id?: string
    /** Human-readable display identifier of the indexed entity. */
    displayId?: string
    /** Title of the indexed entity. */
    title?: string
}

/**
 * Catalog descriptor mapping an `IndexSearchType` to its Elasticsearch index
 * name and the originating database entity name.
 */
export interface IndexSearchCatalogEntry {
    /** Elasticsearch index the type is searched against. */
    index: string
    /** Database entity name the indexed documents originate from. */
    entityName: string
}
