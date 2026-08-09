/** Message for when the Elasticsearch index reset starts dropping/recreating indices at boot. */
export interface ElasticsearchIndexResetStartedMessage {
    /** Number of concrete indices (entity x locale) being dropped and recreated. */
    indexCount: number
}

/** Message for when the Elasticsearch index reset finishes; indices are empty and awaiting sync. */
export interface ElasticsearchIndexResetDoneMessage {
    /** Number of concrete indices dropped and recreated. */
    indexCount: number
}

/**
 * Message for when a live index carries a mapping that no longer matches the declared one --
 * almost always an index auto-created by its first document from Elasticsearch dynamic defaults.
 */
export interface ElasticsearchIndexMappingDriftedMessage {
    /** The concrete index name (`<base>[-<locale>]`) that drifted. */
    index: string
    /** Number of documents the drifted index currently holds. */
    documentCount: number
    /** One `field: declared -> live` line per drifted field. */
    drifts: Array<string>
}

/** Message for when a drifted index has been recreated from its declared mapping. */
export interface ElasticsearchIndexMappingRepairedMessage {
    /** The concrete index name that was recreated. */
    index: string
    /** Number of documents carried across into the freshly mapped index. */
    documentCount: number
}
